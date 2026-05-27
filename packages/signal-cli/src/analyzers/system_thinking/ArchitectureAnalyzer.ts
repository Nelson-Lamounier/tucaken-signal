import type { EvidenceMap } from "../../types.js";

export interface ArchitectureResult {
  multiService: boolean;
  iacTools: string[];
  containerized: boolean;
  hasK8s: boolean;
  hasHelm: boolean;
  diagramDraft: string | null;
}

export function analyzeArchitecture(evidence: EvidenceMap): ArchitectureResult {
  const iacTools = new Set<string>();
  for (const p of evidence.files.iacRoots) {
    if (/cdk\.json/i.test(p)) iacTools.add("aws-cdk");
    if (/main\.tf/i.test(p)) iacTools.add("terraform");
    if (/pulumi\.ya?ml/i.test(p)) iacTools.add("pulumi");
    if (/chart\.ya?ml/i.test(p)) iacTools.add("helm");
    if (/kustomization\.ya?ml/i.test(p)) iacTools.add("kustomize");
  }
  const multiService = !!evidence.signals.has_compose || evidence.files.k8sManifests.length > 1;
  const containerized = !!evidence.signals.has_dockerfile || !!evidence.signals.has_compose;
  const hasK8s = evidence.files.k8sManifests.length > 0;
  const hasHelm = evidence.files.helmCharts.length > 0;

  const diagramDraft = !evidence.signals.has_architecture_diagram
    ? buildMermaidDraft({ iacTools: [...iacTools], multiService, containerized, hasK8s })
    : null;

  return { multiService, iacTools: [...iacTools], containerized, hasK8s, hasHelm, diagramDraft };
}

function buildMermaidDraft(o: { iacTools: string[]; multiService: boolean; containerized: boolean; hasK8s: boolean }): string {
  const lines = ["```mermaid", "graph TD"];
  lines.push("  Users[Users] --> LB[Load balancer / ingress]");
  if (o.hasK8s) lines.push("  LB --> K8s[Kubernetes cluster]");
  if (o.multiService) {
    lines.push("  LB --> Svc1[Service A]");
    lines.push("  LB --> Svc2[Service B]");
    lines.push("  Svc1 --> DB[(Database)]");
    lines.push("  Svc2 --> DB");
  } else {
    lines.push("  LB --> App[Application]");
    lines.push("  App --> DB[(Database)]");
  }
  if (o.iacTools.length) lines.push(`  %% Provisioned with: ${o.iacTools.join(", ")}`);
  lines.push("```");
  return lines.join("\n");
}
