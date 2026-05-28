import type { PillarId } from "@tucaken/ontology";
import type { EvidenceMap, PillarScore } from "../types.js";
import type { AboveFoldResult } from "../analyzers/readability/AboveFoldAnalyzer.js";
import type { ReadmeDensityResult } from "../analyzers/readability/ReadmeDensityAnalyzer.js";
import type { ScanTimingResult } from "../analyzers/readability/ScanTimingEstimator.js";
import type { DeploymentResult } from "../analyzers/production_reality/DeploymentAnalyzer.js";
import type { AiUsageResult } from "../analyzers/authenticity/AiUsageAnalyzer.js";
import type { CommitFingerprintResult } from "../analyzers/authenticity/CommitFingerprintAnalyzer.js";
import type { ArchitectureResult } from "../analyzers/system_thinking/ArchitectureAnalyzer.js";
import type { DetectedDecision } from "../analyzers/system_thinking/DecisionDetector.js";
import type { TutorialSignalResult } from "../analyzers/production_reality/TutorialSignalAnalyzer.js";
import type { MaintenanceResult } from "../analyzers/production_reality/MaintenanceSignalAnalyzer.js";
import type { HumanJudgmentResult } from "../analyzers/authenticity/HumanJudgmentDetector.js";

export interface PillarInputs {
  evidence: EvidenceMap;
  fold: AboveFoldResult | null;
  density: ReadmeDensityResult | null;
  scan: ScanTimingResult;
  deployment: DeploymentResult;
  aiUsage: AiUsageResult;
  commits: CommitFingerprintResult;
  architecture: ArchitectureResult;
  decisions: DetectedDecision[];
  tutorial: TutorialSignalResult;
  maintenance: MaintenanceResult;
  humanJudgment: HumanJudgmentResult;
}

export function computePillarScores(inputs: PillarInputs): PillarScore[] {
  return [
    scoreAuthenticity(inputs),
    scoreReadability(inputs),
    scoreSystemThinking(inputs),
    scoreProductionReality(inputs),
    scoreStageCalibration(inputs),
  ];
}

function scoreReadability({ scan, fold, density }: PillarInputs): PillarScore {
  const score = Math.round((scan.thirtySecond + scan.twoMinute) / 2);
  const notes: string[] = [];
  if (!fold?.hasPitchParagraph) notes.push("no pitch paragraph above the fold");
  if (!fold?.hasDemoLink) notes.push("no demo link above the fold");
  if (!density?.diagramPresent) notes.push("no architecture diagram detected");
  return { pillar: "readability", score, notes };
}

function scoreProductionReality({ deployment, tutorial, maintenance }: PillarInputs): PillarScore {
  let s = deployment.score;
  s -= Math.round(tutorial.score * 0.4); // tutorial signals reduce production credibility
  if (maintenance.sustainedActivity) s += 10;
  if (maintenance.burstThenDormant) s -= 10;
  const notes: string[] = [];
  if (!deployment.hasIac) notes.push("no IaC detected");
  if (!deployment.hasDeployWorkflow) notes.push("no deployment workflow detected");
  if (!deployment.hasLiveUrl) notes.push("no live URL in README");
  if (tutorial.flags.length) notes.push(`tutorial signals: ${tutorial.flags[0]}`);
  return { pillar: "production_reality", score: clamp(s), notes };
}

function scoreSystemThinking({ evidence, density, architecture, decisions }: PillarInputs): PillarScore {
  let s = 0;
  const notes: string[] = [];

  // Documented signals — full credit.
  if (density?.diagramPresent) s += 25; else notes.push("no architecture diagram");
  if (evidence.signals.has_adrs) s += 35; else notes.push("no ADRs");
  if (evidence.files.runbookFiles.length) s += 10;

  // Latent-evidence credit: architectural judgement that EXISTS in the code
  // but isn't documented still counts. A repo with a multi-service topology
  // and detected decisions demonstrates system thinking even with no ADR
  // file — scoring it 0 would be the tool failing its own thesis.
  if (architecture.multiService) s += 12;
  if (architecture.iacTools.length) s += 12;
  if (decisions.length > 0) {
    s += Math.min(20, 8 + decisions.length * 4); // detected choices = real judgement
    if (!evidence.signals.has_adrs) {
      notes.push(`${decisions.length} architectural decision${decisions.length === 1 ? "" : "s"} detected but undocumented — high-leverage to write up`);
    }
  }
  if (evidence.signals.has_multi_package_src && !architecture.multiService) {
    s += 8; // monorepo structure implies some system decomposition
  }

  return { pillar: "system_thinking", score: clamp(s), notes };
}

function scoreAuthenticity({ evidence, aiUsage, commits, humanJudgment }: PillarInputs): PillarScore {
  let s = 50;
  const notes: string[] = [];
  // Positive reinforcement only: +25 when doc present. Absence is noted
  // (suggestion engine surfaces it) but not penalised — personal-portfolio
  // AI disclosure is still uncharted territory in 2026 (see
  // validation/research/structured-inquiries-2026.md).
  if (aiUsage.docPresent) s += 25;
  else if (aiUsage.fingerprintConfidence > 0.3) {
    notes.push("AI fingerprint signals detected; AI_USAGE.md is a credibility opportunity");
  } else notes.push("no AI_USAGE.md or AI Usage section detected");

  if (commits.available) {
    if (commits.totalCommits > 30) s += 10;
    if (commits.spanDays > 60) s += 5;
    if (commits.revertCount > 0) s += 5; // human-trail
    if (commits.messageVariability > 0.5) s += 5;
  }

  // Human-judgment fingerprints are positive authenticity signal
  if (humanJudgment.confidence > 0.4) { s += 10; notes.push("strong human-judgment signals in code"); }
  else if (humanJudgment.confidence > 0.1) s += 5;

  return { pillar: "authenticity", score: clamp(s), notes };
}

function scoreStageCalibration(_: PillarInputs): PillarScore {
  return { pillar: "stage_calibration", score: 60, notes: ["modulator pillar; see stage comparison in the report"] };
}

/**
 * Overall score = pillar scores weighted by archetype, then modulated by the
 * stage's required pillars. A stage's required pillars get a 1.5× weight bump
 * (re-normalised) so the same repo scores differently for junior vs staff —
 * the whole point of stage calibration. Without this, every stage returns
 * the identical overall and the comparison table looks broken.
 */
export function applyWeights(
  scores: PillarScore[],
  weights: Record<PillarId, number>,
  requiredPillars: PillarId[] = []
): number {
  const required = new Set(requiredPillars);
  const effective: Record<string, number> = {};
  let weightSum = 0;
  for (const s of scores) {
    const base = weights[s.pillar] ?? 0;
    const w = required.has(s.pillar) ? base * 1.5 : base;
    effective[s.pillar] = w;
    weightSum += w;
  }
  if (weightSum === 0) return 0;
  let total = 0;
  for (const s of scores) total += s.score * (effective[s.pillar]! / weightSum);
  return Math.round(total);
}

function clamp(n: number): number { return Math.max(0, Math.min(100, n)); }
