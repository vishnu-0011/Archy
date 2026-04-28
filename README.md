<div align="center">
  <h1 align="center">ArchMind</h1>
  <h3>AI-Powered Architecture Visualization</h3>
  <p>Generates high-fidelity, organized, and beautiful cloud architecture diagrams from simple text prompts or GitHub repository URLs.</p>

  [![Live Demo](https://img.shields.io/badge/demo-live-green?style=for-the-badge)](https://archy-51lit4mnx-yashwant00cr7s-projects.vercel.app)
  [![Vercel Deployment](https://img.shields.io/badge/Vercel-Deployed-black?style=for-the-badge&logo=vercel)](https://archy-51lit4mnx-yashwant00cr7s-projects.vercel.app)
</div>

---

- **🧠 ArchMind v1.2 Engine (Deep Reasoning)**: Transitioned from flat structures to professional architectural standards. The engine now enforces tiered subgraphs (Frontend, API, Logic, Data, External) for maximum clarity and semantic organization.
- **🔍 Deep Recursive Scanning**: Upgraded `analyze_repo` and `generate_architecture` to use recursive Git Trees scanning, extracting high-fidelity context from nested directories instead of just the root.
- **⚡ Model Fallback & Resilience**: Integrated automatic retries and model fallbacks (Gemini 3.1 Flash-Lite → Gemini 3 Flash → Gemini 2.5 Flash) to ensure continuous operation despite API rate limits and deprecations.
- **🔌 Standalone MCP Server**: Fully distributable NPM package for global `npx` usage or direct integration into AI agent workflows.

---

## 🔌 Connecting to MCP (AI Agents & IDEs)

ArchMind acts as an **MCP Server**, allowing AI agents to generate professional diagrams using the **archmind-mcp-server** package.

### 1. Global Usage (Quickest)
You can run the server instantly without cloning the repo:
```bash
npx archmind-mcp-server
```

### 2. Configure Claude Desktop
To use ArchMind within Claude, add the following to your `claude_desktop_config.json`:

**Windows**: `%APPDATA%\Claude\claude_desktop_config.json`  
**macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`

```json
{
  "mcpServers": {
    "archmind": {
      "command": "npx",
      "args": ["-y", "archmind-mcp-server"],
      "env": {
        "GEMINI_API_KEY": "YOUR_API_KEY_HERE"
      }
    }
  }
}
```

> [!TIP]
> If using the local source, point the `args` to `archy-repo/mcp-server/dist/index.js` and ensure you've run `npm run build`.

### 3. Available Tools
- **`generate_architecture`**: Converts natural language into a professional, tiered technical diagram. Supports recursive scanning via repository URLs.
- **`analyze_repo`**: Performs a deep recursive scan of a GitHub repository to infer its technical architecture.
- **`save_diagram`**: Renders Mermaid code to a PNG and saves it directly to the local filesystem (requires `output_path`).

---

## 🛠️ Tech Stack

- **Frontend**: React (Vite) + Vanilla CSS (Glassmorphism)
- **Visualization**: Mermaid.js & Mermaid.ink API
- **AI Model**: Google Gemini 3.1 Flash-Lite & Gemini 3 Flash (State-of-the-Art)
- **Cloud Hosting**: Vercel (with Serverless Backend)

---

## 🏃 Local Development

1. **Clone & Install**
   ```bash
   git clone https://github.com/Yashwant00CR7/Archy.git
   cd Archy
   npm install
   ```

2. **Setup Environment**
   Create a `.env` file:
   ```env
   GEMINI_API_KEY=your_key_here
   ```

3. **Start Development Server**
   ```bash
   npm run dev
   ```

---

## 🌍 Vercel Deployment

This project is optimized for Vercel out of the box.

1. **Fork the Repository** to your GitHub account.
2. **Connect to Vercel**: Import the project from the Vercel Dashboard.
3. **Environment Variables**: Add your `GEMINI_API_KEY` in settings.
4. **Deploy**: Vercel will handle the rest, including the API proxy setup!

---

## 📄 License

MIT © [vishnu-0011](https://github.com/vishnu-0011)
