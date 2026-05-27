import type { ArchetypeDef, ArchetypeId, Ontology } from "@tucaken/ontology";
import type { EvidenceMap } from "../types.js";

export interface ArchetypeClassification {
  id: ArchetypeId;
  confidence: number;
  scores: Record<ArchetypeId, number>;
}

// Decisive signal rules: a single strong fingerprint settles the archetype
// before falling through to additive scoring. Order matters — first match
// wins. More-specific archetypes are tested first.
interface DecisiveRule {
  archetype: ArchetypeId;
  matches: (e: EvidenceMap) => boolean;
  confidence: number;
}

const DECISIVE_RULES: DecisiveRule[] = [
  {
    archetype: "mobile_app",
    matches: (e) => !!(
      (e.signals.has_ios_dir && e.signals.has_android_dir) ||
      e.signals.has_expo_config ||
      e.signals.has_flutter_pubspec ||
      e.signals.has_root_android_app ||
      e.signals.has_root_ios_app ||
      e.signals.has_xamarin_mobile ||
      (e.signals.has_react_native && (e.signals.has_ios_dir || e.signals.has_android_dir))
    ),
    confidence: 0.95,
  },
  {
    archetype: "ml_research",
    matches: (e) => !!(
      e.signals.notebook_heavy ||
      (e.signals.has_notebooks && e.signals.has_requirements_with_ml_deps) ||
      (e.files.notebooks.length > 0 && (e.signals.has_data_dir || e.signals.has_experiments_dir || e.signals.has_models_dir))
    ),
    confidence: 0.9,
  },
  {
    // Static-site BEFORE library/monorepo: when the primary artifact is a
    // content site, semantic intent beats workspace mechanism.
    archetype: "static_site",
    matches: (e) => !!((e.signals.has_static_site_config || e.signals.has_docs_site_config) && e.signals.has_content_dir),
    confidence: 0.85,
  },
  {
    // Devops_infra: dispositive only if helm/k8s manifests in-tree, OR
    // ≥2 IaC files at infra-canonical paths (rejects sublime-syntax noise).
    archetype: "devops_infra",
    matches: (e) => {
      const strongInfra = !!(e.signals.has_helm_chart || e.signals.has_k8s_manifests);
      const hasInfraPath = e.files.iacRoots.some((p) => /(^|\/)(infra|terraform|deploy|helm|k8s|kubernetes|cdk|pulumi|argocd)(\/|$)/i.test(p));
      const iacOnly = e.files.iacRoots.length >= 2 && !e.files.packageJson && !e.signals.has_bin_field && hasInfraPath;
      return strongInfra || iacOnly;
    },
    confidence: 0.85,
  },
  {
    archetype: "monorepo",
    matches: (e) => !!(
      (e.signals.has_workspaces_field || e.signals.has_nx_json || e.signals.has_turbo_json || e.signals.has_pnpm_workspace) &&
      e.signals.has_multi_package_src
    ),
    confidence: 0.85,
  },
  {
    // CLI: three paths, each chosen to avoid catching libraries-that-ship-CLIs.
    //   - Rust: Cargo.toml + main.rs → cargoCli (size-agnostic; bat/ripgrep/fd are big).
    //   - Go: cmd/* with ≤3 subdirs → goCli (excludes kubernetes-style platforms).
    //   - npm: bin field WITHOUT publish config (main/exports) → npmCli.
    //     Libraries like prettier/eslint have both bin AND main → fall through
    //     to library rule.
    archetype: "cli_tool",
    matches: (e) => {
      const cmdCount = e.metrics.cmdSubdirCount ?? 0;
      const isSmall = (e.metrics.fileCount ?? 0) < 800;
      const cargoCli = !!e.signals.has_cargo_bin &&
        !e.signals.has_compose && !e.signals.has_k8s_manifests && !e.signals.has_helm_chart;
      // Go CLI: ≤2 cmd subdirs (allows 0 for single-binary-at-root like fzf;
      // excludes kubernetes-style platforms with 10+). Dockerfile only
      // disqualifies when there's a cmd/ directory (services like
      // prometheus ship cmd/* + Dockerfile; single-binary CLIs may ship a
      // distribution Dockerfile without being services).
      const goCli = !!e.signals.has_go_main &&
        !e.signals.has_compose && !e.signals.has_k8s_manifests && !e.signals.has_helm_chart &&
        cmdCount <= 2 &&
        (cmdCount === 0 || !e.signals.has_dockerfile);
      const npmCli = !!e.signals.has_bin_field && !e.signals.has_package_publish_config &&
        isSmall && !e.signals.has_workspaces_field && !e.signals.has_compose;
      return cargoCli || goCli || npmCli;
    },
    confidence: 0.85,
  },
  {
    // Library: publish config + license, no helm/iac. Bin and compose are
    // OK — mature libs often ship a CLI (prettier, eslint, jest) and use
    // docker-compose for testing.
    archetype: "open_source_library",
    matches: (e) => !!(
      (e.signals.has_package_publish_config || e.signals.has_pyproject_publish) &&
      e.signals.has_license &&
      !e.signals.has_iac &&
      !e.signals.has_helm_chart &&
      !e.signals.has_k8s_manifests
    ),
    confidence: 0.8,
  },
];

export function classifyArchetype(evidence: EvidenceMap, ontology: Ontology): ArchetypeClassification {
  const scores = computeScores(evidence, ontology);

  for (const rule of DECISIVE_RULES) {
    if (rule.matches(evidence)) {
      return { id: rule.archetype, confidence: rule.confidence, scores };
    }
  }

  const entries = Object.entries(scores) as [ArchetypeId, number][];
  entries.sort((a, b) => b[1] - a[1]);
  const [topId, top] = entries[0] ?? ["production_saas" as ArchetypeId, 0];
  const second = entries[1]?.[1] ?? 0;
  const confidence = top <= 0 ? 0 : Math.min(1, (top - second) / Math.max(top, 1) + 0.4);
  return { id: topId, confidence: round(confidence), scores };
}

function computeScores(evidence: EvidenceMap, ontology: Ontology): Record<ArchetypeId, number> {
  const scores = {} as Record<ArchetypeId, number>;
  for (const def of ontology.listArchetypes()) {
    scores[def.id] = scoreArchetype(def, evidence);
  }
  return scores;
}

function scoreArchetype(def: ArchetypeDef, evidence: EvidenceMap): number {
  let s = 0;
  const sig = def.classification_signals;
  if (sig.required_any && sig.required_any.some((k) => evidence.signals[k])) s += 2;
  for (const k of sig.positive ?? []) if (evidence.signals[k]) s += 1;
  for (const k of sig.negative ?? []) if (evidence.signals[k]) s -= 2;
  return s;
}

function round(n: number): number { return Math.round(n * 100) / 100; }
