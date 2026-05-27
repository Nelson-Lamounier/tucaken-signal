#!/usr/bin/env node
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { analyze } from "@tucaken/signal-cli/dist/pipeline.js";

const TOOLS = [
  {
    name: "analyze_local_repo",
    description: "Run Tucaken Signal analysis on a local repository path and return the structured TrustSignalReport.",
    inputSchema: {
      type: "object",
      properties: {
        path: { type: "string" },
        stage: { type: "string", enum: ["junior", "mid", "senior", "staff"] },
      },
      required: ["path"],
    },
  },
  {
    name: "get_user_ontology_version",
    description: "Return the ontology version this MCP server is pinned to (matches the @tucaken/signal-cli build).",
    inputSchema: { type: "object", properties: {} },
  },
];

const server = new Server(
  { name: "tucaken-signal-mcp", version: "0.2.0" },
  { capabilities: { tools: {} } }
);

server.setRequestHandler(ListToolsRequestSchema, async () => ({ tools: TOOLS }));

server.setRequestHandler(CallToolRequestSchema, async (req) => {
  const name = req.params.name;
  const args = (req.params.arguments ?? {}) as Record<string, unknown>;
  try {
    if (name === "get_user_ontology_version") {
      const { Ontology } = await import("@tucaken/ontology");
      return text(JSON.stringify(new Ontology().version, null, 2));
    }
    if (name === "analyze_local_repo") {
      const r = await analyze({ root: String(args.path), stage: args.stage as never });
      return text(JSON.stringify(r.report, null, 2));
    }
    return text(`Unknown tool: ${name}`, true);
  } catch (e) {
    return text((e as Error).message, true);
  }
});

function text(content: string, isError = false) {
  return { content: [{ type: "text" as const, text: content }], isError };
}

const transport = new StdioServerTransport();
await server.connect(transport);
