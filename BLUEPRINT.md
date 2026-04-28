# Project Blueprint - ArchMind

ArchMind follows **Spec-Driven Development (SDD)**. The project state and governance are maintained in the `.spec/` directory.

## 🧭 Project Navigation
- **[Constitution](.spec/CONSTITUTION.md)**: Governing principles and non-negotiable constraints.
- **[Specification](.spec/SPECIFICATION.md)**: Product scenarios and requirements.
- **[Plan](.spec/PLAN.md)**: Technical architecture and tech stack.
- **[Tasks](.spec/TASKS.md)**: Actionable execution checklist.

## ⚡ Antigravity Rules
Before every task, Antigravity must:
1.  **Read the Constitution**: Ensure the change doesn't violate core principles.
2.  **Verify via Tools**: If the task involves an API or library, call `context7` or `tavily` to get the latest version.
3.  **Update the Tasks**: Mark items as complete in `.spec/TASKS.md` after successful execution.

## 🚀 Execution
To run ArchMind locally:
1.  **Frontend**: `npm run dev` (Starts on http://localhost:3004)
2.  **MCP Server**: `npm run mcp:run` (Runs the backend service)
3.  **API Key**: Ensure `API_KEY` is set in your `.env` file.

---

**Current Status:** PROJECT COMPLETE / IMPLEMENTATION CLOSED
**Finalized:** All core logic and academic documentation updated.
