import { GoogleGenAI } from "@google/genai";
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
`;

const cleanMermaidCode = (code: string): string => {
  let cleaned = code;
  cleaned = cleaned.replace(/\[\/([^"\]\n]*?\([^\n]*?\)[^"\]\n]*?)\/\]/g, '[/"$1"/]');
  cleaned = cleaned.replace(/&gt;/g, '>');
  cleaned = cleaned.replace(/&lt;/g, '<');
  cleaned = cleaned.replace(/&amp;/g, '&');
  return cleaned;
};

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(450).json({ error: 'Method Not Allowed' });
  }

  const { prompt, repoContext } = req.body;

  if (!prompt) {
    return res.status(400).json({ error: 'Prompt is required' });
  }

  const apiKey = process.env.GEMINI_API_KEY || process.env.API_KEY;

  if (!apiKey) {
    return res.status(500).json({ error: 'Gemini API Key is not configured on the server.' });
  }

  try {
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

    const result = await ai.models.generateContent({
      model: 'gemini-2.5-flash-lite',
      contents: finalPrompt,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        temperature: 0.2,
        responseMimeType: "application/json",
      },
    });

    const text = result.text || "";

    
    let data;
    try {
      const jsonString = text.replace(/```json/g, '').replace(/```/g, '').trim();
      data = JSON.parse(jsonString);
    } catch (e) {
      return res.status(200).json({
        explanation: "Error parsing AI response. The raw output is shown below.",
        mermaidCode: cleanMermaidCode(text),
        diagramImageUrl: getMermaidImageUrl(cleanMermaidCode(text), true)
      });
    }

    const mermaidCode = cleanMermaidCode(data.mermaid_code || "");

    return res.status(200).json({
      explanation: data.strategic_overview || "No explanation provided.",
      mermaidCode,
      diagramImageUrl: getMermaidImageUrl(mermaidCode, true),
      nodeDescriptions: data.node_descriptions || {}
    });

  } catch (error: any) {
    console.error("Vercel Function Error:", error);
    return res.status(500).json({ 
      error: `Failed to generate architecture: ${error.message || 'Unknown error'}` 
    });
  }
}
