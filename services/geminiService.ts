import { GoogleGenAI, Type } from "@google/genai";
import { GenerateArchitectureResponse, NodeDetail } from "../types";

const SYSTEM_INSTRUCTION = `
You are **ArchMind**, an elite AI Solutions Architect specializing in **Deep Agent Frameworks (AutoGPT, BabyAGI)** and **LangChain/LangGraph Orchestration**.

**OBJECTIVE:**
Create HIGH-GRANULARITY, organized technical architecture diagrams. Your goal is maximum legibility and zero visual "clash".

**STRICT LAYERING & FLOW RULES:**
1. **Vertical Hierarchy**: Use \`flowchart TD\`. The data should flow strictly from top (Interface) to bottom (Data/Storage).
2. **Internal Directions**: Inside each \`subgraph\`, explicitly state \`direction TB\` for sequential steps or \`direction LR\` for parallel tools/services to keep them aligned.
3. **Containment**: Every single node MUST reside inside a logical \`subgraph\`.
4. **Logical Separation**: 
   - Layer 1: [Interface/User Layer]
   - Layer 2: [Orchestration/Control Plane] (LangChain chains, routers)
   - Layer 3: [Intelligence/Agent Core] (LLM, prompt handlers, state)
   - Layer 4: [Execution/Tool Layer] (Parallel tools, APIs)
   - Layer 5: [Persistence/Data Layer] (Vector DBs, SQL, Cache)
5. **Connection Cleanliness**: Minimize long-distance connections that cross more than two layers. Use intermediate nodes (like "Gateways" or "Dispatchers") if a flow needs to span the whole diagram.

**STRICT SYNTAX RULES:**
- NEVER use colons (\`:\`) outside of quoted strings.
- NEVER append text after a node definition.
- Use \`%%\` for comments on separate lines.

**VISUAL CLASSES:**
- Use classDef:
  - 'plain': Standard services.
  - 'db': Databases/Vector Stores.
  - 'queue': Message brokers.
  - 'logic': AI Models/Agents.
  - 'edge': External APIs.

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
      let processed = line.replace(/\]\s*:\s*--.*$/, ']');
      processed = processed.replace(/\)\s*:\s*--.*$/, ')');
      processed = processed.replace(/\]\s*:\s*.*$/, ']');
      
      if (/^\s*%%/.test(processed)) return processed;
      const commentIdx = processed.indexOf('%%');
      return commentIdx !== -1 ? processed.substring(0, commentIdx).trimEnd() : processed.trimEnd();
    })
    .filter(line => line.trim().length > 0)
    .join('\n');

  cleaned = cleaned.replace(/graph\s+(LR|RL|BT|TD)/g, 'flowchart TD');
  cleaned = cleaned.replace(/flowchart\s+(LR|RL|BT)/g, 'flowchart TD');
  
  if (!cleaned.trim().startsWith('flowchart TD')) {
    cleaned = 'flowchart TD\n' + cleaned.replace(/^flowchart\s+TD\s*/, '');
  }

  const normalizeLabel = (label: string) => {
    let content = label.trim().replace(/^"(.*)"$/, '$1').trim();
    content = content.split(':')[0].trim();
    content = content.replace(/"/g, "'"); 
    return `"${content}"`;
  };

  cleaned = cleaned.replace(/\[\/\s*(.*?)\s*\/\]/g, (_, c) => `[/${normalizeLabel(c)}/]`);
  cleaned = cleaned.replace(/\(\[\s*(.*?)\s*\]\)/g, (_, c) => `([${normalizeLabel(c)}])`);
  cleaned = cleaned.replace(/\[\(\s*(.*?)\s*\)\]/g, (_, c) => `[(${normalizeLabel(c)})]`);
  cleaned = cleaned.replace(/\{\{\s*(.*?)\s*\}\}/g, (_, c) => `{{${normalizeLabel(c)}}}`);
  
  cleaned = cleaned.replace(/([a-zA-Z0-9_-]+)\[\s*([^"\]\n]*?)\s*\]/g, (match, id, content) => {
    const lowerId = id.toLowerCase();
    if (['subgraph', 'class', 'click', 'style', 'classdef', 'direction'].includes(lowerId)) return match;
    return `${id}[${normalizeLabel(content)}]`;
  });

  return cleaned;
};

export const generateArchitecture = async (prompt: string, repoContext?: string): Promise<GenerateArchitectureResponse> => {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
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
        finalPrompt = `${prompt}\n\nProvide an extremely detailed, logically grouped diagram using subgraphs for each system layer. Focus on clear, non-overlapping flow.`;
    }

    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
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