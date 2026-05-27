#!/usr/bin/env node
import { resolve, dirname } from "node:path";
import { writeFileSync, mkdirSync } from "node:fs";
import { parseArgs } from "./args.js";
import { analyze } from "../pipeline.js";
import { renderTerminal } from "../output/TerminalRenderer.js";
import { renderJson } from "../output/JsonRenderer.js";
import { renderMarkdown } from "../output/MarkdownRenderer.js";
import { renderRecruiterPreview } from "../output/RecruiterPreviewRenderer.js";
import { analyzeAboveFold } from "../analyzers/readability/AboveFoldAnalyzer.js";
import { detectDecisions } from "../analyzers/system_thinking/DecisionDetector.js";
import { generateDraft, enhanceWithLlm } from "../suggestions/DraftGenerator.js";
import { pickLlmClient } from "../llm/LlmClient.js";
import { applyDraft } from "./apply.js";
import { animatePreview } from "./animate.js";
import { runConfig } from "./commands/config.js";
import { runTelemetry } from "./commands/telemetry.js";
import { runSync } from "./commands/sync.js";
import { ConfigStore } from "../config/ConfigStore.js";
import { Telemetry, pickTelemetrySink } from "../telemetry/TelemetryClient.js";
import { Ontology, type StageId } from "@tucaken/ontology";

const INFERENCE_GATE = 0.75;
const CLI_VERSION = "0.1.0";

async function main(): Promise<void> {
  const args = parseArgs(process.argv);
  const cfg = new ConfigStore();
  const telemetry = new Telemetry(cfg, pickTelemetrySink(cfg));

  if (args.command === "help") return printHelp();
  if (args.command === "config") { process.exit(runConfig(args.positional, cfg)); }
  if (args.command === "telemetry") { process.exit(runTelemetry(args.positional, cfg)); }
  if (args.command === "ontology") {
    const o = new Ontology();
    process.stdout.write(`Tucaken ontology v${o.version.version} (released ${o.version.released})\n`);
    process.stdout.write(`Archetypes: ${o.listArchetypes().map((a) => a.id).join(", ")}\n`);
    return;
  }

  const needsRepo = !["draft", "apply"].includes(args.command);
  const root = resolve(needsRepo ? args.path : ".");

  const result = await analyze({ root, stage: args.stage, archetype: args.archetype, withGithub: args.withGithub });
  const { report, evidence, diagramDraft } = result;

  await telemetry.record({
    cli_version: CLI_VERSION,
    ontology_version: report.ontologyVersion,
    archetype_detected: report.archetype.id,
    stage: report.stage.id,
    suggestion_count: report.suggestions.length,
    command_used: args.command,
  });

  if (report.stage.inferred && report.stage.confidence < INFERENCE_GATE && !args.yes
      && !["draft", "apply", "sync"].includes(args.command)) {
    process.stderr.write(
      `\n⚠ Stage inference confidence ${report.stage.confidence} below gate (${INFERENCE_GATE}).\n` +
      `  Inferred: ${report.stage.id} (${report.stage.explanation})\n` +
      `  Re-run with --stage=junior|mid|senior|staff to lock target, or --yes to accept.\n\n`
    );
  }

  if (args.command === "sync") { process.exit(await runSync(args.positional, cfg, report)); }

  if (args.command === "preview") {
    const text = renderRecruiterPreview({ evidence, fold: analyzeAboveFold(evidence), archetype: report.archetype.id });
    if (args.animate) await animatePreview(text); else process.stdout.write(text);
    return;
  }
  if (args.command === "compare-stages") {
    const stages: StageId[] = ["junior", "mid", "senior", "staff"];
    for (const s of stages) {
      const r = (await analyze({ root, stage: s, archetype: report.archetype.id, withGithub: args.withGithub })).report;
      process.stdout.write(`\n[${s.toUpperCase()}]  overall=${r.overallScore}  top: ${r.suggestions[0]?.title ?? "(no suggestions)"}\n`);
    }
    return;
  }
  if (args.command === "draft" || args.command === "apply") {
    const id = args.positional[0];
    if (!id) {
      process.stderr.write(`usage: tucaken-signal ${args.command} <suggestion-id>${args.command === "apply" ? " [--branch=name] [--no-commit]" : " [--output=path] [--with-llm]"}\n`);
      process.exit(2);
    }
    const suggestion = report.suggestions.find((s) => s.id === id);
    if (!suggestion) {
      process.stderr.write(`No suggestion with id "${id}". Available draftable ids:\n`);
      for (const s of report.suggestions) if (s.draftAvailable) process.stderr.write(`  ${s.id}  — ${s.title}\n`);
      process.exit(2);
    }
    let draft = generateDraft(suggestion, { report, diagramDraft, decisions: detectDecisions(evidence) });
    if (!draft) { process.stderr.write(`Suggestion "${id}" has no draft template yet.\n`); process.exit(2); }
    if (args.withLlm) {
      const llm = pickLlmClient({ withLlm: true });
      draft = await enhanceWithLlm(draft, suggestion, { report, diagramDraft, decisions: detectDecisions(evidence), llm });
    }
    if (args.command === "draft") {
      if (args.output) {
        const out = resolve(args.output);
        mkdirSync(dirname(out), { recursive: true });
        writeFileSync(out, draft.content, "utf8");
        process.stderr.write(`Wrote ${out}\n`);
      } else {
        process.stdout.write(`# ${draft.filename}\n\n${draft.content}`);
      }
      return;
    }
    const applied = await applyDraft({ repoRoot: root, draft, branch: args.branch, commit: !args.noCommit });
    process.stderr.write(`Wrote ${applied.writtenPath}\n`);
    if (applied.branchCreated) process.stderr.write(`Created branch ${applied.branchCreated}\n`);
    if (applied.committed) process.stderr.write(`Committed.\n`);
    return;
  }

  if (args.format === "json") process.stdout.write(renderJson(report) + "\n");
  else if (args.format === "md") process.stdout.write(renderMarkdown(report) + "\n");
  else process.stdout.write(renderTerminal(report));
}

function printHelp(): void {
  process.stdout.write(`tucaken-signal — portfolio trust-signal analyzer

Usage:
  tucaken-signal [path]                              analyze cwd or path
  tucaken-signal preview [path] [--animate]          55-second recruiter preview
  tucaken-signal compare-stages [path]               same repo across junior/mid/senior/staff
  tucaken-signal draft <id> [--output=p] [--with-llm]   generate accept-ready content
  tucaken-signal apply <id> [--branch=b] [--no-commit]  write draft into the repo (optional branch + commit)
  tucaken-signal ontology                            show loaded ontology
  tucaken-signal config get|set|unset [key] [value]  manage ~/.tucaken/config.json
  tucaken-signal telemetry opt-in|opt-out|status     manage anonymous telemetry (default: opt-out)
  tucaken-signal sync projects|push [projectId]      push suggestions to Tucaken account (requires token)

Flags:
  --stage=junior|mid|senior|staff                    override inferred stage
  --archetype=<id>                                   override classifier
  --format=terminal|json|md                          output format
  --with-llm                                         enable LLM enhancement (BYOK ANTHROPIC_API_KEY or IDE bridge)
  --yes, -y                                          accept low-confidence inferred stage
  --verbose
`);
}

main().catch((e) => {
  process.stderr.write(`error: ${(e as Error).message}\n`);
  process.exit(1);
});
