import { generateArchitecture } from "./services/geminiService.js";
import dotenv from "dotenv";

dotenv.config();

async function test() {
  console.log("🚀 Starting ArchMind v1.2.1-Recovery Test...");
  console.log("Checking models: gemini-2.5-flash, gemini-2.5-flash-lite");

  const prompt = "A simple web application with a React frontend, a Node.js API, and a PostgreSQL database.";
  
  try {
    const response = await generateArchitecture(prompt);
    console.log("\n✅ TEST SUCCESS!");
    console.log("Strategic Overview:", response.explanation);
    console.log("\nMermaid Code:\n", response.mermaidCode);
    console.log("\nDiagram Image URL:", response.diagramImageUrl);
  } catch (error: any) {
    console.error("\n❌ TEST FAILED!");
    console.error("Error Message:", error.message);
    if (error.stack) {
      console.error("Stack Trace:", error.stack);
    }
  }
}

test();
