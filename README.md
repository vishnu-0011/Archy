<div align="center">
  <h1 align="center">ArchMind</h1>
  <h3>AI-Powered Architecture Visualization</h3>
  <p>Generates high-fidelity, organized, and beautiful cloud architecture diagrams from simple text prompts or GitHub repository URLs.</p>

  [![Live Demo](https://img.shields.io/badge/demo-live-green?style=for-the-badge)](https://archy-51lit4mnx-yashwant00cr7s-projects.vercel.app)
  [![Vercel Deployment](https://img.shields.io/badge/Vercel-Deployed-black?style=for-the-badge&logo=vercel)](https://archy-51lit4mnx-yashwant00cr7s-projects.vercel.app)
</div>

---

## 🚀 Recent Enhancements

- **🎬 Instant Image Previews**: The AI now returns rendered architecture images (via `mermaid.ink`) directly in the chat, allowing you to see your design without leaving the conversation.
- **🛡️ Secure Vercel Hosting**: Fully refactored for Vercel deployment with a **Backend-for-Frontend (BFF)** proxy. Your `GEMINI_API_KEY` stays safe on the server and is never exposed to the client.
- **🔌 Model Context Protocol (MCP)**: Now includes a fully functional MCP server, allowing you to generate architecture diagrams directly within Claude Desktop or any MCP-compatible agent.
- **🖼️ Enhanced Visualizer**: Synchronized sidebar visualizer that reflects AI changes in real-time.

---

## 🔌 Connecting to MCP (AI Agents & IDEs)

ArchMind acts as an **MCP Server**, bridging the gap between LLMs and visual architecture design.

### 1. Prerequisites
- **Node.js**: v18 or higher.
- **Google Gemini API Key**: Get one from [Google AI Studio](https://aistudio.google.com/).

### 2. Configure Claude Desktop
To use ArchMind within Claude, add the following to your `claude_desktop_config.json`:

**Windows**: `%APPDATA%\Claude\claude_desktop_config.json`  
**macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`

```json
{
  "mcpServers": {
    "archmind": {
      "command": "node",
      "args": ["<path-to-repo>/mcp-server/dist/index.js"],
      "env": {
        "GEMINI_API_KEY": "YOUR_API_KEY_HERE"
      }
    }
  }
}
```

> [!TIP]
> Make sure to run `npm run build` in the root directory before connecting to ensure the MCP server bundle is generated!

### 3. Available Tools
- **`generate_architecture`**: Converts natural language into a technical diagram.
- **`analyze_repo`**: Scans a GitHub repository to infer its technical architecture.

---

## 🛠️ Tech Stack

- **Frontend**: React (Vite) + Vanilla CSS (Glassmorphism)
- **Visualization**: Mermaid.js & Mermaid.ink API
- **AI Model**: Google Gemini 2.0 Flash
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
