import type { TrustSignalReport } from "../types.js";

const PILLAR_LABEL = {
  authenticity: "Authenticity",
  readability: "Readability",
  system_thinking: "System Thinking",
  production_reality: "Production Reality",
  stage_calibration: "Stage Calibration",
} as const;

export function renderTerminal(report: TrustSignalReport): string {
  const lines: string[] = [];
  lines.push("");
  lines.push(`Archetype:      ${report.archetype.id} (confidence: ${report.archetype.confidence.toFixed(2)})`);
  lines.push(
    `${report.stage.inferred ? "Inferred stage" : "Stage         "}: ${report.stage.id} (${report.stage.explanation})`
  );
  lines.push("");
  lines.push(`Trust Signal Score:  ${bar(report.overallScore)}  ${report.overallScore}/100`);
  lines.push("");
  for (const p of report.pillars) {
    const label = (PILLAR_LABEL as Record<string, string>)[p.pillar] ?? p.pillar;
    const note = p.notes[0] ? `  (${p.notes[0]})` : "";
    lines.push(`  ${label.padEnd(20)} ${bar(p.score)}  ${String(p.score).padStart(3)}${note}`);
  }
  lines.push("");
  lines.push("What a recruiter sees in 55 seconds:");
  for (const v of report.recruiterGlance.visible) lines.push(`  → ${v}`);
  if (report.recruiterGlance.invisible.length) {
    lines.push(`  → Not visible: ${report.recruiterGlance.invisible.join("; ")}`);
  }
  lines.push("  → Run `tucaken-signal preview` for full 55-second simulation.");
  lines.push("");
  lines.push(`Top suggestions (${Math.min(5, report.suggestions.length)} of ${report.suggestions.length}):`);
  lines.push("");
  report.suggestions.slice(0, 5).forEach((s, i) => {
    lines.push(`  ${i + 1}. [${s.pillar.toUpperCase()}]`);
    lines.push(`     ${s.title}`);
    lines.push(`     ${s.description.split("\n")[0]}`);
    if (s.evidenceBasis.length) {
      lines.push(`     evidence: ${s.evidenceBasis.map((e) => e.path ?? e.kind).join(", ")}`);
    }
    lines.push("");
  });
  if (report.anticipatedQuestions.length) {
    lines.push("Anticipated interview questions this repo would face:");
    report.anticipatedQuestions.slice(0, 5).forEach((q, i) => {
      const status = q.documentedHere ? `documented in ${q.documentedHere}` : "not documented here";
      lines.push(`  ${i + 1}. [${q.topic}] ${q.question}`);
      lines.push(`     → ${status}`);
    });
    lines.push("");
  }
  lines.push(`Ontology v${report.ontologyVersion}`);
  lines.push("Run `tucaken-signal compare-stages` to see how this repo scores for senior roles.");
  lines.push("");
  return lines.join("\n");
}

function bar(score: number): string {
  const filled = Math.round(score / 20);
  return "●".repeat(filled) + "○".repeat(5 - filled);
}
