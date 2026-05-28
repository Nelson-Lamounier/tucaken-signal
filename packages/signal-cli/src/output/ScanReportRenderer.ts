import type { StageId } from "@tucaken/ontology";
import type { TrustSignalReport } from "../types.js";

export interface StageComparisonRow {
  stage: StageId;
  overallScore: number;
  topSuggestion: string;
}

export interface ScanReportInput {
  repoName: string;
  repoPath: string;
  generatedAt: string;
  report: TrustSignalReport;
  previewText: string;
  stageComparison: StageComparisonRow[];
}

function bar(score: number): string {
  const filled = Math.round(score / 20);
  return "●".repeat(filled) + "○".repeat(5 - filled);
}

const PILLAR_LABEL: Record<string, string> = {
  authenticity: "Authenticity",
  readability: "Readability",
  system_thinking: "System Thinking",
  production_reality: "Production Reality",
  stage_calibration: "Stage Calibration",
};

/**
 * Single self-contained scan report. Folds what used to be four commands
 * (analyze + preview + compare-stages + --format=md) into one persistent
 * markdown artifact, mirroring the kb-discovery report model.
 */
export function renderScanReport(input: ScanReportInput): string {
  const { report, repoName, repoPath, generatedAt, previewText, stageComparison } = input;
  const o: string[] = [];

  o.push(`# Tucaken Signal — ${repoName}`);
  o.push("");
  o.push(`> Scanned ${generatedAt} · \`${repoPath}\``);
  o.push(`> Archetype: \`${report.archetype.id}\` (confidence ${report.archetype.confidence}) · ` +
    `Stage: \`${report.stage.id}\` (${report.stage.inferred ? `inferred, confidence ${report.stage.confidence}` : "user-specified"})`);
  o.push("");
  o.push(`**Overall trust signal: ${report.overallScore}/100**`);
  o.push("");

  // ---- Pillars ----
  o.push("## Pillar scores");
  o.push("");
  o.push("| Pillar | Score | | Note |");
  o.push("|---|---|---|---|");
  for (const p of report.pillars) {
    o.push(`| ${PILLAR_LABEL[p.pillar] ?? p.pillar} | ${p.score}/100 | ${bar(p.score)} | ${p.notes[0] ?? "—"} |`);
  }
  o.push("");

  // ---- Recruiter glance ----
  o.push("## What a recruiter sees in 55 seconds");
  o.push("");
  if (report.recruiterGlance.visible.length) {
    o.push("**Visible above the fold:**");
    o.push("");
    for (const v of report.recruiterGlance.visible) o.push(`- ${v}`);
    o.push("");
  }
  if (report.recruiterGlance.invisible.length) {
    o.push("**Invisible (depth that won't be read):**");
    o.push("");
    for (const i of report.recruiterGlance.invisible) o.push(`- ${i}`);
    o.push("");
  }

  // ---- Full preview block ----
  o.push("<details>");
  o.push("<summary>Full 55-second recruiter simulation</summary>");
  o.push("");
  o.push("```");
  o.push(previewText.trimEnd());
  o.push("```");
  o.push("");
  o.push("</details>");
  o.push("");

  // ---- Stage comparison ----
  o.push("## How this repo scores across career stages");
  o.push("");
  o.push("| Stage | Overall | Top suggestion |");
  o.push("|---|---|---|");
  for (const row of stageComparison) {
    const marker = row.stage === report.stage.id ? " ←" : "";
    o.push(`| \`${row.stage}\`${marker} | ${row.overallScore}/100 | ${row.topSuggestion} |`);
  }
  o.push("");

  // ---- Suggestions ----
  o.push(`## Suggestions (${report.suggestions.length})`);
  o.push("");
  o.push("Ranked by `pillar_weight × impact / effort`. Draftable items can be");
  o.push("written into the repo with `tucaken-signal apply`.");
  o.push("");
  report.suggestions.forEach((s, i) => {
    o.push(`### ${i + 1}. ${s.title}`);
    o.push("");
    o.push(`- **id:** \`${s.id}\``);
    o.push(`- **pillar:** ${s.pillar} · **rank:** ${s.combinedRank} · **draftable:** ${s.draftAvailable ? "yes" : "no"}`);
    o.push(`- ${s.description.split("\n")[0]}`);
    if (s.evidenceBasis.length) {
      const ev = s.evidenceBasis.map((e) => e.path ?? e.kind).filter(Boolean).join(", ");
      if (ev) o.push(`- **evidence:** ${ev}`);
    }
    o.push("");
  });

  // ---- Anticipated questions ----
  if (report.anticipatedQuestions.length) {
    o.push("## Anticipated interview questions");
    o.push("");
    for (const q of report.anticipatedQuestions) {
      o.push(`- **${q.topic}** — ${q.question}`);
      o.push(`  - ${q.documentedHere ? `documented in \`${q.documentedHere}\`` : "*not documented here*"}`);
    }
    o.push("");
  }

  // ---- Footer ----
  o.push("---");
  o.push("");
  o.push("## Next step");
  o.push("");
  o.push("```bash");
  o.push("tucaken-signal apply .   # pick a draftable suggestion, review, write it in");
  o.push("```");
  o.push("");
  o.push(`*Ontology v${report.ontologyVersion} · Tucaken Signal*`);
  o.push("");
  return o.join("\n");
}
