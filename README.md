<div align="center">
  <h1 align="center">ArchMind</h1>
  <h3>AI-Powered Architecture Visualization</h3>
  <p>Generates high-fidelity, organized, and beautiful cloud architecture diagrams from simple text prompts or GitHub repository URLs.</p>
</div>

---

## 🚀 Features

- **🤖 AI-Driven Generation**: Powered by **Gemini 2.5 Flash**, converting natural language into complex Mermaid.js diagrams.
- **✨ Premium Themes**: Choose from visually stunning themes including:
  - **Obsidian Night** (Default dark mode)
  - **Galaxy Stream** (Neon/Space aesthetics)
  - **System Blueprint** (Technical engineering style)
  - **Arctic Frost** (Clean light mode)
- **📐 Optimized Layouts**: Enforces industry-standard **Left-to-Right (LR)** horizontal data flow for maximum readability.
- **🔍 Deep Interaction**: 
  - Smooth **Infinite Pan & Zoom**.
  - **High-Visibility Typography** for easy reading at any scale.
  - **Interactive Node Inspector** for detailed metadata.
- **💾 Export & Share**: Instantly download high-resolution **PNG** images of your diagrams.
- **🔗 GitHub Context**: Paste a GitHub repository URL to generate an architecture diagram based on the actual codebase structure.
- **🔌 MCP Server**: Use ArchMind as a Model Context Protocol (MCP) server to generate diagrams from any MCP-compatible AI agent or IDE.

## 🛠️ Tech Stack

- **Frontend**: React, Vite, Tailwind CSS
- **Visualization**: Mermaid.js
- **AI Model**: Google Gemini 2.5 Flash
- **Icons**: Lucide React & FontAwesome

## 🏃 Run Locally

**Prerequisites:** Node.js (v18+)

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd Archy
   ```

2. **Install Dependencies**
   ```bash
   npm install
   ```

3. **Configure Environment**
   Create a `.env` file in the root directory and add your Google Gemini API Key:
   ```env
   GEMINI_API_KEY=your_api_key_here
   ```

4. **Start the App**
   ```bash
   npm run dev
   ```
   Open [http://localhost:3004](http://localhost:3004) to view it in the browser.

## 🔌 MCP Server Integration

ArchMind now acts as an **MCP Server**, allowing you to use its architecture generation capabilities directly from your favorite AI tools (like Claude Desktop).

### 1. Run the Server
From the root directory:
```bash
npm run mcp:run
```

### 2. Available Tools
- **`generate_architecture`**: Generates a Mermaid.js diagram from a prompt. 
  - *Args*: `prompt` (string), `repoUrl` (optional string)
- **`analyze_repo`**: Infers architecture context from a GitHub repository.
  - *Args*: `url` (string)

### 3. Client Configuration
To use with Claude Desktop, add this to your `claude_desktop_config.json`:
```json
{
  "mcpServers": {
    "archmind": {
      "command": "node",
      "args": ["<path-to-repo>/mcp-server/dist/index.js"],
      "env": {
        "GEMINI_API_KEY": "YOUR_API_KEY"
      }
    }
  }
}
```
*(Note: Ensure you run `npm run build` inside `mcp-server/` first to generate the dist directory).*

## 🎮 Usage

1. **Enter a Prompt**: Type a description like "E-commerce microservices with Redis and Kafka".
2. **Or Use a Repo**: Paste a full GitHub URL (e.g., `https://github.com/owner/repo`) to analyze the code.
3. **Explore**:
   - Use **Ctrl + Scroll** to zoom.
   - Drag to pan.
   - Click nodes to see details.
   - Click the **Download** icon to save the diagram.

## 📄 License

MIT
