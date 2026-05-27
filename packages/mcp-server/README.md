# @tucaken/signal-mcp

MCP server companion that exposes Tucaken-authenticated account state to host
agents (Claude Code, Cursor, Codex CLI, etc.).

## Tools

- `list_projects` — list user's Tucaken projects
- `get_project_technologies` — technologies extracted for a project *(not yet implemented)*
- `get_user_ontology_version` — pinned ontology version
- `analyze_local_repo` — run Tucaken Signal analysis on a local path
- `save_signal_suggestions` — push accepted suggestions to Tucaken account

## Run

```bash
yarn build
node packages/mcp-server/dist/server.js
```

Wire from Claude Code (in `~/.config/claude/mcp.json` or settings):

```json
{
  "mcpServers": {
    "tucaken-signal": {
      "command": "node",
      "args": ["/path/to/tucaken-signal/packages/mcp-server/dist/server.js"]
    }
  }
}
```

Authenticated tools require `tucaken_token` set via:

```bash
tucaken-signal config set tucaken_token <your-token>
```
