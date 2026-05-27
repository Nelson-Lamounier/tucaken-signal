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
  if (density?.diagramPresent) s += 25; else notes.push("no architecture diagram");
  if (evidence.signals.has_adrs) s += 35; else notes.push("no ADRs");
  if (architecture.multiService) s += 10;
  if (architecture.iacTools.length) s += 10;
  if (evidence.files.runbookFiles.length) s += 10;
  if (decisions.length >= 3 && !evidence.signals.has_adrs) {
    notes.push(`${decisions.length} undocumented architectural decisions detected`);
  }
  return { pillar: "system_thinking", score: clamp(s), notes };
}

function scoreAuthenticity({ evidence, aiUsage, commits, humanJudgment }: PillarInputs): PillarScore {
  let s = 50;
  const notes: string[] = [];
  if (aiUsage.docPresent) s += 25;
  else if (aiUsage.fingerprintConfidence > 0.3) {
    notes.push("AI fingerprint signals detected; AI_USAGE.md missing");
    s -= 5;
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
  return { pillar: "stage_calibration", score: 60, notes: ["modulator pillar; see compare-stages"] };
}

export function applyWeights(scores: PillarScore[], weights: Record<PillarId, number>): number {
  let total = 0;
  for (const s of scores) total += s.score * (weights[s.pillar] ?? 0);
  return Math.round(total);
}

function clamp(n: number): number { return Math.max(0, Math.min(100, n)); }
