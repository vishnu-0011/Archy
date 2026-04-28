# Technical Implementation Plan - ArchMind

## 🏗️ Architecture Overview

The system is divided into three main layers:

1.  **Frontend**: Next.js + Tailwind CSS + Framer Motion.
2.  **BFF (Backend-for-Frontend)**: Vercel Edge Functions or API Routes.
3.  **MCP Server**: Node.js/TypeScript based server using the `@modelcontextprotocol/sdk`.

## 🛠️ Tech Stack

- **Framework**: Next.js 14+ (App Router).
- **Styling**: Vanilla CSS + Glassmorphism utilities.
- **AI Model**: Google Gemini 2.0 Flash.
- **Diagrams**: Mermaid.js.
- **Scanning**: Custom AST/File-structure parser for GitHub.

## 🚀 Phase 1: Core Rendering
- [ ] Initialize Next.js project with Glassmorphic UI.
- [ ] Implement Mermaid.js wrapper component.
- [ ] Setup Gemini API proxy for secure prompting.

## 🚀 Phase 2: Repo Analysis
- [ ] Integrate GitHub API for file listing.
- [ ] Build the "Structure-to-Mermaid" reasoning logic.
- [ ] Add support for multiple diagram types (C4, Sequence, Class).

## 🚀 Phase 3: MCP Server
- [ ] Scaffold `@modelcontextprotocol` server.
- [ ] Expose `generate_architecture` and `analyze_repo` tools.
- [ ] Create documentation for distribution.
