import { GoogleGenAI } from "@google/genai";
import { GenerateArchitectureResponse } from "../types.js";
import { getMermaidImageUrl } from "../utils/mermaidUtils.js";

const SYSTEM_INSTRUCTION = `
You are **ArchMind v1.2**, a high-fidelity AI Solutions Architect.
Your goal is to generate professional, organized, and structurally sound architecture diagrams using Mermaid.js.

### ARCHITECTURAL STANDARDS:
1.  **Structural Organization (MANDATORY)**:
    - You MUST organize your diagram using \`subgraph\` blocks to represent logical or physical tiers.
    - Standard tiers: 
        * \`Tier_Frontend\` (UI, ClientApps, Mobile)
        * \`Tier_API\` (Gateways, Load Balancers, Routers)
        * \`Tier_Services\` (Core Business Logic, Microservices, Background Workers)
        * \`Tier_Data\` (Databases, Caches, File Storage)
        * \`Tier_External\` (Third-party APIs, SaaS, External Systems)

2.  **Semantic Node Definitions**:
    - Users: \`User([End User]):::client\`
    - UI Apps: \`App([Application]):::client\`
    - API Entry: \`Gateway{{API Gateway}}:::gateway\`
    - Processing: \`Service[Business Logic]:::service\`
    - Persistence: \`DB[(Database)]:::db\`

3.  **Visual Hierarchy**:
    - Use \`graph TD\` for deep hierarchical systems or \`graph LR\` for high-level data flows.
    - Apply CSS classes consistently: \`:::client\`, \`:::gateway\`, \`:::service\`, \`:::db\`, \`:::storage\`, \`:::external\`.
    - **CRITICAL**: If a node label contains parentheses or special characters, YOU MUST use double quotes. Example: \`NodeID["Label (with special chars)"]:::class\`.
    - **CRITICAL**: Do NOT use parentheses inside square brackets \`[]\` unless the entire label is quoted. Prefer simple text for labels.

4.  **Interaction Metadata**:
    - Every edge (arrow) MUST have a label describing the protocol or data type (e.g., \`-->|REST/JSON|\`, \`-->|gRPC|\`, \`-->|SQL Query|\`).

### DIAGRAM REASONING:
- Analyze the provided file structure and code snippets.
- Identify the core framework (e.g., Flutter, NestJS, Django).
- Infer state management (BLoC, Redux, Context API).
- Map out the lifecycle of a request from user input to data persistence.

### OUTPUT FORMAT (STRICT JSON):
Return a JSON object:
{
  "strategicOverview": "A high-level paragraph about the design philosophy.",
  "mermaidCode": "The optimized mermaid diagram code.",
  "theme": "blueprint, terminal, dark, synthwave",
  "designRationale": "Why this specific layout and theme were selected.",
  "nodeDescriptions": {
    "NodeID": "Detailed role of this specific component."
  }
}
`;

import { cleanMermaidCode } from "../utils/mermaidUtils.js";

export const generateArchitecture = async (prompt: string, repoContext?: string, apiKeyOverride?: string): Promise<GenerateArchitectureResponse> => {
  try {
    // In Vite, process.env.API_KEY is replaced by a string. 
    // We check for it safely to avoid ReferenceErrors.
    const apiKey = apiKeyOverride ||
      (typeof process !== 'undefined' && process.env ? process.env.API_KEY : '') ||
      (typeof process !== 'undefined' && process.env ? process.env.GEMINI_API_KEY : '');

    if (!apiKey) {
      throw new Error("Gemini API Key is missing. Please check your .env file.");
    }
    const ai = new GoogleGenAI({ apiKey });

    let finalPrompt = prompt;
    if (repoContext) {
      finalPrompt = `
**DEEP REPOSITORY ANALYSIS CONTEXT**
Use the following deep scan information to infer a high-quality architecture.
${repoContext}

**USER INSTRUCTION**
${prompt}
        `;
    }

    let responseText = "";
    const models = [
      'gemini-2.5-flash',
      'gemini-2.5-flash-lite',
    ];
    let lastError: any;
    const MAX_RETRIES = 3;
    const BASE_DELAY = 1000;

    for (const modelName of models) {
      for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
        try {
          // Using the Unified SDK @google/genai pattern
          const result = await ai.models.generateContent({
            model: modelName,
            contents: [{ role: 'user', parts: [{ text: finalPrompt }] }],
            config: {
              systemInstruction: SYSTEM_INSTRUCTION,
              temperature: 0.1,
              responseMimeType: "application/json",
            },
          });

          if (result && result.text) {
            responseText = result.text;
            break;
          }
        } catch (err: any) {
          lastError = err;
          const isTransient = err?.status === 503 || err?.status === 429 || (err?.message && err.message.includes("429"));
          if (isTransient && attempt < MAX_RETRIES) {
            const delay = BASE_DELAY * Math.pow(2, attempt - 1);
            await new Promise(resolve => setTimeout(resolve, delay));
          } else {
            console.warn(`Model ${modelName} failed on attempt ${attempt}:`, err.message);
            break; // Try next model or fail
          }
        }
      }
      if (responseText) break;
    }

    if (!responseText) {
      throw lastError || new Error("Failed to get response from Gemini API.");
    }

    const data = JSON.parse(responseText);

    const mermaidCode = cleanMermaidCode(data.mermaidCode || "");
    const theme = data.theme || "dark";

    return {
      explanation: data.strategicOverview || "No explanation provided.",
      mermaidCode,
      diagramImageUrl: getMermaidImageUrl(mermaidCode, theme),
      nodeDescriptions: data.nodeDescriptions || {},
      theme,
      designRationale: data.designRationale || ""
    };

  } catch (error: any) {
    console.error("Gemini v1.2 Error:", error);
    throw error;
  }
};
