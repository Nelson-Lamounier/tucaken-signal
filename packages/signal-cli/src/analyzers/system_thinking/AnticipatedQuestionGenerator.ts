import type { ArchitectureResult } from "./ArchitectureAnalyzer.js";
import type { DetectedDecision } from "./DecisionDetector.js";
import type { EvidenceMap } from "../../types.js";

export interface AnticipatedQuestion {
  question: string;
  topic: string;
  documentedHere: string | null;
}

export function generateAnticipatedQuestions(
  evidence: EvidenceMap,
  architecture: ArchitectureResult,
  decisions: DetectedDecision[]
): AnticipatedQuestion[] {
  const out: AnticipatedQuestion[] = [];

  for (const d of decisions) {
    out.push({
      topic: d.topic,
      question: `Why did you choose ${d.chose} over ${d.over.slice(0, 2).join(" or ")}?`,
      documentedHere: evidence.signals.has_adrs ? evidence.files.adrDir ?? null : null,
    });
  }

  if (architecture.multiService) {
    out.push({
      topic: "service boundaries",
      question: "How do your services communicate, and how do you handle partial failure between them?",
      documentedHere: evidence.signals.has_architecture_diagram ? evidence.files.readme?.path ?? null : null,
    });
  }
  if (architecture.hasK8s) {
    out.push({
      topic: "kubernetes operations",
      question: "How would you debug a pod that is OOMKilled in production?",
      documentedHere: evidence.signals.has_runbook ? evidence.files.runbookFiles[0] ?? null : null,
    });
  }
  if (evidence.files.iacRoots.some((p) => /cdk\.json/i.test(p))) {
    out.push({
      topic: "infrastructure changes",
      question: "How do you preview infra changes before applying — and how do you roll back if a deploy goes wrong?",
      documentedHere: evidence.signals.has_runbook ? evidence.files.runbookFiles[0] ?? null : null,
    });
  }
  if (evidence.files.packageJson?.content && JSON.stringify(evidence.files.packageJson.content).includes("postgres")) {
    out.push({
      topic: "data model",
      question: "Walk me through the schema and the indexing strategy for your hottest query.",
      documentedHere: null,
    });
  }
  if (evidence.signals.has_deployment_workflow && !evidence.signals.has_runbook) {
    out.push({
      topic: "incident response",
      question: "What happens at 3 AM when this deploy fails — who gets paged and what's the first command they run?",
      documentedHere: null,
    });
  }

  // Cap at 5
  return out.slice(0, 5);
}
