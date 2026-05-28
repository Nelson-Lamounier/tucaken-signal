import { Ontology, type ArchetypeId, type StageId } from "@tucaken/ontology";
import { readRepo } from "./repo/RepoReader.js";
import { classifyArchetype } from "./analyzers/RepoClassifier.js";
import { inferStage } from "./analyzers/stage_calibration/StageInferenceEngine.js";
import { analyzeReadmeDensity } from "./analyzers/readability/ReadmeDensityAnalyzer.js";
import { analyzeAboveFold } from "./analyzers/readability/AboveFoldAnalyzer.js";
import { estimateScanTiming } from "./analyzers/readability/ScanTimingEstimator.js";
import { analyzeDeployment } from "./analyzers/production_reality/DeploymentAnalyzer.js";
import { analyzeAiUsage } from "./analyzers/authenticity/AiUsageAnalyzer.js";
import { detectHumanJudgment } from "./analyzers/authenticity/HumanJudgmentDetector.js";
import { analyzeCommitFingerprint } from "./analyzers/authenticity/CommitFingerprintAnalyzer.js";
import { analyzeArchitecture } from "./analyzers/system_thinking/ArchitectureAnalyzer.js";
import { detectDecisions } from "./analyzers/system_thinking/DecisionDetector.js";
import { generateAnticipatedQuestions } from "./analyzers/system_thinking/AnticipatedQuestionGenerator.js";
import { analyzeSkillEvidence } from "./analyzers/SkillEvidenceAnalyzer.js";
import { analyzeTutorialSignals } from "./analyzers/production_reality/TutorialSignalAnalyzer.js";
import { analyzeMaintenance } from "./analyzers/production_reality/MaintenanceSignalAnalyzer.js";
import { applyWeights, computePillarScores } from "./scoring/PillarScores.js";
import { generateSuggestions } from "./suggestions/SuggestionGenerator.js";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import type { EvidenceMap, TrustSignalReport } from "./types.js";
import { GitHubSignalsClient, parseGithubRemoteFromGit, type GitHubSignals } from "./github/GitHubSignalsClient.js";

export interface AnalyzeOptions {
  root: string;
  stage?: StageId;
  archetype?: ArchetypeId;
  withGithub?: boolean;
  githubRepo?: { owner: string; repo: string };
  githubToken?: string;
}

export interface AnalyzeResult {
  report: TrustSignalReport;
  evidence: EvidenceMap;
  ontology: Ontology;
  diagramDraft: string | null;
  github: GitHubSignals | null;
}

export async function analyze(opts: AnalyzeOptions): Promise<AnalyzeResult> {
  const ontology = new Ontology();
  const evidence = readRepo(opts.root);

  const classified = classifyArchetype(evidence, ontology);
  const archetypeId = opts.archetype ?? classified.id;
  const archetype = ontology.archetype(archetypeId);
  if (!archetype) throw new Error(`Unknown archetype: ${archetypeId}`);

  const github = await maybeFetchGithub(opts);

  const stageInf = inferStage(evidence, github);
  const stageId = opts.stage ?? stageInf.id;
  const stage =
    ontology.stage(stageId, archetypeId) ??
    ontology.stage("mid", archetypeId) ??
    ontology.stage("mid", "production_saas") ??
    ontology.stage("junior", "production_saas")!;

  const density = analyzeReadmeDensity(evidence);
  const fold = analyzeAboveFold(evidence);
  const scan = estimateScanTiming(fold, density, existsSync(join(opts.root, "docs")), !!evidence.signals.has_adrs);
  const deployment = analyzeDeployment(evidence);
  const aiUsage = analyzeAiUsage(evidence);
  const humanJudgment = detectHumanJudgment(opts.root, evidence);
  const commits = await analyzeCommitFingerprint(opts.root);
  const architecture = analyzeArchitecture(evidence);
  const decisions = detectDecisions(evidence);
  const tutorial = analyzeTutorialSignals(evidence);
  const maintenance = analyzeMaintenance(commits);

  const pillars = computePillarScores({
    evidence, fold, density, scan, deployment, aiUsage, commits, architecture, decisions, tutorial, maintenance, humanJudgment,
  });
  const overall = applyWeights(pillars, archetype.pillar_weights, stage.required_pillars ?? []);

  const suggestions = generateSuggestions({
    evidence, archetype, stage, pillarScores: pillars, decisions, aiUsage, architecture,
  });
  const anticipatedQuestions = generateAnticipatedQuestions(evidence, architecture, decisions);
  const skillEvidence = analyzeSkillEvidence(opts.root, evidence, architecture, decisions).candidates;

  const visible: string[] = [];
  if (fold?.hasPitchParagraph) visible.push(`pitch: "${fold.pitch?.slice(0, 80)}"`);
  if (evidence.signals.has_live_url_in_readme) visible.push("live URL in README");
  if (deployment.hasIac) visible.push(`IaC presence (${architecture.iacTools.join(", ") || "detected"})`);
  if (commits.available && commits.spanDays > 60) visible.push(`sustained commit history (${commits.spanDays}d)`);
  if (github) visible.push(`GitHub: ${github.stars} stars, ${github.contributorCount} contributors, ${github.releaseCount} releases`);

  const invisible: string[] = [];
  if (!evidence.signals.has_architecture_diagram) invisible.push("architecture");
  if (!evidence.signals.has_ai_usage_doc) invisible.push("AI usage transparency");
  if (!evidence.signals.has_adrs && decisions.length > 0) invisible.push(`${decisions.length} architectural decisions`);

  const report: TrustSignalReport = {
    archetype: { id: archetypeId, confidence: classified.confidence },
    stage: {
      id: stageId,
      inferred: !opts.stage,
      confidence: stageInf.confidence,
      explanation: opts.stage ? "user-provided" : stageInf.explanation,
    },
    pillars,
    overallScore: overall,
    recruiterGlance: { visible, invisible },
    suggestions,
    anticipatedQuestions,
    skillEvidence,
    ontologyVersion: ontology.version.version,
  };

  return { report, evidence, ontology, diagramDraft: architecture.diagramDraft, github };
}

async function maybeFetchGithub(opts: AnalyzeOptions): Promise<GitHubSignals | null> {
  if (!opts.withGithub) return null;
  const repo = opts.githubRepo ?? detectGithubRepoFromGit(opts.root);
  if (!repo) return null;
  const client = new GitHubSignalsClient({ token: opts.githubToken });
  if (!client.available) return null;
  return client.fetchRepoSignals(repo.owner, repo.repo);
}

function detectGithubRepoFromGit(root: string): { owner: string; repo: string } | null {
  const gitConfig = join(root, ".git", "config");
  if (!existsSync(gitConfig)) return null;
  try {
    const config = readFileSync(gitConfig, "utf8");
    const remoteMatch = config.match(/\[remote "origin"\][^[]*url\s*=\s*([^\n]+)/);
    if (!remoteMatch?.[1]) return null;
    return parseGithubRemoteFromGit(remoteMatch[1].trim());
  } catch {
    return null;
  }
}
