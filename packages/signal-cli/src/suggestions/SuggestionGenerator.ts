import type { ArchetypeDef, PillarId, StageDef } from "@tucaken/ontology";
import type { EvidenceMap, PillarScore, Suggestion } from "../types.js";
import type { DetectedDecision } from "../analyzers/system_thinking/DecisionDetector.js";
import type { AiUsageResult } from "../analyzers/authenticity/AiUsageAnalyzer.js";
import type { ArchitectureResult } from "../analyzers/system_thinking/ArchitectureAnalyzer.js";

export interface SuggestionInputs {
  evidence: EvidenceMap;
  archetype: ArchetypeDef;
  stage: StageDef;
  pillarScores: PillarScore[];
  decisions: DetectedDecision[];
  aiUsage: AiUsageResult;
  architecture: ArchitectureResult;
}

/**
 * Maps a gap note to a draftable suggestion key + whether a draft can
 * actually be generated right now. The key's last `.`-segment must match a
 * handler in DraftGenerator.generateDraft so the scan→apply handoff works.
 */
function gapDraftMapping(
  note: string,
  ctx: { hasDiagram: boolean; decisionsCount: number; archetype: string }
): { key: string; draftable: boolean } | null {
  const n = note.toLowerCase();
  if (n.includes("architecture diagram")) {
    return { key: "no_architecture_diagram", draftable: true }; // arch doc always draftable (stub diagram)
  }
  if (n.includes("adr")) {
    return { key: "adr_for_decisions", draftable: ctx.decisionsCount > 0 };
  }
  if (n.includes("ai_usage") || n.includes("ai usage")) {
    return { key: "ai_usage_doc", draftable: true };
  }
  if (n.includes("demo link") || n.includes("live url")) {
    return { key: "deployment_proof", draftable: true };
  }
  if (n.includes("usage") && ctx.archetype === "open_source_library") {
    return { key: "add_usage_example", draftable: true };
  }
  return null;
}

export function generateSuggestions({
  evidence, archetype, stage, pillarScores, decisions, aiUsage,
}: SuggestionInputs): Suggestion[] {
  const out: Suggestion[] = [];
  const gapCtx = {
    hasDiagram: !!evidence.signals.has_architecture_diagram,
    decisionsCount: decisions.length,
    archetype: archetype.id as string,
  };

  for (const tmpl of stage.stage_specific_suggestions) {
    if (!triggerFires(tmpl.trigger, evidence)) continue;
    const weight = archetype.pillar_weights[tmpl.pillar] ?? 0.2;
    const rank = (weight * tmpl.impact) / Math.max(tmpl.effort, 0.1);
    out.push({
      id: `${stage.stage}.${tmpl.id}`,
      pillar: tmpl.pillar,
      category: "stage_specific",
      stageTarget: stage.stage,
      title: tmpl.title,
      description: tmpl.description.trim(),
      evidenceBasis: evidenceBasisFor(tmpl.trigger, evidence),
      impactScore: tmpl.impact,
      effortScore: tmpl.effort,
      pillarWeight: weight,
      combinedRank: round(rank),
      draftAvailable: DRAFTABLE.has(tmpl.id),
    });
  }

  // Decision-driven ADR suggestions
  if (decisions.length > 0 && !evidence.signals.has_adrs) {
    const weight = archetype.pillar_weights.system_thinking ?? 0.2;
    out.push({
      id: "system.adr_for_decisions",
      pillar: "system_thinking",
      category: "missing",
      stageTarget: "any",
      title: `Document ${decisions.length} undocumented architectural decisions as ADRs`,
      description: `Detected: ${decisions.map((d) => `${d.chose} (over ${d.over.join(", ")})`).join("; ")}. Each is interview-question fuel.`,
      evidenceBasis: decisions.map((d) => ({ kind: "decision", path: d.evidencePath, note: `${d.topic}: ${d.chose}` })),
      impactScore: 0.9,
      effortScore: 0.5,
      pillarWeight: weight,
      combinedRank: round((weight * 0.9) / 0.5),
      draftAvailable: true,
    });
  }

  // AI-usage suggestion if missing + fingerprints detected
  if (!aiUsage.docPresent && aiUsage.fingerprintConfidence > 0.2) {
    const weight = archetype.pillar_weights.authenticity ?? 0.2;
    out.push({
      id: "authenticity.ai_usage_doc",
      pillar: "authenticity",
      category: "missing",
      stageTarget: "any",
      title: "Add an AI Usage section to differentiate from generic-AI applications",
      description: `71% of engineering leaders say AI is making candidate assessment harder (IEEE-USA 2026), and many hiring teams now ask candidates to explain how they used AI. AI_USAGE.md is the asynchronous version of that — a short note documenting where you used AI and what you overrode. The signal that distinguishes you is personalisation, not absence of AI. Detected: ${aiUsage.reasons.slice(0, 2).join("; ")}.`,
      evidenceBasis: aiUsage.reasons.map((r) => ({ kind: "ai_fingerprint", note: r })),
      impactScore: 0.8,
      effortScore: 0.2,
      pillarWeight: weight,
      combinedRank: round((weight * 0.8) / 0.2),
      draftAvailable: true,
    });
  }

  // Cross-cutting: pillar-score gap suggestions.
  // A gap that maps to a real draft template is marked draftable AND given
  // an id whose last segment the DraftGenerator recognises — this is what
  // makes the scan→apply handoff produce something to act on.
  for (const p of pillarScores) {
    if (p.score >= 65) continue;
    const weight = archetype.pillar_weights[p.pillar] ?? 0.2;
    for (const note of p.notes) {
      const mapping = gapDraftMapping(note, gapCtx);
      const id = mapping ? `gap.${p.pillar}.${mapping.key}` : `gap.${p.pillar}.${slug(note)}`;
      out.push({
        id,
        pillar: p.pillar,
        category: "thin",
        stageTarget: "any",
        title: capitalize(note),
        description: `Score ${p.score}/100 on ${p.pillar}. Addressing this gap would lift the pillar.`,
        evidenceBasis: [{ kind: "pillar_score", note }],
        impactScore: pillarGapImpact(p.pillar),
        effortScore: 0.3,
        pillarWeight: weight,
        combinedRank: round((weight * 0.6) / 0.3),
        draftAvailable: mapping?.draftable ?? false,
      });
    }
  }

  // De-duplicate by title
  const seen = new Set<string>();
  const deduped = out.filter((s) => {
    const key = s.title.toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  deduped.sort((a, b) => b.combinedRank - a.combinedRank);
  return deduped.slice(0, 15);
}

const DRAFTABLE = new Set([
  "ai_transparency_section",
  "architecture_diagram_missing",
  "adr_backfill",
  "add_usage_example",
  "deployment_proof",
  "postmortem_invitation",
]);

function triggerFires(trigger: string, e: EvidenceMap): boolean {
  switch (trigger) {
    case "any": return true;
    case "ai_fingerprints_detected_or_recent": return !e.signals.has_ai_usage_doc;
    case "has_deployment_evidence_not_in_readme":
      return (!!e.signals.has_iac || !!e.signals.has_deployment_workflow) && !e.signals.has_live_url_in_readme;
    case "no_architecture_diagram": return !e.signals.has_architecture_diagram;
    case "significant_architectural_choices_detected_and_no_adrs":
      return (e.files.iacRoots.length > 0 || !!e.signals.has_dockerfile) && !e.signals.has_adrs;
    case "has_bug_fix_or_revert_commits": return true;
    case "no_usage_block": return !!e.signals.no_usage_block;
    case "no_changelog": return !!e.signals.no_changelog;
    case "no_screenshots": return !!e.signals.no_screenshots;
    case "no_demo_media": return !!e.signals.no_demo_media;
    case "no_runbook": return !!e.signals.no_runbook;
    default: return false;
  }
}

function evidenceBasisFor(trigger: string, e: EvidenceMap) {
  const refs: Suggestion["evidenceBasis"] = [];
  if (trigger.includes("iac") || trigger.includes("architectural")) {
    for (const p of e.files.iacRoots.slice(0, 3)) refs.push({ kind: "iac_file", path: p });
  }
  if (e.files.readme) refs.push({ kind: "readme", path: e.files.readme.path });
  return refs;
}

function pillarGapImpact(p: PillarId): number {
  return { readability: 0.7, system_thinking: 0.8, production_reality: 0.7, authenticity: 0.6, stage_calibration: 0.3 }[p];
}

function slug(s: string): string { return s.toLowerCase().replace(/[^a-z0-9]+/g, "_").slice(0, 40); }
function capitalize(s: string): string { return s ? s[0]!.toUpperCase() + s.slice(1) : s; }
function round(n: number): number { return Math.round(n * 100) / 100; }
