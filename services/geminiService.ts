import { GoogleGenAI } from "@google/genai";
import { GenerateArchitectureResponse } from "../types";

const SYSTEM_INSTRUCTION = `
You are ArchMind, an advanced AI Solutions Architect modeled after a "Deep Agent" workflow. 
Your goal is to design robust, scalable, and modern software architectures based on user requirements.

You MUST follow this reasoning process (Chain of Thought):
1.  **Analyze**: Understand the user's high-level requirements, constraints, and preferred stack.
2.  **Design**: Select appropriate patterns (Microservices, Event-Driven, Serverless, Monolith, etc.) and components (Databases, Queues, Load Balancers, API Gateways).
3.  **Visualize**: Construct a valid Mermaid.js diagram representing this architecture.

**OUTPUT FORMAT RULES:**
You must return your response in a specific format. 
- Provide a clear, technical explanation of the architecture first.
- Then, provide the Mermaid.js code wrapped strictly in a markdown code block labeled 'mermaid'.

Example Output:
Here is the architecture for a scalable e-commerce system. I have chosen a microservices pattern using... [Explanation]

\`\`\`mermaid
graph TD
  User --> LB[Load Balancer]
  LB --> WebApp
  ...
\`\`\`

**MERMAID RULES:**
- Use 'graph TD' (Top-Down) or 'graph LR' (Left-Right) or 'sequenceDiagram' or 'erDiagram' as appropriate.
- Use clear node labels (e.g., A[User] --> B[API Gateway]).
- Use subgraphs to group related components (e.g., 'subgraph AWS Cloud').
- Do not use external styling classes that might break rendering. Keep standard Mermaid syntax.
`;

export const generateArchitecture = async (prompt: string): Promise<GenerateArchitectureResponse> => {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    // We use gemini-2.5-flash for speed and good logic capability for diagrams
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        temperature: 0.2, // Low temperature for deterministic code generation
      },
    });

    const text = response.text || "";
    
    // Parse the response to separate explanation and code
    const mermaidMatch = text.match(/```mermaid([\s\S]*?)```/);
    
    let mermaidCode = "";
    let explanation = text;

    if (mermaidMatch && mermaidMatch[1]) {
      mermaidCode = mermaidMatch[1].trim();
      // Remove the code block from the explanation to keep the UI clean, 
      // or keep it if we want the user to see the raw text too. 
      // Let's strip the code block from the explanation for the chat bubble.
      explanation = text.replace(mermaidMatch[0], "").trim();
    }

    if (!mermaidCode && (text.includes("graph ") || text.includes("sequenceDiagram"))) {
        // Fallback: sometimes the model forgets the backticks but sends code
        // This is a naive heuristic
        mermaidCode = text;
    }

    return {
      explanation,
      mermaidCode
    };

  } catch (error) {
    console.error("Gemini API Error:", error);
    throw new Error("Failed to generate architecture diagram.");
  }
};