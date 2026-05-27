#!/usr/bin/env tsx
// Spawns the MCP server, calls `analyze_local_repo`, diffs the returned
// TrustSignalReport against the CLI's direct analyze() output.
import { spawn } from "node:child_process";
import { writeFileSync, readFileSync } from "node:fs";
import { analyze } from "../packages/signal-cli/src/pipeline.js";

const TARGET = process.argv[2] ?? "/Users/nelsonlamounier/Desktop/portfolio/ai-applications";
const SERVER = "/Users/nelsonlamounier/Desktop/portfolio/tucaken-skill/packages/mcp-server/dist/server.js";

async function callMcpAnalyze(path: string): Promise<unknown> {
  return new Promise((resolve, reject) => {
    const proc = spawn("node", [SERVER], { stdio: ["pipe", "pipe", "inherit"] });
    let buf = "";
    proc.stdout.on("data", (chunk) => { buf += String(chunk); });
    proc.on("error", reject);
    proc.on("close", () => {
      // Parse JSON-RPC line-delimited responses
      for (const line of buf.split("\n")) {
        if (!line.trim()) continue;
        try {
          const msg = JSON.parse(line);
          if (msg.id === 2) { resolve(msg.result); return; }
        } catch {/* skip non-json */}
      }
      reject(new Error("no response from MCP server"));
    });

    // Initialize handshake then call tool
    proc.stdin.write(JSON.stringify({
      jsonrpc: "2.0", id: 1, method: "initialize",
      params: { protocolVersion: "2024-11-05", capabilities: {}, clientInfo: { name: "diff", version: "1" } },
    }) + "\n");
    proc.stdin.write(JSON.stringify({ jsonrpc: "2.0", method: "notifications/initialized" }) + "\n");
    proc.stdin.write(JSON.stringify({
      jsonrpc: "2.0", id: 2, method: "tools/call",
      params: { name: "analyze_local_repo", arguments: { path } },
    }) + "\n");
    setTimeout(() => proc.stdin.end(), 100);
  });
}

async function main(): Promise<void> {
  console.log(`Target: ${TARGET}\n`);

  console.log("Running CLI analyze() directly...");
  const cliResult = await analyze({ root: TARGET });
  writeFileSync("/tmp/diff-cli.json", JSON.stringify(cliResult.report, null, 2));

  console.log("Calling MCP analyze_local_repo via stdio JSON-RPC...");
  const mcpRaw = await callMcpAnalyze(TARGET);
  const mcpText = (mcpRaw as { content: { text: string }[] }).content[0].text;
  const mcpReport = JSON.parse(mcpText);
  writeFileSync("/tmp/diff-mcp.json", JSON.stringify(mcpReport, null, 2));

  console.log("\n=== ARCHETYPE ===");
  console.log(`  CLI:  ${cliResult.report.archetype.id} (conf=${cliResult.report.archetype.confidence})`);
  console.log(`  MCP:  ${mcpReport.archetype.id} (conf=${mcpReport.archetype.confidence})`);

  console.log("\n=== STAGE ===");
  console.log(`  CLI:  ${cliResult.report.stage.id} (conf=${cliResult.report.stage.confidence})`);
  console.log(`  MCP:  ${mcpReport.stage.id} (conf=${mcpReport.stage.confidence})`);

  console.log("\n=== OVERALL SCORE ===");
  console.log(`  CLI:  ${cliResult.report.overallScore}`);
  console.log(`  MCP:  ${mcpReport.overallScore}`);

  console.log("\n=== PILLARS ===");
  for (let i = 0; i < cliResult.report.pillars.length; i++) {
    const c = cliResult.report.pillars[i];
    const m = mcpReport.pillars[i];
    const match = c.score === m.score ? "✓" : "✗";
    console.log(`  ${match} ${c.pillar.padEnd(20)} CLI=${c.score}  MCP=${m.score}`);
  }

  console.log("\n=== SUGGESTIONS ===");
  console.log(`  CLI: ${cliResult.report.suggestions.length} suggestions`);
  console.log(`  MCP: ${mcpReport.suggestions.length} suggestions`);
  for (let i = 0; i < Math.min(5, cliResult.report.suggestions.length); i++) {
    const c = cliResult.report.suggestions[i];
    const m = mcpReport.suggestions[i];
    const match = c.id === m.id ? "✓" : "✗";
    console.log(`  ${match} [${i+1}] CLI=${c.id}  MCP=${m.id}`);
  }

  // Byte-level diff (excluding inherently non-deterministic fields if any)
  const cliJson = JSON.stringify(cliResult.report);
  const mcpJson = JSON.stringify(mcpReport);
  console.log("\n=== BYTE-LEVEL ===");
  if (cliJson === mcpJson) {
    console.log("  ✅ CLI and MCP outputs are byte-identical");
  } else {
    console.log("  ⚠ JSON differs");
    console.log(`  CLI: ${cliJson.length} bytes`);
    console.log(`  MCP: ${mcpJson.length} bytes`);
  }
}

main().catch((e) => { console.error(e); process.exit(1); });
