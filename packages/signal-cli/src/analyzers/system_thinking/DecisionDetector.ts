import type { EvidenceMap } from "../../types.js";

export interface DetectedDecision {
  id: string;
  topic: string;
  chose: string;
  over: string[];
  evidencePath: string;
}

export function detectDecisions(evidence: EvidenceMap): DetectedDecision[] {
  const out: DetectedDecision[] = [];

  for (const p of evidence.files.iacRoots) {
    if (/cdk\.json/i.test(p)) {
      out.push({ id: "iac_choice", topic: "Infrastructure-as-Code", chose: "AWS CDK", over: ["Terraform", "Pulumi", "CloudFormation"], evidencePath: p });
    } else if (/main\.tf/i.test(p)) {
      out.push({ id: "iac_choice", topic: "Infrastructure-as-Code", chose: "Terraform", over: ["AWS CDK", "Pulumi"], evidencePath: p });
    } else if (/pulumi\.ya?ml/i.test(p)) {
      out.push({ id: "iac_choice", topic: "Infrastructure-as-Code", chose: "Pulumi", over: ["Terraform", "AWS CDK"], evidencePath: p });
    }
  }

  if (evidence.signals.has_helm_chart) {
    out.push({ id: "k8s_packaging", topic: "Kubernetes packaging", chose: "Helm", over: ["Kustomize", "raw manifests"], evidencePath: evidence.files.helmCharts[0] ?? "(helm chart)" });
  }
  if (evidence.signals.has_argocd_apps) {
    out.push({ id: "gitops", topic: "GitOps", chose: "ArgoCD", over: ["Flux", "manual kubectl"], evidencePath: "argocd/" });
  }

  const pkg = evidence.files.packageJson?.content as Record<string, unknown> | undefined;
  const deps = pkg ? { ...(pkg.dependencies as object), ...(pkg.devDependencies as object) } : {};
  if (deps && typeof deps === "object") {
    if ("next" in deps) out.push({ id: "fe_framework", topic: "Frontend framework", chose: "Next.js", over: ["Remix", "Astro", "Vite + React"], evidencePath: "package.json" });
    if ("@aws-sdk/client-bedrock-runtime" in deps) out.push({ id: "llm_provider", topic: "LLM provider", chose: "AWS Bedrock", over: ["OpenAI", "Anthropic direct"], evidencePath: "package.json" });
    if ("pg" in deps || "@aws-sdk/client-rds" in deps) out.push({ id: "db_choice", topic: "Database", chose: "Postgres", over: ["MongoDB", "DynamoDB"], evidencePath: "package.json" });
  }

  // Dedupe by (topic, chose) — multiple IaC entries from
  // multi-region CDK or app/infra splits shouldn't fire N copies of the
  // same decision. Keep the first evidence path.
  const seen = new Set<string>();
  return out.filter((d) => {
    const key = `${d.topic}::${d.chose}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}
