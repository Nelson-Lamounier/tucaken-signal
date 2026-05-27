import type { EvidenceMap } from "../types.js";
import type { AboveFoldResult } from "../analyzers/readability/AboveFoldAnalyzer.js";

export interface PreviewInputs {
  evidence: EvidenceMap;
  fold: AboveFoldResult | null;
  archetype: string;
}

export function renderRecruiterPreview({ evidence, fold, archetype }: PreviewInputs): string {
  const lines: string[] = [];
  lines.push("┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓");
  lines.push("┃   RECRUITER PREVIEW — 55 second simulated scan              ┃");
  lines.push("┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛");
  lines.push("");
  lines.push("── 0:00–0:30  Above-the-fold ────────────────────────────────");
  if (!evidence.files.readme) {
    lines.push("  ✗ No README. Recruiter sees only repo name and file tree.");
    lines.push("  → likely moves on within 10 seconds.");
  } else {
    const heading = fold?.topHeadings[0] ?? "(no top-level heading)";
    lines.push(`  Title:        ${heading}`);
    lines.push(`  Pitch:        ${fold?.pitch ? truncate(fold.pitch, 70) : "(missing — recruiter cannot tell what this is)"}`);
    lines.push(`  Status:       ${fold?.hasStatusSignal ? "visible" : "absent"}`);
    lines.push(`  Demo link:    ${fold?.hasDemoLink ? "visible" : "absent"}`);
    lines.push(`  Tech badges:  ${fold?.hasTechBadge ? "visible" : "absent"}`);
    lines.push("");
    lines.push("  Recruiter first impression:");
    lines.push(`    "${firstImpression(fold, archetype)}"`);
  }
  lines.push("");
  lines.push("── 0:30–2:00  Scroll + section scan ─────────────────────────");
  if (fold?.topHeadings.length) {
    lines.push("  Top sections seen:");
    for (const h of fold.topHeadings) lines.push(`    • ${h}`);
  }
  lines.push(`  Architecture diagram: ${evidence.signals.has_architecture_diagram ? "yes — depth visible at a glance" : "no — depth invisible"}`);
  lines.push(`  Deployment evidence:  ${evidence.signals.has_iac || evidence.signals.has_deployment_workflow ? "visible (IaC / CI)" : "not visible"}`);
  lines.push(`  AI transparency:      ${evidence.signals.has_ai_usage_doc ? "present (credibility signal)" : "absent (2026 risk: undisclosed-AI assumption)"}`);
  lines.push("");
  lines.push("── 2:00+  Deep-dive (only top ~20% of recruiters reach here) ─");
  lines.push(`  ADRs:    ${evidence.signals.has_adrs ? "present" : "missing"}`);
  lines.push(`  Runbook: ${evidence.signals.has_runbook ? "present" : "missing"}`);
  lines.push(`  Tests:   ${evidence.signals.has_tests ? "present" : "missing"}`);
  lines.push("");
  return lines.join("\n");
}

function firstImpression(fold: AboveFoldResult | null, archetype: string): string {
  if (!fold) return "I can't tell what this is. Moving on.";
  if (!fold.hasPitchParagraph) return "Looks like " + archetype.replace("_", " ") + " — but no clear pitch. Skim and decide.";
  if (fold.hasDemoLink && fold.hasStatusSignal) return "Real, deployed " + archetype.replace("_", " ") + ". Worth a closer look.";
  return "Reads as " + archetype.replace("_", " ") + ". Need to scroll to gauge depth.";
}

function truncate(s: string, n: number): string { return s.length > n ? s.slice(0, n - 1) + "…" : s; }
