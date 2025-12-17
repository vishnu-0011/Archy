# ArchMind - AI Architecture Designer

ArchMind is a "Deep Agent" powered tool designed to autonomously analyze, architect, and visualize complex software systems. Built on Google's **Gemini 2.5 Flash**, it bridges the gap between codebase analysis and high-level architectural understanding.

![ArchMind Interface](https://via.placeholder.com/800x450?text=ArchMind+Deep+Agent+Interface)

## 🧠 The Deep Agent Architecture

ArchMind goes beyond simple prompting. It employs a multi-step reasoning engine:
1.  **Repo Retrieval**: Fetches actual file structures and dependencies from GitHub.
2.  **Context Injection**: Injects real project metadata into the agent's working memory.
3.  **Semantic Reasoning**: Classifies system components into logical types (`Client`, `Service`, `Database`, `Queue`, `Input`).
4.  **Visual Synthesis**: Generates strict, syntax-safe Mermaid.js code with enforced styling rules.

## ✨ Key Features

-   **GitHub to Diagram**: Paste any public repo URL (`https://github.com/owner/repo`), and ArchMind will "read" the code to visualize its architecture.
-   **Natural Language Refinement**: Chat with the agent to modify diagrams (e.g., "Add a Redis cache to the Auth Service").
-   **Semantic Theming**:
    -   **Cyberpunk (Dark)**: Neon aesthetics with high-contrast text for visibility.
    -   **Blueprint**: Engineering-focused blue/white style.
    -   **Forest**: Calming green tones.
-   **Version Control**: Built-in history tracking to revert to previous architecture versions.
-   **Code Export**: One-click copy of the underlying Mermaid code for your documentation.

## 🛠️ Tech Stack

-   **Core Brain**: Google Gemini 2.5 Flash
-   **Frontend**: React 19, TypeScript, Vite
-   **Visualization**: Mermaid.js (with custom semantic rendering engine)
-   **Styling**: Tailwind CSS
-   **Icons**: Lucide React

## 🚀 Getting Started

### Prerequisites
-   Node.js (v18+)
-   A Google Gemini API Key from [Google AI Studio](https://aistudio.google.com/).

### Installation

1.  **Clone the Repo**
    ```bash
    git clone https://github.com/your-username/arch-mind.git
    cd arch-mind
    ```

2.  **Install Dependencies**
    ```bash
    npm install
    ```

3.  **Configure Environment**
    Create a `.env` file in the root:
    ```bash
    cp .env.example .env
    ```
    Add your API key:
    ```env
    GEMINI_API_KEY=AIzaSy...
    ```

4.  **Run Locally**
    ```bash
    npm run dev
    ```
    Access the app at `http://localhost:3010`.

## 🎨 System Instruction & Prompt Engineering

The agent operates on a strict system instruction set located in `services/geminiService.ts`. It enforces:
-   **Top-Down Flow**: `graph TD` only.
-   **Strict Subgraphing**: Grouping logic by layer (Client, Edge, Service, Data).
-   **Semantic Classes**:
    -   `class X client` (Yellow/Orange)
    -   `class Y service` (Cyan/Blue)
    -   `class Z db` (Green/database shape)
    -   `class Q queue` (Purple/hexagon)

## License

MIT
