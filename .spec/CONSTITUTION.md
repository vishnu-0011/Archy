# Project Constitution - ArchMind

These are the governing principles for the ArchMind project. All development must adhere to these rules.

## ⚖️ Core Principles

1.  **AI-First Design**: ArchMind is built for AI-native workflows. The interface and functionality should feel like it was designed by and for AI agents.
2.  **Glassmorphic Aesthetic**: The UI must maintain a high-fidelity, premium glassmorphic look (transparency, blurs, vibrant gradients).
3.  **Real-Time Feedback**: Architecture visualization must be instant. The lag between input and rendering should be imperceptible.
4.  **Security by Default**: Sensitive keys (especially `GEMINI_API_KEY`) must never touch the client-side. All API interaction must go through a secure BFF.
5.  **Resource Efficiency**: The project must remain lightweight and optimized for low-RAM systems. All non-essential background processes, including Java/Gradle Language Servers and extraneous extensions, must be disabled.

## 🛠️ Development Guidelines

1.  **Documentation (Mandatory)**: Always use `Context7` for library/API documentation, code generation, or configuration steps. Never assume API versions from internal memory.
2.  **Type Safety**: 100% TypeScript coverage is required for both the frontend and the MCP server. No `any` allowed.
3.  **Modular Architecture**: Keep the MCP server separate from the frontend to allow for multi-client distribution.
4.  **Source Verification**: Before implementing any major API change, verify the latest documentation via `tavily` or `context7`.

## 🎯 Success Metrics

-   Mermaid diagrams render in < 200ms.
-   Zero exposed environment variables in client bundles.
-   100% passing tests for the MCP server handlers.
