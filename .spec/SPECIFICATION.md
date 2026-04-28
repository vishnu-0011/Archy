# Project Specification - ArchMind

## 🔭 Vision
ArchMind aims to be the standard for "Visual Reasoning" in software architecture. It translates abstract technical thoughts (text) or existing structures (code) into clear, professional Mermaid diagrams.

## 🎯 Scenarios

### 1. Text-to-Architecture
- **User Action**: Enters "A serverless API on AWS with Lambda, DynamoDB, and Cognito."
- **System Outcome**: Generates a Mermaid `C4Container` or `graph TD` diagram showing the components and their connections.

### 2. Repo-to-Architecture
- **User Action**: Provides a GitHub URL or local path.
- **System Outcome**: Scans the file structure, identifies main entry points and dependencies, and maps the system architecture automatically.

### 3. MCP Integration
- **User Action**: Uses a coding agent (like Antigravity) with the ArchMind MCP server.
- **System Outcome**: The agent can call `generate_architecture` or `analyze_repo` tools to help the user visualize their own project.

## 📋 Requirements

### Functional
- Mermaid.js rendering engine.
- GitHub API integration for repo scanning.
- Gemini 2.0 Flash integration for reasoning.
- PNG/SVG export capability.

### Non-Functional
- Mobile-responsive UI.
- Secure API proxy.
- Clean, searchable diagram history.
