import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { execFileSync } from "node:child_process";
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

// Source subdir names that signal a named architectural concept.
const CONCEPT_DIRS: Record<string, string> = {
  analyzers: "Analysis pipeline",
  analysis: "Analysis pipeline",
  scoring: "Scoring engine",
  suggestions: "Suggestion engine",
  engine: "Core engine",
  pipeline: "Processing pipeline",
  rules: "Rules engine",
  strategies: "Strategy layer",
  ontology: "Ontology model",
  agents: "Agent system",
  rag: "RAG subsystem",
  embeddings: "Embedding subsystem",
  observability: "Observability layer",
  auth: "Authentication subsystem",
  domain: "Domain model",
};

// Comparison-only markers. A bare "because" is explanation, not a decision —
// requiring an explicit alternative ("X over Y", "instead of") filters
// incidental prose (and the analyzer's own explanatory comments) and only
// surfaces genuine tradeoff decisions.
const DECISION_MARKERS = "instead of|rather than|migrated from|opted for|in favou?r of|chose .{1,40} over|replaced .{1,40} with|prefer(red)? .{1,40} over| over (terraform|ecs|eks|rest|graphql|mongodb|dynamodb|webpack|npm|yarn)";

// Library → recruiter-relevance. Returns 0 for trivial/ubiquitous deps that
// aren't skill evidence (yaml, dotenv, lodash). Only deps scoring >= 3 are
// surfaced as tool candidates.
function depRelevance(name: string): { score: number; label: string } | null {
  const map: Array<[RegExp, number, string]> = [
    [/@modelcontextprotocol\/sdk/, 5, "Model Context Protocol SDK"],
    [/@aws-sdk\//, 5, "AWS SDK"],
    [/aws-cdk|aws-cdk-lib/, 5, "AWS CDK"],
    [/web-tree-sitter|tree-sitter/, 4, "Tree-sitter AST parsing"],
    [/^pg$|postgres|pgvector/, 4, "PostgreSQL"],
    [/^next$|^react$|^vue$|svelte/, 4, "Frontend framework"],
    [/fastify|hono|express/, 4, "HTTP framework"],
    [/simple-git|nodegit/, 3, "Git automation"],
    [/openai|anthropic|@google\/genai|bedrock/, 5, "LLM SDK"],
    [/redis|ioredis/, 4, "Redis"],
    [/zod|valibot/, 3, "Runtime schema validation"],
    [/gray-matter|remark|unified/, 3, "Markdown processing"],
    [/vitest|jest|mocha/, 3, "Test framework"],
    [/prom-client|opentelemetry|@sentry/, 4, "Observability"],
  ];
  for (const [re, score, label] of map) if (re.test(name)) return { score, label };
  return null;
}

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

  // ---- Concept-level decomposition (Option B): notable subsystems ----
  // Surface architectural concepts inside packages, not just the package
  // itself. Matches kb-discovery's concept granularity.
  for (const dir of PKG_DIRS) {
    const abs = join(root, dir);
    if (!existsSync(abs)) continue;
    for (const pkg of safeList(abs)) {
      const srcDir = join(abs, pkg, "src");
      if (!isDir(srcDir)) continue;
      for (const sub of safeList(srcDir)) {
        const subPath = join(srcDir, sub);
        if (!isDir(subPath)) continue;
        const concept = CONCEPT_DIRS[sub.toLowerCase()];
        if (!concept) continue;
        const fileCount = countSourceFiles(subPath);
        if (fileCount < 2) continue; // needs substance
        // Quality: name the concept by its primary exported symbol when one
        // stands out, e.g. "Analysis pipeline (RepoClassifier)" instead of
        // the generic directory label.
        const primary = primaryExport(subPath);
        const label = primary ? `${concept} — ${primary}` : concept;
        candidates.push({
          name: `${label} (${pkg})`,
          category: "concept",
          skillScore: fileCount >= 5 ? 5 : 4, // larger subsystem = stronger evidence
          recruiterScore: 4,
          priority: (fileCount >= 5 ? 5 : 4) * 4,
          referencePath: `${dir}/${pkg}/src/${sub}`,
          documented: hasDocsTree,
        });
      }
    }
  }

  // ---- Dependency-based tool evidence (quality pass) ----
  // Reads actual package.json dependencies — the accurate way to surface
  // "library X is used". Deterministic: it cannot list a lib that isn't
  // installed (unlike spec-based guessing, which hallucinates).
  for (const tool of dependencyTools(root)) {
    candidates.push({
      name: tool.label,
      category: "tool",
      skillScore: 4,
      recruiterScore: tool.score,
      priority: 4 * tool.score,
      referencePath: tool.path,
      documented: hasDocsTree,
    });
  }

  // ---- Methodology / validation assets (Option B) ----
  for (const dir of ["validation", "test", "tests", "e2e", "benchmarks"]) {
    const abs = join(root, dir);
    if (!isDir(abs)) continue;
    const hasRunners = safeList(abs).some((f) => /\.(ts|js|py)$/.test(f)) ||
      safeList(abs).some((d) => isDir(join(abs, d)));
    if (!hasRunners) continue;
    candidates.push({
      name: `${dir === "validation" ? "Validation / accuracy harness" : "Test harness"} (${dir}/)`,
      category: "concept",
      skillScore: dir === "validation" ? 5 : 3,
      recruiterScore: 4,
      priority: dir === "validation" ? 20 : 12,
      referencePath: `${dir}/`,
      documented: hasDocsTree,
    });
    break; // one methodology asset is enough
  }

  // ---- Decision archaeology (Option B): git-grep tradeoff comments ----
  for (const d of decisionArchaeology(root)) {
    candidates.push({
      name: `Decision: ${d.summary}`,
      category: "decision",
      skillScore: 4,
      recruiterScore: 3,
      priority: 12,
      referencePath: d.path,
      documented: !!evidence.signals.has_adrs,
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

interface DepTool { label: string; score: number; path: string }

/** Surfaces notable libraries from every package.json's dependencies. */
function dependencyTools(root: string): DepTool[] {
  const found = new Map<string, DepTool>();
  const manifests = [join(root, "package.json"), ...PKG_DIRS.flatMap((d) => {
    const abs = join(root, d);
    return existsSync(abs) ? safeList(abs).map((p) => join(abs, p, "package.json")) : [];
  })];
  for (const manifest of manifests) {
    if (!existsSync(manifest)) continue;
    let deps: Record<string, string> = {};
    try {
      const pkg = JSON.parse(readFileSync(manifest, "utf8")) as {
        dependencies?: Record<string, string>; devDependencies?: Record<string, string>;
      };
      deps = { ...pkg.dependencies, ...pkg.devDependencies };
    } catch { continue; }
    for (const name of Object.keys(deps)) {
      if (name.startsWith("@tucaken/")) continue; // internal workspace deps
      const rel = depRelevance(name);
      if (!rel || rel.score < 3) continue;
      // Keep the highest-scoring instance of each label.
      const existing = found.get(rel.label);
      if (!existing || rel.score > existing.score) {
        found.set(rel.label, { label: rel.label, score: rel.score, path: relManifest(root, manifest) });
      }
    }
  }
  return [...found.values()];
}

function relManifest(root: string, manifest: string): string {
  return manifest.replace(root + "/", "").replace("/package.json", "") || "package.json";
}

/** Reads a concept dir for its primary exported class/function name. */
function primaryExport(dir: string): string | null {
  const classNames: string[] = [];
  const fnNames: string[] = [];
  for (const f of safeList(dir)) {
    if (!/\.(ts|js)$/.test(f) || /\.(test|spec|d)\./.test(f)) continue;
    let content = "";
    try { content = readFileSync(join(dir, f), "utf8"); } catch { continue; }
    for (const m of content.matchAll(/export\s+(?:abstract\s+)?class\s+([A-Z]\w+)/g)) classNames.push(m[1]!);
    for (const m of content.matchAll(/export\s+(?:async\s+)?function\s+([a-z]\w+)/g)) fnNames.push(m[1]!);
  }
  // Prefer a class name (concepts are usually classes); else a notable fn.
  if (classNames.length) return classNames[0]!;
  if (fnNames.length === 1) return fnNames[0]!;
  return null;
}

function countSourceFiles(dir: string): number {
  let n = 0;
  for (const f of safeList(dir)) {
    if (/\.(ts|tsx|js|jsx|py|go|rs)$/.test(f) && !/\.(test|spec)\./.test(f)) n++;
  }
  return n;
}

interface ArchaeologyHit { summary: string; path: string }

/**
 * git-grep for tradeoff comments — kb-discovery's pass 3, folded in.
 * Deterministic on a frozen repo. Capped + deduped by file. Best-effort:
 * returns [] when not a git repo or git is unavailable.
 */
function decisionArchaeology(root: string): ArchaeologyHit[] {
  if (!existsSync(join(root, ".git"))) return [];
  let raw = "";
  try {
    // Code files only — prose in .md/.txt produces false positives
    // ("...undersells you because depth is in code" is marketing, not a
    // decision). kb-discovery filters these by agent judgment; a
    // deterministic analyzer restricts to code comments instead.
    raw = execFileSync(
      "git",
      ["-C", root, "grep", "-niE", DECISION_MARKERS, "--", "*.ts", "*.js", "*.py", "*.go", "*.rs"],
      { encoding: "utf8", maxBuffer: 4 * 1024 * 1024, timeout: 10_000 }
    );
  } catch {
    return []; // no matches (git grep exits 1) or git unavailable
  }
  const byFile = new Map<string, string>();
  for (const line of raw.split("\n")) {
    if (!line) continue;
    const m = /^([^:]+):\d+:(.*)$/.exec(line);
    if (!m) continue;
    const path = m[1]!;
    if (/node_modules|dist|\.test\.|\.spec\.|fixtures?\//.test(path)) continue;
    const rawText = (m[2] ?? "").trim();
    // Only count COMMENT lines — decisions live in comments, not in string
    // literals or marketing copy embedded in code.
    if (!/^(\/\/|\*|\/\*|#)/.test(rawText)) continue;
    if (byFile.has(path)) continue; // one per file
    const text = rawText.replace(/^[/*#\s-]+/, "").slice(0, 70);
    if (text.length < 15) continue; // skip trivial fragments
    byFile.set(path, text);
    if (byFile.size >= 6) break;
  }
  return [...byFile.entries()].map(([path, summary]) => ({ path, summary }));
}

function safeList(dir: string): string[] {
  try { return readdirSync(dir); } catch { return []; }
}

function isDir(p: string): boolean {
  try { return existsSync(p) && readdirSync(p) !== undefined; } catch { return false; }
}
