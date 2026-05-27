import type { StageId } from "@tucaken/ontology";
import type { EvidenceMap } from "../../types.js";
import type { GitHubSignals } from "../../github/GitHubSignalsClient.js";

export interface StageInference {
  id: StageId;
  confidence: number;
  explanation: string;
}

export function inferStage(evidence: EvidenceMap, github?: GitHubSignals | null): StageInference {
  let score = 0;
  const reasons: string[] = [];

  if (evidence.signals.has_adrs) { score += 2; reasons.push("ADRs present"); }
  if (evidence.signals.has_runbook) { score += 2; reasons.push("runbook present"); }
  if (evidence.signals.has_iac) { score += 1; reasons.push("IaC present"); }
  if (evidence.signals.has_deployment_workflow) { score += 1; reasons.push("deployment workflow present"); }
  if (evidence.signals.has_tests) { score += 1; reasons.push("tests present"); }
  if (evidence.signals.has_compose) { score += 1; reasons.push("multi-service (docker-compose)"); }
  if (evidence.signals.has_workspaces_field || evidence.signals.has_nx_json || evidence.signals.has_turbo_json) {
    score += 1; reasons.push("monorepo workspace");
  }
  if ((evidence.metrics.readmeWords ?? 0) > 800) { score += 1; reasons.push("substantial README"); }
  if ((evidence.metrics.fileCount ?? 0) > 200) { score += 1; reasons.push("large codebase"); }
  if ((evidence.metrics.fileCount ?? 0) > 1000) { score += 2; reasons.push("very large codebase"); }
  if (evidence.signals.has_rfc_docs) { score += 2; reasons.push("RFCs present"); }
  if (evidence.signals.has_governance) { score += 1; reasons.push("governance doc"); }
  if (evidence.signals.has_codeowners) { score += 1; reasons.push("CODEOWNERS"); }
  if (evidence.signals.has_security_policy) { score += 1; reasons.push("SECURITY.md"); }

  // Library-maturity signals (libraries lack IaC/deploy, need their own ladder)
  if (evidence.signals.has_package_publish_config && evidence.signals.has_changelog) {
    score += 1; reasons.push("published library with CHANGELOG");
  }
  if (evidence.signals.has_examples_dir) { score += 1; reasons.push("examples directory"); }
  if (evidence.signals.has_api_docs) { score += 1; reasons.push("API docs"); }

  // GitHub API signals (opt-in via --with-github). These are the strongest
  // distinguishers for staff-vs-senior on OSS because static signals alone
  // cannot distinguish "mature lib" from "industry-standard mature lib".
  let ghPointsAdded = 0;
  if (github) {
    if (github.contributorCount >= 100) { ghPointsAdded += 3; reasons.push(`${github.contributorCount} contributors (gh)`); }
    else if (github.contributorCount >= 30) { ghPointsAdded += 2; reasons.push(`${github.contributorCount} contributors (gh)`); }
    else if (github.contributorCount >= 5) { ghPointsAdded += 1; reasons.push(`${github.contributorCount} contributors (gh)`); }

    if (github.stars >= 50_000) { ghPointsAdded += 3; reasons.push(`${github.stars} stars (gh)`); }
    else if (github.stars >= 10_000) { ghPointsAdded += 2; reasons.push(`${github.stars} stars (gh)`); }
    else if (github.stars >= 1_000) { ghPointsAdded += 1; reasons.push(`${github.stars} stars (gh)`); }

    if (github.releaseCount >= 200) { ghPointsAdded += 2; reasons.push(`${github.releaseCount} releases (gh)`); }
    else if (github.releaseCount >= 50) { ghPointsAdded += 1; reasons.push(`${github.releaseCount} releases (gh)`); }

    if (github.ageDays >= 365 * 5) { ghPointsAdded += 1; reasons.push(`${Math.round(github.ageDays / 365)}y old (gh)`); }
    if (github.archived) { ghPointsAdded -= 2; reasons.push("archived (gh)"); }
  }
  score += ghPointsAdded;

  // Threshold shift only kicks in when GH data was materially non-zero.
  // Private/visibility-restricted repos see GH endpoints but get 0 stars,
  // ~0 contributors → without this guard the higher thresholds would
  // downgrade them vs. static-only inference.
  const ghMeaningful = !!github && ghPointsAdded >= 2;
  let id: StageId;
  if (ghMeaningful) {
    if (score >= 14) id = "staff";
    else if (score >= 9) id = "senior";
    else if (score >= 5) id = "mid";
    else id = "junior";
  } else {
    if (score >= 8) id = "staff";
    else if (score >= 5) id = "senior";
    else if (score >= 3) id = "mid";
    else id = "junior";
  }

  const confidence = Math.min(1, score / (ghMeaningful ? 16 : 10) + 0.3);
  const explanation = reasons.length ? `inferred from: ${reasons.join("; ")}` : "low signal; default junior";
  return { id, confidence: round(confidence), explanation };
}

function round(n: number): number { return Math.round(n * 100) / 100; }
