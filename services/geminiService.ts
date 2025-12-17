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
4.  **Node Labels**: **ALWAYS** quote the text inside the brackets. This is mandatory to prevent syntax errors with parentheses, brackets, or special characters.
    *   **Standard Node**: \`id["Label Text"]\`  (Square brackets)
    *   **Round Node**: \`id("Label Text")\` (Round brackets)
    *   **Database**: \`id[("Database Name")]\` (Cylinder)
    *   **Queue/Event**: \`id{{"Queue Name"}}\` (Hexagon/Double braces)
    *   **Input/Output**: \`id[/"Input Output"/]\` (Parallelogram)
    *   **Terminal**: \`id(["Start/End"])\` (Rounded Stadium)
    *   **Condition**: \`id{"Decision?"}\` (Diamond)
    
    **CRITICAL**: If the label contains parentheses \`()\`, it **MUST** be quoted.
    *   *Incorrect*: \`A[/File (PDF)/]\`
    *   *Correct*: \`A[/"File (PDF)"/]\`

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
    %% Define classes with explicit text colors (color field)
    classDef client fill:#fef3c7,stroke:#d97706,stroke-width:2px,color:#451a03;
    classDef service fill:#e0f2fe,stroke:#0284c7,stroke-width:2px,color:#0c4a6e;
    classDef db fill:#f0fdf4,stroke:#16a34a,stroke-width:2px,color:#14532d;
    classDef queue fill:#f3e8ff,stroke:#9333ea,stroke-width:2px,color:#581c87;
    classDef input fill:#ffedd5,stroke:#ea580c,stroke-width:2px,color:#7c2d12;
    classDef plain fill:#fff,stroke:#333,stroke-width:1px,color:#000;

    %% Actors
    User(["User"])

    %% Client Layer
    subgraph Client ["Client Layer"]
        App["Web Application"]
        Mobile["Mobile App"]
    end

    %% Edge Layer
    subgraph Edge ["API Gateway / Edge"]
        LB["Load Balancer"]
        Gateway["API Gateway"]
    end

    %% Business Layer
    subgraph Services ["Microservices"]
        Auth["Auth Service"]
        Order["Order Service"]
        Pay["Payment Service"]
    end

    %% Data Layer
    subgraph Data ["Persistence"]
        UserDB[("User DB")]
        OrderDB[("Order DB")]
        Cache[("Redis Cache")]
    end
    
    %% Async Messaging
    Queue{{"Order Queue"}}

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
    Order -- "Async Events" --> Queue
    Queue --> Pay
    
    %% Data Access
    Auth --> UserDB
    Order --> OrderDB
    Pay --> OrderDB
    Auth --> Cache
    
    %% Class assignments - CRITICAL: Assign classes to ALL nodes based on type
    class App,Mobile client;
    class LB,Gateway,Auth,Order,Pay service;
    class UserDB,OrderDB,Cache db;
    class Queue queue;
\`\`\`
`;

const cleanMermaidCode = (code: string): string => {
  let cleaned = code
    .split('\n')
    .map(line => {
      // If the line is purely a comment (starts with %% optionally preceded by whitespace), keep it.
      if (/^\s*%%/.test(line)) return line;

      // If the line has an inline comment (%% somewhere in the middle), strip it to avoid parser errors.
      const commentIdx = line.indexOf('%%');
      if (commentIdx !== -1) {
        return line.substring(0, commentIdx).trim();
      }
      return line.trimEnd();
    })
    .join('\n');

  // Fix unquoted parallelogram labels containing parentheses: [/Label (Text)/] -> [/"Label (Text)"/]
  // Regex explanation:
  // \[ - literal [
  // \/ - literal /
  // ( - start capture group 1
  //   [^"\]\n]* - match non-quote, non-closing bracket characters
  //   \( - literal (
  //   [^\n]* - match anything (assuming one line)
  //   \) - literal )
  //   [^"\]\n]* - match remaining non-quote, non-closing bracket characters
  // ) - end capture group 1
  // \/ - literal /
  // \] - literal ]
  // The goal is to catch [/ Text (With Parens) /] where quotes are missing
  cleaned = cleaned.replace(/\[\/([^"\]\n]*?\([^\n]*?\)[^"\]\n]*?)\/\]/g, '[/"$1"/]');

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