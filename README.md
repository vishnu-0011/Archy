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
