#!/usr/bin/env node
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { z } from "zod";
import * as dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import * as fs from "fs";

// Load environment variables from the root .env file
const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ 
  path: path.resolve(__dirname, "../.env"),
  quiet: true 
});

// Import existing services
import { generateArchitecture } from "./services/geminiService.js";
import { fetchRepoContext } from "./services/githubService.js";
import { getMermaidImageBase64 } from "./utils/mermaidUtils.js";

const server = new Server(
  {
    name: "archy-mcp-server",
    version: "1.0.0",
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

/**
 * List available tools.
 */
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: "generate_architecture",
        description: "Generates a technical architecture diagram in Mermaid.js format from a natural language prompt.",
        inputSchema: {
          type: "object",
          properties: {
            prompt: {
              type: "string",
              description: "Description of the architecture to generate (e.g., 'A serverless API on AWS with Lambda and DynamoDB').",
            },
            repoUrl: {
              type: "string",
              description: "Optional: GitHub repository URL to analyze as context for the architecture.",
            },
          },
          required: ["prompt"],
        },
      },
      {
        name: "analyze_repo",
        description: "Analyzes a GitHub repository and returns a structured summary used for architecture generation.",
        inputSchema: {
          type: "object",
          properties: {
            url: {
              type: "string",
              description: "The full GitHub repository URL (e.g., 'https://github.com/owner/repo').",
            },
          },
          required: ["url"],
        },
      },
      {
        name: "render_mermaid",
        description: "Renders Mermaid.js code as a PNG image.",
        inputSchema: {
          type: "object",
          properties: {
            code: {
              type: "string",
              description: "The raw Mermaid.js code to render.",
            },
          },
          required: ["code"],
        },
      },
      {
        name: "save_diagram",
        description: "Renders Mermaid.js code as a PNG image and saves it to a local file.",
        inputSchema: {
          type: "object",
          properties: {
            code: {
              type: "string",
              description: "The raw Mermaid.js code to render.",
            },
            output_path: {
              type: "string",
              description: "The local file path where the PNG should be saved (e.g., './diagrams/arch.png').",
            },
          },
          required: ["code", "output_path"],
        },
      },
    ],
  };
});

/**
 * Handle tool calls.
 */
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    if (name === "generate_architecture") {
      const { prompt, repoUrl } = z
        .object({
          prompt: z.string(),
          repoUrl: z.string().optional(),
        })
        .parse(args);

      let repoContext = "";
      if (repoUrl) {
        const context = await fetchRepoContext(repoUrl);
        repoContext = context.summary;
      }

      const result = await generateArchitecture(prompt, repoContext);

      const content: any[] = [
        {
          type: "text",
          text: `Strategic Overview:\n${result.explanation}\n\nDesign Rationale:\n${result.designRationale}\n\nMermaid Code:\n\`\`\`mermaid\n${result.mermaidCode}\n\`\`\``,
        },
      ];

      // Try to fetch base64 image with the AI-selected theme
      const imageResult = await getMermaidImageBase64(result.mermaidCode, result.theme as any);
      if (imageResult) {
        content.push({
          type: "image",
          data: imageResult.data,
          mimeType: imageResult.mimeType,
        });
      } else if (result.diagramImageUrl) {
        content.push({
          type: "text",
          text: `\nRendered Image URL (Fallback):\n${result.diagramImageUrl}`,
        });
      }

      return { content };
    }

    if (name === "render_mermaid") {
      const { code } = z
        .object({
          code: z.string(),
        })
        .parse(args);

      const imageResult = await getMermaidImageBase64(code, "dark");

      if (!imageResult) {
        throw new Error("Failed to render mermaid diagram to image.");
      }

      return {
        content: [
          {
            type: "image",
            data: imageResult.data,
            mimeType: imageResult.mimeType,
          },
        ],
      };
    }

    if (name === "save_diagram") {
      const { code, output_path } = z
        .object({
          code: z.string(),
          output_path: z.string(),
        })
        .parse(args);

      const imageResult = await getMermaidImageBase64(code, "dark");

      if (!imageResult) {
        throw new Error("Failed to render mermaid diagram to image.");
      }

      const absolutePath = path.isAbsolute(output_path)
        ? output_path
        : path.resolve(process.cwd(), output_path);

      const dir = path.dirname(absolutePath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      const buffer = Buffer.from(imageResult.data, "base64");
      fs.writeFileSync(absolutePath, buffer);

      return {
        content: [
          {
            type: "text",
            text: `Diagram successfully saved to: ${absolutePath}`,
          },
        ],
      };
    }

    if (name === "analyze_repo") {
      const { url } = z
        .object({
          url: z.string(),
        })
        .parse(args);

      const context = await fetchRepoContext(url);

      return {
        content: [
          {
            type: "text",
            text: context.summary,
          },
        ],
      };
    }

    throw new Error(`Tool not found: ${name}`);
  } catch (error: any) {
    return {
      content: [
        {
          type: "text",
          text: `Error: ${error instanceof Error ? error.message : String(error)}`,
        },
      ],
      isError: true,
    };
  }
});

/**
 * Start the server.
 */
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch((error) => {
  console.error("Fatal error in main():", error);
  process.exit(1);
});
