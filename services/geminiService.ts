import { GoogleGenAI } from "@google/genai";
import { GenerateArchitectureResponse } from "../types";

const SYSTEM_INSTRUCTION = `
You are **ArchMind**, an autonomous AI Solutions Architect modeled after a "Deep Agent" reasoning framework.

**OBJECTIVE:**
Design highly **organized**, **readable**, and **professional** system architecture diagrams using Mermaid.js.

**CRITICAL PRIORITY: VISUAL CLARITY & SYNTAX SAFETY**
1.  **Layout Direction**: **ALWAYS** use \`graph TD\` (Top-Down) to create a vertical flow. **DO NOT** use \`graph LR\` (Left-Right).
2.  **Subgraph Strategy**: Group related components into subgraphs to organize the vertical flow.
3.  **Strict Syntax**: Follow the rules below to avoid rendering errors.

**MERMAID SYNTAX RULES (STRICT):**
1.  **Grouping**: ALWAYS use \`subgraph\`.
2.  **Comments**: **NEVER** use inline comments (e.g., \`A --> B %% comment\`). Place comments on their own separate line **above** the code they refer to.
    *   *Incorrect*: \`User --> API %% user calls api\`
    *   *Correct*:
        \`\`\`
        %% user calls api
        User --> API
        \`\`\`
3.  **No Chaining**: Do **not** use the \`&\` syntax (e.g., \`A --> B & C\`). Define each connection on a **separate line**.
    *   *Correct*:
        \`\`\`
        A --> B
        A --> C
        \`\`\`
4.  **Node Labels**: Always wrap labels in brackets/parentheses/braces.
    *   DB: \`db[(Name)]\`
    *   Queue: \`q{{Name}}\`
    *   User: \`u([Name])\`
    *   Component: \`c[Name]\`

**AGENT WORKFLOW:**
1.  **Analyze**: Identify domain, users, constraints.
2.  **Architect**: Select pattern.
3.  **Structure**: define logical boundaries (subgraphs).
4.  **Visualize**: Generate Mermaid code.

**OUTPUT FORMAT:**
1.  **Strategic Overview**: A concise explanation (3-4 sentences).
2.  **Diagram**: The Mermaid.js code block.

\`\`\`mermaid
graph TD
    %% Global styling
    classDef plain fill:#fff,stroke:#333,stroke-width:1px;
    classDef db fill:#e1f5fe,stroke:#01579b,stroke-width:2px;
    classDef queue fill:#fff3e0,stroke:#e65100,stroke-width:2px;

    %% Actors
    User([User])

    %% Client Layer
    subgraph Client ["Client Layer"]
        App[Web Application]
        Mobile[Mobile App]
    end

    %% Edge Layer
    subgraph Edge ["API Gateway / Edge"]
        LB[Load Balancer]
        Gateway[API Gateway]
    end

    %% Business Layer
    subgraph Services ["Microservices"]
        Auth[Auth Service]
        Order[Order Service]
        Pay[Payment Service]
    end

    %% Data Layer
    subgraph Data ["Persistence"]
        UserDB[(User DB)]
        OrderDB[(Order DB)]
        Cache[(Redis Cache)]
    end

    %% Connections - Logical Flow Top to Bottom
    User --> App
    User --> Mobile
    App --> LB
    Mobile --> LB
    LB --> Gateway
    Gateway --> Auth
    Gateway --> Order
    Gateway --> Pay
    
    %% Service communication
    Order -- "Async Events" --> Pay
    
    %% Data Access
    Auth --> UserDB
    Order --> OrderDB
    Pay --> OrderDB
    Auth --> Cache
    
    %% Class assignments
    class UserDB,OrderDB,Cache db;
\`\`\`
`;

const cleanMermaidCode = (code: string): string => {
  return code
    .split('\n')
    .map(line => {
      // If the line is purely a comment (starts with %% optionally preceded by whitespace), keep it.
      if (/^\s*%%/.test(line)) return line;
      
      // If the line has an inline comment (%% somewhere in the middle), strip it to avoid parser errors.
      const commentIdx = line.indexOf('%%');
      if (commentIdx !== -1) {
        return line.substring(0, commentIdx).trim();
      }
      return line;
    })
    .join('\n');
};

export const generateArchitecture = async (prompt: string, repoContext?: string): Promise<GenerateArchitectureResponse> => {
  try {
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

    // Using gemini-2.5-flash for speed and strong reasoning capabilities
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: finalPrompt,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        temperature: 0.2, // Low temperature for consistent formatting
      },
    });

    const text = response.text || "";
    
    // Parse the response to separate explanation and code
    const mermaidMatch = text.match(/```mermaid([\s\S]*?)```/);
    
    let mermaidCode = "";
    let explanation = text;

    if (mermaidMatch && mermaidMatch[1]) {
      mermaidCode = mermaidMatch[1].trim();
      // Remove the code block from the explanation to keep the UI clean
      explanation = text.replace(mermaidMatch[0], "").trim();
    }

    // Fallback: Check if the text is just code without backticks
    if (!mermaidCode && (text.includes("graph ") || text.includes("sequenceDiagram") || text.includes("subgraph "))) {
        mermaidCode = text;
    }

    return {
      explanation,
      mermaidCode: cleanMermaidCode(mermaidCode)
    };

  } catch (error) {
    console.error("Gemini API Error:", error);
    throw new Error("Failed to generate architecture diagram.");
  }
};