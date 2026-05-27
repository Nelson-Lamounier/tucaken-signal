#!/usr/bin/env node
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { ConfigStore } from "@tucaken/signal-cli/dist/config/ConfigStore.js";
import { TucakenSyncClient } from "@tucaken/signal-cli/dist/sync/TucakenSyncClient.js";
import { analyze } from "@tucaken/signal-cli/dist/pipeline.js";

const cfg = new ConfigStore();
const sync = new TucakenSyncClient(cfg);

const TOOLS = [
  {
    name: "list_projects",
    description: "List the user's projects in their Tucaken account.",
    inputSchema: { type: "object", properties: {} },
  },
  {
    name: "get_project_technologies",
    description: "Fetch technologies extracted for a specific Tucaken project.",
    inputSchema: {
      type: "object",
      properties: { projectId: { type: "string" } },
      required: ["projectId"],
    },
  },
  {
    name: "get_user_ontology_version",
    description: "Return the ontology version this CLI is pinned to.",
    inputSchema: { type: "object", properties: {} },
  },
  {
    name: "analyze_local_repo",
    description: "Run Tucaken Signal analysis on a local repository path and return the structured report.",
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
    name: "save_signal_suggestions",
    description: "Push accepted suggestions to the user's Tucaken account.",
    inputSchema: {
      type: "object",
      properties: {
        projectId: { type: "string" },
        suggestions: { type: "array", items: { type: "object" } },
      },
      required: ["suggestions"],
    },
  },
];

const server = new Server(
  { name: "tucaken-signal-mcp", version: "0.1.0" },
  { capabilities: { tools: {} } }
);

server.setRequestHandler(ListToolsRequestSchema, async () => ({ tools: TOOLS }));

server.setRequestHandler(CallToolRequestSchema, async (req) => {
  const name = req.params.name;
  const args = (req.params.arguments ?? {}) as Record<string, unknown>;
  try {
    if (name === "list_projects") return text(JSON.stringify(await sync.listProjects(), null, 2));
    if (name === "get_user_ontology_version") {
      const { Ontology } = await import("@tucaken/ontology");
      return text(JSON.stringify(new Ontology().version, null, 2));
    }
    if (name === "analyze_local_repo") {
      const r = await analyze({ root: String(args.path), stage: args.stage as never });
      return text(JSON.stringify(r.report, null, 2));
    }
    if (name === "save_signal_suggestions") {
      await sync.saveAcceptedSuggestions(
        (args.projectId as string | undefined) ?? null,
        (args.suggestions as never) ?? []
      );
      return text(`saved ${(args.suggestions as unknown[] | undefined)?.length ?? 0} suggestions`);
    }
    if (name === "get_project_technologies") {
      return text("Not yet implemented; depends on Tucaken API surface.");
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
