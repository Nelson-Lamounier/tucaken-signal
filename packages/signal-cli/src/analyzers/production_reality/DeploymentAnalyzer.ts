import type { EvidenceMap } from "../../types.js";

export interface DeploymentResult {
  hasIac: boolean;
  hasDeployWorkflow: boolean;
  hasLiveUrl: boolean;
  hasContainerization: boolean;
  hasMonitoring: boolean;
  score: number;
}

export function analyzeDeployment(evidence: EvidenceMap): DeploymentResult {
  const hasIac = !!evidence.signals.has_iac;
  const hasDeployWorkflow = !!evidence.signals.has_deployment_workflow;
  const hasLiveUrl = !!evidence.signals.has_live_url_in_readme;
  const hasContainerization = !!evidence.signals.has_dockerfile || !!evidence.signals.has_compose;
  const hasMonitoring =
    evidence.files.ciWorkflows.some((p) => /(grafana|datadog|prometheus|sentry)/i.test(p)) ||
    Object.keys(evidence.files.packageJson?.content ?? {}).some((k) => /(sentry|datadog|opentelemetry)/i.test(k));

  let score = 0;
  if (hasIac) score += 25;
  if (hasDeployWorkflow) score += 25;
  if (hasLiveUrl) score += 25;
  if (hasContainerization) score += 15;
  if (hasMonitoring) score += 10;

  return { hasIac, hasDeployWorkflow, hasLiveUrl, hasContainerization, hasMonitoring, score };
}
