#!/usr/bin/env node
import { resolve, basename, join } from "node:path";
import { mkdirSync, writeFileSync, readdirSync } from "node:fs";
import { parseArgs } from "./args.js";
import { analyze } from "../pipeline.js";
import { renderRecruiterPreview } from "../output/RecruiterPreviewRenderer.js";
import { renderScanReport, type StageComparisonRow } from "../output/ScanReportRenderer.js";
import { analyzeAboveFold } from "../analyzers/readability/AboveFoldAnalyzer.js";
import { detectDecisions } from "../analyzers/system_thinking/DecisionDetector.js";
import { generateDraft, enhanceWithLlm } from "../suggestions/DraftGenerator.js";
import { pickLlmClient } from "../llm/LlmClient.js";
import { applyDraft } from "./apply.js";
import { runConfig } from "./commands/config.js";
import { runTelemetry } from "./commands/telemetry.js";
import { ConfigStore } from "../config/ConfigStore.js";
import { Telemetry, pickTelemetrySink } from "../telemetry/TelemetryClient.js";
import { Ontology, type StageId } from "@tucaken/ontology";

const INFERENCE_GATE = 0.75;
const CLI_VERSION = "0.5.0";
const REPORTS_DIR = ".tucaken-signal/reports";

async function main(): Promise<void> {
  const args = parseArgs(process.argv);
  const cfg = new ConfigStore();
  const telemetry = new Telemetry(cfg, pickTelemetrySink(cfg));

  if (args.command === "help") return printHelp();
  if (args.command === "config") process.exit(runConfig(args.positional, cfg));
  if (args.command === "telemetry") process.exit(runTelemetry(args.positional, cfg));
  if (args.command === "ontology") {
    const o = new Ontology();
    process.stdout.write(`Tucaken ontology v${o.version.version} (released ${o.version.released})\n`);
    process.stdout.write(`Archetypes: ${o.listArchetypes().map((a) => a.id).join(", ")}\n`);
    return;
  }

  const root = resolve(args.path);

  if (args.command === "apply") return runApply(args, root);

  // Default + `scan`
  await runScan(args, root, cfg, telemetry);
}

async function runScan(
  args: ReturnType<typeof parseArgs>,
  root: string,
  cfg: ConfigStore,
  telemetry: Telemetry
): Promise<void> {
  const { report, evidence } = await analyze({
    root, stage: args.stage, archetype: args.archetype, withGithub: args.withGithub,
  });

  await telemetry.record({
    cli_version: CLI_VERSION,
    ontology_version: report.ontologyVersion,
    archetype_detected: report.archetype.id,
    stage: report.stage.id,
    suggestion_count: report.suggestions.length,
    command_used: "scan",
  });

  // Confidence gate — ask the user rather than silently accepting.
  if (report.stage.inferred && report.stage.confidence < INFERENCE_GATE && !args.stage && !args.yes) {
    process.stderr.write(
      `\n⚠ Stage inference confidence ${report.stage.confidence} below gate (${INFERENCE_GATE}).\n` +
      `  Inferred: ${report.stage.id} (${report.stage.explanation})\n` +
      `  Re-run with --stage=junior|mid|senior|staff to lock the target, or --yes to accept.\n\n`
    );
  }

  // Stage comparison (folds in the old compare-stages command).
  const stages: StageId[] = ["junior", "mid", "senior", "staff"];
  const stageComparison: StageComparisonRow[] = [];
  for (const s of stages) {
    const r = (await analyze({ root, stage: s, archetype: report.archetype.id, withGithub: args.withGithub })).report;
    stageComparison.push({ stage: s, overallScore: r.overallScore, topSuggestion: r.suggestions[0]?.title ?? "(none)" });
  }

  const previewText = renderRecruiterPreview({
    evidence, fold: analyzeAboveFold(evidence), archetype: report.archetype.id,
  });

  const repoName = basename(root);
  const generatedAt = new Date().toISOString().slice(0, 10);
  const md = renderScanReport({ repoName, repoPath: root, generatedAt, report, previewText, stageComparison });

  // Write the persistent report (kb-discovery model).
  const reportsDir = join(root, REPORTS_DIR);
  mkdirSync(reportsDir, { recursive: true });
  const reportPath = join(reportsDir, `${generatedAt}-${repoName}.md`);
  writeFileSync(reportPath, md, "utf8");

  // Terminal summary — short. The report file is the durable artifact.
  process.stdout.write(`\n${repoName} — ${report.archetype.id} • stage ${report.stage.id} • ${report.overallScore}/100\n`);
  for (const p of report.pillars) {
    process.stdout.write(`  ${p.pillar.padEnd(20)} ${String(p.score).padStart(3)}/100\n`);
  }
  const draftable = report.suggestions.filter((s) => s.draftAvailable).length;
  process.stdout.write(`\n${report.suggestions.length} suggestions (${draftable} draftable). Full report:\n  ${reportPath}\n`);
  process.stdout.write(`\nNext: tucaken-signal apply .   (pick a draftable suggestion to write in)\n\n`);
}

async function runApply(args: ReturnType<typeof parseArgs>, root: string): Promise<void> {
  // Re-run analysis to get live suggestions (the report is for humans; the
  // live run is the source of truth for IDs + draft generation).
  const { report, evidence, diagramDraft } = await analyze({
    root, stage: args.stage, archetype: args.archetype, withGithub: args.withGithub,
  });

  const draftables = report.suggestions.filter((s) => s.draftAvailable);

  // No id given → list draftable suggestions and stop.
  if (!args.suggestionId) {
    if (!draftables.length) {
      process.stdout.write("No draftable suggestions for this repo.\n");
      maybePointToReport(root);
      return;
    }
    process.stdout.write("\nDraftable suggestions:\n\n");
    draftables.forEach((s) => {
      process.stdout.write(`  ${s.id}\n    ${s.title}\n`);
    });
    process.stdout.write(`\nPreview one:  tucaken-signal apply . --id=<id> --dry-run\n`);
    process.stdout.write(`Write one:    tucaken-signal apply . --id=<id> [--branch=name] [--no-commit]\n\n`);
    return;
  }

  const suggestion = report.suggestions.find((s) => s.id === args.suggestionId);
  if (!suggestion) {
    process.stderr.write(`No suggestion with id "${args.suggestionId}". Run \`tucaken-signal apply .\` to list draftable ids.\n`);
    process.exit(2);
  }

  let draft = generateDraft(suggestion, { report, diagramDraft, decisions: detectDecisions(evidence) });
  if (!draft) {
    process.stderr.write(`Suggestion "${args.suggestionId}" has no draft template.\n`);
    process.exit(2);
  }

  if (args.withLlm) {
    const llm = pickLlmClient({ withLlm: true });
    draft = await enhanceWithLlm(draft, suggestion, { report, diagramDraft, decisions: detectDecisions(evidence), llm });
  }

  // --dry-run → preview only (folds in the old `draft` command).
  if (args.dryRun) {
    process.stdout.write(`# ${draft.filename}\n\n${draft.content}\n`);
    process.stderr.write(`\n(dry-run — nothing written. Drop --dry-run to write this into the repo.)\n`);
    return;
  }

  const applied = await applyDraft({ repoRoot: root, draft, branch: args.branch, commit: !args.noCommit });
  process.stderr.write(`Wrote ${applied.writtenPath}\n`);
  if (applied.branchCreated) process.stderr.write(`Created branch ${applied.branchCreated}\n`);
  if (applied.committed) process.stderr.write(`Committed.\n`);
}

function maybePointToReport(root: string): void {
  const dir = join(root, REPORTS_DIR);
  try {
    const latest = readdirSync(dir).filter((f) => f.endsWith(".md")).sort().pop();
    if (latest) process.stdout.write(`See the full report: ${join(dir, latest)}\n`);
  } catch {/* no reports yet */}
}

function printHelp(): void {
  process.stdout.write(`tucaken-signal — portfolio trust-signal analyzer

Two-step workflow (mirrors kb-discovery → kb-doc):

  tucaken-signal scan [path]     Scan the repo, write a full report to
                                 .tucaken-signal/reports/<date>-<repo>.md
                                 (read-only — never modifies your repo).
                                 Report includes: pillar scores, the
                                 55-second recruiter preview, a stage
                                 comparison, every suggestion with its id,
                                 and anticipated interview questions.
                                 Bare \`tucaken-signal [path]\` does this too.

  tucaken-signal apply [path]    Read the suggestions, write one in.
                                 No --id → lists draftable suggestion ids.
                                 --id=<id> --dry-run → preview the draft.
                                 --id=<id> → write it into the repo.

Flags:
  --stage=junior|mid|senior|staff   lock the target stage (skips the gate)
  --archetype=<id>                  override the classifier
  --with-github                     opt-in GitHub signals (BYOK GITHUB_TOKEN)
  --with-llm                        opt-in LLM-enhanced drafts (apply only)
  --branch=<name>                   apply on a new branch
  --no-commit                       apply without committing
  --yes                             accept low-confidence inferred stage

Housekeeping:
  tucaken-signal config get|set|unset [key] [value]
  tucaken-signal telemetry opt-in|opt-out|status
  tucaken-signal ontology
`);
}

main().catch((e) => {
  process.stderr.write(`error: ${(e as Error).message}\n`);
  process.exit(1);
});
