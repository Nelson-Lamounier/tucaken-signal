import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import type { EvidenceMap } from "../types.js";
import type { ArchitectureResult } from "./system_thinking/ArchitectureAnalyzer.js";
import type { DetectedDecision } from "./system_thinking/DecisionDetector.js";

/**
 * Asset-finder lens, merged in from the kb-discovery skill. Where the pillar
 * scores are a gap-finder (what's missing / invisible), this surfaces what
 * the repo ALREADY demonstrates as skill evidence — even when undocumented.
 *
 * Each candidate is scored skill-evidence (1-5) × recruiter-relevance (1-5)
 * → priority. This is the same rubric kb-discovery uses; folding it into the
 * scan means one report shows both "what you have" and "what a recruiter
 * misses."
 */
export type EvidenceCategory =
  | "project" | "concept" | "tool" | "decision" | "pattern" | "infrastructure";

export interface SkillEvidenceCandidate {
  name: string;
  category: EvidenceCategory;
  skillScore: number;       // 1-5
  recruiterScore: number;   // 1-5
  priority: number;         // skill × recruiter
  referencePath: string;
  documented: boolean;      // does a doc already exist for this?
}

export interface SkillEvidenceResult {
  candidates: SkillEvidenceCandidate[];
  /** Latent depth that exists but isn't documented — drives partial pillar credit. */
  latentDepthSignal: number; // 0-1
}

const PKG_DIRS = ["packages", "apps", "services", "mcp-servers"];
const STACK_DIRS = ["infra/lib/stacks", "infra/lib", "cdk/lib"];

export function analyzeSkillEvidence(
  root: string,
  evidence: EvidenceMap,
  architecture: ArchitectureResult,
  decisions: DetectedDecision[]
): SkillEvidenceResult {
  const candidates: SkillEvidenceCandidate[] = [];
  const hasDocsTree = existsSync(join(root, "docs"));

  // ---- Projects: workspace packages / services / stacks ----
  for (const dir of PKG_DIRS) {
    const abs = join(root, dir);
    if (!existsSync(abs)) continue;
    for (const name of safeList(abs)) {
      const pkgDir = join(abs, name);
      if (!isDir(pkgDir)) continue;
      const desc = readPkgDescription(pkgDir);
      candidates.push({
        name: `${name}${desc ? ` — ${desc.slice(0, 60)}` : ""}`,
        category: "project",
        skillScore: 4,
        recruiterScore: recruiterRelevanceForName(name),
        priority: 4 * recruiterRelevanceForName(name),
        referencePath: `${dir}/${name}`,
        documented: existsSync(join(pkgDir, "README.md")) || hasDocsTree,
      });
    }
  }
  for (const dir of STACK_DIRS) {
    const abs = join(root, dir);
    if (!existsSync(abs)) continue;
    for (const name of safeList(abs)) {
      if (!isDir(join(abs, name))) continue;
      candidates.push({
        name: `${name} (infra stack)`,
        category: "infrastructure",
        skillScore: 5,
        recruiterScore: 5,
        priority: 25,
        referencePath: `${dir}/${name}`,
        documented: !!evidence.signals.has_adrs,
      });
    }
    break; // only the first stacks dir that exists
  }

  // ---- Decisions: detected architectural choices (latent until documented) ----
  for (const d of decisions) {
    candidates.push({
      name: `${d.topic}: chose ${d.chose}`,
      category: "decision",
      skillScore: 4,
      recruiterScore: 4,
      priority: 16,
      referencePath: d.evidencePath,
      documented: !!evidence.signals.has_adrs,
    });
  }

  // ---- Infrastructure / tooling signals ----
  if (architecture.iacTools.length) {
    for (const tool of architecture.iacTools) {
      candidates.push({
        name: `${tool} infrastructure-as-code`,
        category: "tool",
        skillScore: 4,
        recruiterScore: 5,
        priority: 20,
        referencePath: evidence.files.iacRoots[0] ?? "(iac)",
        documented: !!evidence.signals.has_adrs,
      });
    }
  }
  if (architecture.multiService) {
    candidates.push({
      name: "Multi-service architecture",
      category: "concept",
      skillScore: 5,
      recruiterScore: 4,
      priority: 20,
      referencePath: evidence.files.composeFile ?? "(multi-service)",
      documented: !!evidence.signals.has_architecture_diagram,
    });
  }
  if (evidence.signals.has_deployment_workflow || evidence.files.ciWorkflows.length) {
    candidates.push({
      name: "CI/CD pipeline",
      category: "pattern",
      skillScore: 3,
      recruiterScore: 5,
      priority: 15,
      referencePath: evidence.files.ciWorkflows[0] ?? ".github/workflows",
      documented: false,
    });
  }
  if (evidence.signals.has_tests) {
    candidates.push({
      name: "Test suite",
      category: "pattern",
      skillScore: 3,
      recruiterScore: 4,
      priority: 12,
      referencePath: "tests",
      documented: false,
    });
  }

  // De-dupe by name, sort by priority desc.
  const seen = new Set<string>();
  const deduped = candidates.filter((c) => {
    if (seen.has(c.name)) return false;
    seen.add(c.name);
    return true;
  });
  deduped.sort((a, b) => b.priority - a.priority);

  // Latent depth: high-priority candidates that are NOT yet documented.
  const undocumentedHighValue = deduped.filter((c) => c.priority >= 15 && !c.documented).length;
  const latentDepthSignal = Math.min(1, undocumentedHighValue / 4);

  return { candidates: deduped, latentDepthSignal };
}

function recruiterRelevanceForName(name: string): number {
  const n = name.toLowerCase();
  if (/mcp|cdk|terraform|k8s|kube|infra|deploy|cli/.test(n)) return 5;
  if (/api|server|service|auth|pipeline|ontology|analyzer/.test(n)) return 4;
  if (/extension|skill|adapter|util|config/.test(n)) return 2;
  return 3;
}

function readPkgDescription(pkgDir: string): string | null {
  const pkgPath = join(pkgDir, "package.json");
  if (!existsSync(pkgPath)) return null;
  try {
    const pkg = JSON.parse(readFileSync(pkgPath, "utf8")) as { description?: string };
    return pkg.description ?? null;
  } catch {
    return null;
  }
}

function safeList(dir: string): string[] {
  try { return readdirSync(dir); } catch { return []; }
}

function isDir(p: string): boolean {
  try { return existsSync(p) && readdirSync(p) !== undefined; } catch { return false; }
}
