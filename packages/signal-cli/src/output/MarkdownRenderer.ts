import type { TrustSignalReport } from "../types.js";

export function renderMarkdown(report: TrustSignalReport): string {
  const out: string[] = [];
  out.push(`# Tucaken Signal — ${report.archetype.id} • stage: ${report.stage.id}`);
  out.push("");
  out.push(`**Overall trust signal:** ${report.overallScore}/100`);
  out.push("");
  out.push("## Pillar scores");
  out.push("");
  out.push("| Pillar | Score | Notes |");
  out.push("|---|---|---|");
  for (const p of report.pillars) {
    out.push(`| ${p.pillar} | ${p.score} | ${p.notes.join("; ") || "—"} |`);
  }
  out.push("");
  out.push("## What a recruiter sees in 55 seconds");
  out.push("");
  for (const v of report.recruiterGlance.visible) out.push(`- ✅ ${v}`);
  for (const i of report.recruiterGlance.invisible) out.push(`- ❌ not visible: ${i}`);
  out.push("");
  out.push("## Top suggestions");
  out.push("");
  report.suggestions.slice(0, 10).forEach((s, i) => {
    out.push(`### ${i + 1}. ${s.title}`);
    out.push("");
    out.push(`*Pillar:* \`${s.pillar}\` • *stage:* \`${s.stageTarget}\` • *rank:* ${s.combinedRank}`);
    out.push("");
    out.push(s.description);
    if (s.evidenceBasis.length) {
      out.push("");
      out.push("**Evidence:**");
      for (const e of s.evidenceBasis) out.push(`- ${e.kind}${e.path ? ` — \`${e.path}\`` : ""}${e.note ? ` (${e.note})` : ""}`);
    }
    out.push("");
    if (s.draftAvailable) out.push(`> Run \`tucaken-signal draft ${s.id}\` to generate accept-ready content.`);
    out.push("");
  });
  if (report.anticipatedQuestions.length) {
    out.push("## Anticipated interview questions");
    out.push("");
    for (const q of report.anticipatedQuestions) {
      out.push(`- **${q.topic}** — ${q.question}`);
      out.push(`  - ${q.documentedHere ? `documented in \`${q.documentedHere}\`` : "*not documented here*"}`);
    }
    out.push("");
  }
  out.push(`---`);
  out.push(`*Ontology v${report.ontologyVersion}*`);
  return out.join("\n");
}
