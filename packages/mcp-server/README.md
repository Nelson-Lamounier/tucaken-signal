# @tucaken/signal-mcp

MCP server companion for [`@tucaken/signal-cli`](https://www.npmjs.com/package/@tucaken/signal-cli).
Exposes the analyzer as in-process tools for host agents (Claude Code,
Cursor, Codex CLI, anything that speaks MCP over stdio).

## Tools

- `analyze_local_repo({ path, stage? })` — runs the same `analyze()`
  function the CLI uses; returns the structured `TrustSignalReport`.
- `get_user_ontology_version()` — returns the pinned ontology version
  so the host knows which rule set produced the report.

Both tools are unauthenticated — Tucaken Signal is a standalone
analyzer, not a client of an external service.

## Install

```bash
claude mcp add tucaken-signal npx -y @tucaken/signal-mcp
```

Or wire manually in `~/.claude.json` / `~/.config/claude/mcp.json`:

```json
{
  "mcpServers": {
    "tucaken-signal": {
      "command": "npx",
      "args": ["-y", "@tucaken/signal-mcp"]
    }
  }
}
```

## Why use MCP instead of shelling out to the CLI

The CLI also returns JSON (`tucaken-signal --format=json`), so a host
agent could shell out to it. MCP is preferable when available because:

- No subprocess overhead per call (in-process via stdio JSON-RPC)
- No JSON re-parse layer between host and analyzer
- Cleaner tool-name → typed-response contract for the host agent
- Works the same whether the analyzer is local or remote

If your host agent is MCP-capable, use this. Otherwise shell-out to the
CLI works fine.
