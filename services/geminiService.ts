import { GoogleGenAI, Type } from "@google/genai";
import { GenerateArchitectureResponse, NodeDetail } from "../types";

const SYSTEM_INSTRUCTION = `
You are **ArchMind**, an elite AI Solutions Architect specializing in **Deep Agent Frameworks (AutoGPT, BabyAGI)** and **LangChain/LangGraph Orchestration**.

**OBJECTIVE:**
Create HIGH-GRANULARITY, organized technical architecture diagrams. Your goal is maximum legibility and zero visual "clash".

**STRICT LAYERING & FLOW RULES - HORIZONTAL FLOW (MATCHING AWS/CLOUD STANDARD):**
1. **Global Horizontal Flow**: Use \`flowchart LR\`. The flow must traverse strictly Left-to-Right.
   - **Left**: Users / Clients / Edge Devices
   - **Center-Left**: Interface / Gateways / Load Balancers
   - **Center-Right**: Application Logic / Microservices / Processing
   - **Right**: Data Storage / Analytics / External Services
2. **Subgraph Stewardship**: 
   - Group related nodes logically (e.g., "Public Subnet", "Service Layer", "VPC").
   - Use \`direction TB\` inside small subgraphs if needed to stack items vertically within a column, but keep the overall flow LR.
3. **Structured Alignment**: Ensure all nodes of a similar type (e.g., all databases) appear roughly in the same vertical plane (column).
4. **Connection Hygiene**:
   - Arrows travel Left->Right. 
   - Avoid "backwards" arrows (Right->Left) for main data flow; use dotted lines \`-.->\` for feedback loops.
   - Use intermediate nodes for clean routing if spanning the entire diagram.

**STRICT SYNTAX RULES:**
- NEVER leave a dangling arrow at the end of a line (e.g., "A --> B -->" is invalid).
- NEVER use colons (\`:\`) outside of quoted strings.
- NEVER append text after a node definition like "nodeId[Label] ::: class - Description".
- A line must end immediately after the node shape or the class assignment (e.g., \`nodeId["Label"]:::plain\`).
- Use \`%%\` for comments on separate lines.

**VISUAL CLASSES:**
- Use classDef:
  - 'plain': Standard services.
  - 'db': Databases/Vector Stores.
  - 'queue': Message brokers.
  - 'logic': AI Models/Agents.
  - 'edge': External APIs.

**ICONS & STYLING:**
- You MAY use FontAwesome icons in node labels to enhance visual appeal.
- Format: \`id["fa:fa-icon-name Label Text"]\`
- Examples: \`fa:fa-database\`, \`fa:fa-server\`, \`fa:fa-brain\`, \`fa:fa-cloud\`, \`fa:fa-bolt\`, \`fa:fa-users\`.


**OUTPUT:**
Return a JSON object with:
- "explanation": Deep technical reasoning.
- "mermaidCode": The Mermaid flowchart code.
- "nodeDetails": Metadata for EVERY node.
`;

const cleanMermaidCode = (code: string): string => {
  let lines = code.split('\n');

  let cleaned = lines
    .map(line => {
      let processed = line.trim();

      // Ignore comments
      if (processed.startsWith('%%')) return processed;

      // 1. Remove dangling arrows at the end of lines (e.g., A --> B -->)
      // Matches -->, ---, -.->, ==> and variations, including labels like |text|
      processed = processed.replace(/\s*(-{2,}>?|\.-+>|={2,}>)(?:\|[^|]+\|)?\s*$/, '');

      // 2. Remove trailing natural language descriptions after node shapes
      // Strict: Only remove if follows ' :' or ' - ' AND does not look like an arrow
      // Matches: node[...] : description
      processed = processed.replace(/(\]|\)|\}|>)\s*:\s+[^;]*$/, '$1');

      // Matches: node[...] - description (BUT NOT node[...] --> node)
      // We look for " - " that is NOT followed by ">" or part of "->"
      processed = processed.replace(/(\]|\)|\}|>)\s+-\s+(?!>|.*>).*$/, '$1');

      // 3. Remove trailing text after class assignments
      // Matches node:::class Description -> node:::class
      processed = processed.replace(/(:::[a-zA-Z0-9_-]+)\s+(?![-=.>]).*$/, '$1');

      // 4. Remove trailing colons that AI likes to add as annotations
      processed = processed.replace(/:\s*$/, '');

      return processed;
    })
    .filter(line => line.length > 0)
    // Filter out lines that are now just arrows
    .filter(line => !/^(\s*(-{2,}>?|\.-+>|={2,}>)(?:\|[^|]+\|)?\s*)$/.test(line.trim()))
    .join('\n');

  // Ensure flowchart LR
  cleaned = cleaned.replace(/graph\s+(LR|RL|BT|TD)/g, 'flowchart LR');
  cleaned = cleaned.replace(/flowchart\s+(LR|RL|BT|TD)/g, 'flowchart LR');

  if (!cleaned.trim().startsWith('flowchart LR')) {
    cleaned = 'flowchart LR\n' + cleaned.replace(/^flowchart\s+(TD|LR|BT|RL)\s*/, '');
  }

  const normalizeLabel = (label: string) => {
    let content = label.trim().replace(/^"(.*)"$/, '$1').trim();
    // Allow colons for icons (fa:fa-icon) and general text. 
    // Only remove quotes which are re-added at the end.
    content = content.replace(/"/g, "'");
    return `"${content}"`;
  };

  // Ensure shapes and labels are quoted and clean
  cleaned = cleaned.replace(/\[\/\s*(.*?)\s*\/\]/g, (_, c) => `[/${normalizeLabel(c)}/]`);
  cleaned = cleaned.replace(/\(\[\s*(.*?)\s*\]\)/g, (_, c) => `([${normalizeLabel(c)}])`);
  cleaned = cleaned.replace(/\[\(\s*(.*?)\s*\)\]/g, (_, c) => `[(${normalizeLabel(c)})]`);
  cleaned = cleaned.replace(/\{\{\s*(.*?)\s*\}\}/g, (_, c) => `{{${normalizeLabel(c)}}}`);

  // Clean basic square brackets while avoiding keywords
  cleaned = cleaned.replace(/([a-zA-Z0-9_-]+)\[\s*([^"\]\n]*?)\s*\]/g, (match, id, content) => {
    const lowerId = id.toLowerCase();
    if (['subgraph', 'class', 'click', 'style', 'classdef', 'direction'].includes(lowerId)) return match;
    return `${id}[${normalizeLabel(content)}]`;
  });

  return cleaned;
};

export const generateArchitecture = async (prompt: string, repoContext?: string): Promise<GenerateArchitectureResponse> => {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

    let finalPrompt = prompt;
    if (repoContext) {
      finalPrompt = `
**CONTEXT: GITHUB REPOSITORY ANALYSIS**
${repoContext}

**USER REQUEST:**
${prompt}

Synthesize a highly organized, layered architecture. Ensure subgraphs have internal 'direction' statements.
        `;
    } else {
      finalPrompt = `${prompt}\n\nProvide an extremely detailed, logically grouped diagram using subgraphs for each system layer. Focus on clear, non-overlapping flow. Ensure EVERY node is assigned a class from the set: plain, db, queue, logic, edge.`;
    }

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: finalPrompt,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            explanation: { type: Type.STRING },
            mermaidCode: { type: Type.STRING },
            nodeDetails: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.STRING },
                  label: { type: Type.STRING },
                  description: { type: Type.STRING },
                  technologies: { type: Type.ARRAY, items: { type: Type.STRING } },
                  relatedComponents: { type: Type.ARRAY, items: { type: Type.STRING } }
                },
                required: ["id", "label", "description"]
              }
            }
          },
          required: ["explanation", "mermaidCode", "nodeDetails"]
        },
        temperature: 0.1,
      },
    });

    const text = response.text || "{}";
    const result = JSON.parse(text);

    return {
      explanation: result.explanation || "",
      mermaidCode: cleanMermaidCode(result.mermaidCode || ""),
      nodeDetails: result.nodeDetails || []
    };

  } catch (error) {
    console.error("Gemini API Error:", error);
    throw new Error("Failed to generate architecture diagram.");
  }
};