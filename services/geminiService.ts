import { GoogleGenAI } from "@google/genai";
import { GenerateArchitectureResponse } from "../types";
import { getMermaidImageUrl } from "../utils/mermaidUtils";

const SYSTEM_INSTRUCTION = `
You are **ArchMind**, an autonomous AI Solutions Architect modeled after a "Deep Agent" reasoning framework.

**OBJECTIVE:**
Design highly **organized**, **readable**, and **professional** system architecture diagrams using Mermaid.js.

**CRITICAL PRIORITY: VISUAL CLARITY & SYNTAX SAFETY**
1.  **Layout Direction**: **ALWAYS** use \`graph TB\` (Top-to-Bottom).
2.  **Strict Verticality**: Ensure all data flows strictly from Top to Bottom.
3.  **No Nesting**: **DO NOT NEST SUBGRAPHS**. Flatten the hierarchy.

**OUTPUT FORMAT (STRICT JSON):**
You MUST return a VALID JSON object with the following structure. Do not return plain markdown.
\`\`\`json
{
  "strategic_overview": "A concise explanation (3-4 sentences)...",
  "mermaid_code": "graph TB\\n...",
  "node_descriptions": {
    "NodeID": "Detailed description of this component's role...",
    "User": "The end user accessing the application..."
  }
}
\`\`\`

**MERMAID SYNTAX RULES:**
1.  **Node IDs**: Use simple alphanumeric IDs (e.g., \`AuthService\`, \`UserDB\`).
2.  **Labels**: ALWAYS quote labels: \`id["Label"]\`.
3.  **No Comments**: Do not include comments in the mermaid string.

**EXAMPLE JSON OUTPUT:**
\`\`\`json
{
  "strategic_overview": "This architecture uses a microservices pattern...",
  "mermaid_code": "graph TB\\n  Client --> API",
  "node_descriptions": {
    "Client": "React-based frontend application.",
    "API": "Node.js API Gateway handling requests."
  }
}
\`\`\`
`;

const cleanMermaidCode = (code: string): string => {
  let cleaned = code;
  // Fix unquoted parallelogram labels containing parentheses: [/Label (Text)/] -> [/"Label (Text)"/]
  cleaned = cleaned.replace(/\[\/([^"\]\n]*?\([^\n]*?\)[^"\]\n]*?)\/\]/g, '[/"$1"/]');

  // Replace HTML entities
  cleaned = cleaned.replace(/&gt;/g, '>');
  cleaned = cleaned.replace(/&lt;/g, '<');
  cleaned = cleaned.replace(/&amp;/g, '&'); // Be careful with this one, might break things if not in label

  return cleaned;
};

export const generateArchitecture = async (prompt: string, repoContext?: string, apiKeyOverride?: string): Promise<GenerateArchitectureResponse> => {
  // 1. If in browser, use Vercel Serverless Function Proxy for security
  if (typeof window !== 'undefined') {
    try {
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, repoContext })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate via serverless function');
      }

      return await response.json();
    } catch (error: any) {
      console.error("Proxy Error:", error);
      throw new Error(`Cloud Generation Failed: ${error.message}`);
    }
  }

  // 2. If in Node (MCP Server/Local CLI), use direct API access
  try {
    const apiKey = apiKeyOverride || process.env.GEMINI_API_KEY || process.env.API_KEY;
    
    if (!apiKey) {
      throw new Error("Gemini API Key is missing. Please properly set GEMINI_API_KEY in your .env file or environment.");
    }
    const ai = new GoogleGenAI({ apiKey });

    let finalPrompt = prompt;
    if (repoContext) {
      finalPrompt = `
**CONTEXT: GITHUB REPOSITORY ANALYSIS**
The user has provided a GitHub repository. Use the following file structure, readme summary, and dependency information to infer the architecture.
Identify the key frameworks, databases, and architectural patterns (e.g., MVC, Microservices, Serverless) used in this project.

${repoContext}

**USER REQUEST:**
${prompt}
        `;
    }

    // Using gemini-2.5-flash-lite for speed and reliability
    let response;
    const MAX_RETRIES = 3;
    const BASE_DELAY = 1000;

    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
      try {
        const result = await ai.models.generateContent({
          model: 'gemini-2.5-flash-lite',
          contents: finalPrompt,
          config: {
            systemInstruction: SYSTEM_INSTRUCTION,
            temperature: 0.2,
            responseMimeType: "application/json",
          },
        });
        response = await result.response;
        break; 
      } catch (err: any) {
        const isTransient = err?.status === 503 || err?.status === 429;
        if (isTransient && attempt < MAX_RETRIES) {
          const delay = BASE_DELAY * Math.pow(2, attempt - 1);
          await new Promise(resolve => setTimeout(resolve, delay));
        } else {
          throw err;
        }
      }
    }

    const text = response ? response.text() : "";
    let data;
    try {
      const jsonString = text.replace(/```json/g, '').replace(/```/g, '').trim();
      data = JSON.parse(jsonString);
    } catch (e) {
      const cleaned = cleanMermaidCode(text);
      return {
        explanation: "Error parsing AI response. The raw output is shown below.",
        mermaidCode: cleaned,
        diagramImageUrl: getMermaidImageUrl(cleaned, true)
      };
    }

    const mermaidCode = cleanMermaidCode(data.mermaid_code || "");
    
    return {
      explanation: data.strategic_overview || "No explanation provided.",
      mermaidCode,
      diagramImageUrl: getMermaidImageUrl(mermaidCode, true),
      nodeDescriptions: data.node_descriptions || {}
    };

  } catch (error: any) {
    console.error("Gemini API Error:", error);
    throw new Error(`Failed to generate architecture diagram: ${error instanceof Error ? error.message : "Unknown error"}`);
  }
};