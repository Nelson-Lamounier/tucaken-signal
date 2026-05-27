import type { ArchetypeDef, PillarId, StageDef } from "@tucaken/ontology";
import type { EvidenceMap, PillarScore, Suggestion } from "../types.js";
import type { DetectedDecision } from "../analyzers/system_thinking/DecisionDetector.js";
import type { AiUsageResult } from "../analyzers/authenticity/AiUsageAnalyzer.js";

export interface SuggestionInputs {
  evidence: EvidenceMap;
  archetype: ArchetypeDef;
  stage: StageDef;
  pillarScores: PillarScore[];
  decisions: DetectedDecision[];
  aiUsage: AiUsageResult;
}

export function generateSuggestions({
  evidence, archetype, stage, pillarScores, decisions, aiUsage,
}: SuggestionInputs): Suggestion[] {
  const out: Suggestion[] = [];

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
      title: "Add an AI Usage section or AI_USAGE.md",
      description: `Some content shows AI-assistance patterns (${aiUsage.reasons.slice(0, 2).join("; ")}). In 2026, transparent AI usage is a credibility signal, not a weakness.`,
      evidenceBasis: aiUsage.reasons.map((r) => ({ kind: "ai_fingerprint", note: r })),
      impactScore: 0.8,
      effortScore: 0.2,
      pillarWeight: weight,
      combinedRank: round((weight * 0.8) / 0.2),
      draftAvailable: true,
    });
  }

  // Cross-cutting: pillar-score gap suggestions
  for (const p of pillarScores) {
    if (p.score >= 65) continue;
    const weight = archetype.pillar_weights[p.pillar] ?? 0.2;
    for (const note of p.notes) {
      out.push({
        id: `gap.${p.pillar}.${slug(note)}`,
        pillar: p.pillar,
        category: "thin",
        stageTarget: "any",
        title: capitalize(note),
        description: `Score ${p.score}/100 on ${p.pillar}. Addressing this gap would lift the pillar.`,
        evidenceBasis: [{ kind: "pillar_score", note }],
        impactScore: pillarGapImpact(p.pillar as PillarId),
        effortScore: 0.3,
        pillarWeight: weight,
        combinedRank: round((weight * 0.6) / 0.3),
        draftAvailable: false,
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
