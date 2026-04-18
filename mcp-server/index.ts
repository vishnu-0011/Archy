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

// Load environment variables from the root .env file
const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, "../.env") });

// Import existing services
import { generateArchitecture } from "../services/geminiService.js";
import { fetchRepoContext } from "../services/githubService.js";

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

      return {
        content: [
          {
            type: "text",
            text: `Strategic Overview:\n${result.explanation}\n\nMermaid Code:\n\`\`\`mermaid\n${result.mermaidCode}\n\`\`\``,
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
  console.error("Archy MCP Server running on stdio");
}

main().catch((error) => {
  console.error("Fatal error in main():", error);
  process.exit(1);
});
