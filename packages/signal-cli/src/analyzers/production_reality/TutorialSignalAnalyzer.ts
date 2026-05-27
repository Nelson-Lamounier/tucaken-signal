import type { EvidenceMap } from "../../types.js";

export interface TutorialSignalResult {
  score: number;
  flags: string[];
}

const GENERIC_NAMES = ["my-app", "test-project", "learning-typescript", "todo-app", "starter", "untitled"];
const CRA_MARKERS = [
  "You can learn more in the [Create React App documentation]",
  "This project was bootstrapped with [Create React App]",
  "Getting Started with Create React App",
];

export function analyzeTutorialSignals(evidence: EvidenceMap): TutorialSignalResult {
  const flags: string[] = [];
  let score = 0;

  const pkg = evidence.files.packageJson?.content as Record<string, unknown> | undefined;
  const name = (pkg?.name as string | undefined) ?? "";
  if (GENERIC_NAMES.includes(name.toLowerCase())) { score += 25; flags.push(`generic project name: ${name}`); }

  const readme = evidence.files.readme?.content ?? "";
  if (CRA_MARKERS.some((m) => readme.includes(m))) { score += 35; flags.push("README contains unchanged Create-React-App boilerplate"); }
  if (/^# (Hello World|Getting Started)\b/m.test(readme)) { score += 10; flags.push("hero heading is generic starter phrase"); }

  if (!evidence.signals.has_tests) { score += 10; flags.push("no tests"); }
  if (!evidence.signals.has_env_example && !evidence.signals.has_iac) { score += 10; flags.push("no env example, no IaC"); }
  if (!evidence.signals.has_deployment_workflow && !evidence.signals.has_live_url_in_readme) { score += 15; flags.push("no deployment evidence"); }

  return { score: Math.min(100, score), flags };
}
