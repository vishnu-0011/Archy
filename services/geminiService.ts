import { GoogleGenAI } from "@google/genai";
import { GenerateArchitectureResponse } from "../types";

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

export const generateArchitecture = async (prompt: string, repoContext?: string): Promise<GenerateArchitectureResponse> => {
  try {
    if (!process.env.API_KEY) {
      throw new Error("Gemini API Key is missing. Please properly set GEMINI_API_KEY in your .env file.");
    }
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

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

    // Using gemini-1.5-flash for speed and reliability (2.0-flash-lite was causing issues)
    let response;
    const MAX_RETRIES = 3;
    const BASE_DELAY = 1000;

    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
      try {
        response = await ai.models.generateContent({
          model: 'gemini-2.5-flash-lite',
          contents: finalPrompt,
          config: {
            systemInstruction: SYSTEM_INSTRUCTION,
            temperature: 0.2,
            responseMimeType: "application/json",
          },
        });
        break; // Success
      } catch (err: any) {
        // Retrying logic...
        const isTransient =
          err?.status === 503 ||
          err?.error?.code === 503 ||
          err?.status === 429 ||
          err?.error?.code === 429;

        if (isTransient && attempt < MAX_RETRIES) {
          const delay = BASE_DELAY * Math.pow(2, attempt - 1);
          console.warn(`Gemini API attempt ${attempt} failed (Status ${err?.status || err?.error?.code}). Retrying in ${delay}ms...`);
          await new Promise(resolve => setTimeout(resolve, delay));
        } else {
          throw err;
        }
      }
    }

    const text = response.text || "";
    let data;
    try {
      // Clean up markdown block if present
      const jsonString = text.replace(/```json/g, '').replace(/```/g, '').trim();
      data = JSON.parse(jsonString);
    } catch (e) {
      console.error("Failed to parse JSON response:", text);
      // Fallback
      return {
        explanation: "Error parsing AI response. The raw output is shown below.",
        mermaidCode: cleanMermaidCode(text)
      };
    }

    return {
      explanation: data.strategic_overview || "No explanation provided.",
      mermaidCode: cleanMermaidCode(data.mermaid_code || ""),
      nodeDescriptions: data.node_descriptions || {}
    };

  } catch (error: any) {
    console.error("Gemini API Error:", error);
    if (error?.status === 503 || error?.error?.code === 503) {
      throw new Error("Service is currently overloaded (503). Please try again in a few moments.");
    }
    throw new Error(`Failed to generate architecture diagram: ${error instanceof Error ? error.message : "Unknown error"}`);
  }
};