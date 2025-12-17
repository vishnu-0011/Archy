# ArchMind - AI Architecture Designer

ArchMind is an intelligent tool conceived to help developers visualize system architectures. It uses the power of Google's Gemini AI to generate Mermaid.js diagrams from natural language descriptions or by analyzing GitHub repositories.

## Features

-   **Natural Language to Diagram**: Describe your system architecture in plain English, and ArchMind will generate a professional diagram for you.
-   **GitHub Repository Analysis**: Paste a GitHub URL (e.g., `https://github.com/owner/repo`), and ArchMind will analyze the codebase to visualize its architecture.
-   **Interactive Chat Interface**: Refine your diagrams through a conversational interface with the ArchMind Deep Agent.
-   **Version History**: Keep track of different versions of your diagrams and switch between them.
-   **Code Preview**: View and copy the underlying Mermaid.js code for use in documentation.
-   **Modern UI**: Built with a sleek, dark-themed interface using Tailwind CSS and Lucide icons.

## Tech Stack

-   **Frontend**: [React](https://react.dev/), [TypeScript](https://www.typescriptlang.org/)
-   **Build Tool**: [Vite](https://vitejs.dev/)
-   **Styling**: [Tailwind CSS](https://tailwindcss.com/)
-   **AI**: [Google Gemini API](https://ai.google.dev/) (using `gemini-2.5-flash`)
-   **Diagrams**: [Mermaid.js](https://mermaid.js.org/)
-   **Icons**: [Lucide React](https://lucide.dev/)

## Getting Started

### Prerequisites

-   Node.js (v18 or higher recommended)
-   npm or yarn
-   A Google Gemini API Key. You can get one from [Google AI Studio](https://aistudio.google.com/).

### Installation

1.  Clone the repository:
    ```bash
    git clone https://github.com/your-username/arch-mind.git
    cd arch-mind
    ```

2.  Install dependencies:
    ```bash
    npm install
    ```

### Configuration

1.  Create a `.env.local` file in the root directory:
    ```bash
    touch .env.local
    ```

2.  Add your Gemini API key to the file:
    ```env
    GEMINI_API_KEY=your_actual_api_key_here
    ```

### Running the App

Start the development server:

```bash
npm run dev
```

Open your browser and navigate to `http://localhost:3000`.

## Usage

1.  **Describe**: Type a description like "A microservices architecture for an e-commerce platform with an API Gateway, Auth Service, and PostgreSQL database".
2.  **Analyze Repo**: Paste a public GitHub repository URL to generate a diagram of its structure.
3.  **Explore**: Use the text input to ask ArchMind to modify the diagram (e.g., "Add a Redis cache to the Auth Service").
4.  **History**: Use the History button in the top right of the diagram panel to revert to previous versions.
5.  **Export**: Click the Terminal icon to view and copy the Mermaid code.

## License

MIT
