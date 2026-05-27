import { readFileSync, readdirSync, statSync, existsSync } from "node:fs";
import { join, relative } from "node:path";
import type { EvidenceMap } from "../types.js";

const IGNORE = new Set([
  "node_modules", ".git", "dist", "build", ".next", ".yarn", "coverage",
  ".venv", "__pycache__", ".turbo", ".cache", "Pods",
  // .claude/worktrees/ holds parallel agent worktrees — exact repo
  // copies that would otherwise be counted N times for every signal.
  ".claude",
  // Conventional vendor / cache / output dirs across ecosystems
  "vendor", "target", ".gradle", "DerivedData", ".idea", ".vscode",
]);
const MAX_FILES = 5000;

interface MutableEvidence extends EvidenceMap {
  files: EvidenceMap["files"] & {
    notebooks: string[];
    k8sManifests: string[];
    helmCharts: string[];
    contentDirs: string[];
    examplesDirs: string[];
  };
}

export function readRepo(root: string): EvidenceMap {
  const evidence: MutableEvidence = {
    files: {
      iacRoots: [], ciWorkflows: [], runbookFiles: [],
      notebooks: [], k8sManifests: [], helmCharts: [], contentDirs: [], examplesDirs: [],
    },
    signals: {},
    metrics: {},
    notes: [],
  };

  const all = walk(root, MAX_FILES);
  evidence.metrics.fileCount = all.length;

  const dirs = new Set<string>();

  for (const abs of all) {
    const rel = relative(root, abs);
    const lower = rel.toLowerCase();
    const parts = rel.split("/");
    if (parts.length > 1) dirs.add(parts[0]!);

    if (!evidence.files.readme && /^readme\.(md|mdx)$/i.test(rel)) {
      const content = safeRead(abs);
      evidence.files.readme = { path: rel, content, lines: content.split(/\r?\n/) };
    }
    if (!evidence.files.packageJson && rel === "package.json") {
      try {
        evidence.files.packageJson = { path: rel, content: JSON.parse(safeRead(abs)) };
      } catch {/* ignore */}
    }
    if (!evidence.files.pyprojectToml && rel === "pyproject.toml") {
      evidence.files.pyprojectToml = { path: rel };
    }
    if (!evidence.files.dockerfile && /(^|\/)dockerfile$/i.test(rel)) {
      evidence.files.dockerfile = rel;
    }
    if (!evidence.files.composeFile && /(^|\/)docker-compose\.ya?ml$/i.test(rel)) {
      evidence.files.composeFile = rel;
    }
    if (/(^|\/)\.github\/workflows\/.+\.ya?ml$/i.test(rel)) {
      evidence.files.ciWorkflows.push(rel);
    }
    // IaC files only count at repo root OR under canonical infra paths,
    // AND not nested inside tests/fixtures/examples/samples (avoids
    // sharkdp/bat-style syntax-highlight test fixtures).
    {
      const iacFileRe = /(cdk\.json|main\.tf|terragrunt\.hcl|chart\.ya?ml|kustomization\.ya?ml|pulumi\.ya?ml)$/i;
      const isTestFixture = /(^|\/)(tests?|fixtures?|examples?|samples?|spec|specs|__tests__|highlighted|source)\//i.test(rel);
      const isRoot = iacFileRe.test(rel) && !rel.includes("/");
      const isCanonicalInfra = /(^|\/)(infra|infrastructure|deploy|deployment|terraform|cdk|pulumi|helm|charts?|k8s|kubernetes|argocd)(\/.*)?\//i.test(rel) && iacFileRe.test(rel);
      if ((isRoot || isCanonicalInfra) && !isTestFixture) evidence.files.iacRoots.push(rel);
    }
    if (/(^|\/)docs\/adr\//i.test(lower) || /(^|\/)adrs?\//i.test(lower)) {
      evidence.files.adrDir = evidence.files.adrDir ?? dirOf(rel);
    }
    if (/(^|\/)(runbook|playbook|on[-_]?call)\.md$/i.test(lower)) {
      evidence.files.runbookFiles.push(rel);
    }
    if (!evidence.files.aiUsageDoc && /(^|\/)ai[-_]?usage\.md$/i.test(lower)) {
      evidence.files.aiUsageDoc = rel;
    }
    if (/\.ipynb$/i.test(rel)) evidence.files.notebooks.push(rel);
    // Helm Chart.yaml only counts when in a canonical helm location
    // (root, or under charts/, helm/, deploy/). Otherwise it's likely a
    // test fixture or syntax-highlight asset and shouldn't trigger
    // devops_infra classification.
    if ((/^chart\.ya?ml$/i.test(rel) || /(^|\/)(charts?|helm|deploy)\/[^/]+\/chart\.ya?ml$/i.test(rel)) &&
        !/(^|\/)(tests?|fixtures?|examples?|samples?|spec|specs|__tests__|highlighted|source)\//i.test(rel)) {
      evidence.files.helmCharts.push(rel);
    }
    if (/(^|\/)k(8|ubernetes)s?\//i.test(rel) && /\.ya?ml$/i.test(rel)) evidence.files.k8sManifests.push(rel);
    if (/(^|\/)(content|posts|blog)\//i.test(rel) && /\.(mdx?|markdown)$/i.test(rel)) evidence.files.contentDirs.push(rel);
    if (/(^|\/)examples?\//i.test(rel)) evidence.files.examplesDirs.push(rel);
  }

  const pkg = evidence.files.packageJson?.content as Record<string, unknown> | undefined;

  // basic signals
  // Marker-file backstops: walker may cap at MAX_FILES on huge repos before
  // reaching root markers. existsSync probes guarantee root-level signals.
  if (!evidence.files.dockerfile) {
    for (const name of ["Dockerfile", "Dockerfile.prod", "Dockerfile.production"]) {
      if (existsSync(join(root, name))) { evidence.files.dockerfile = name; break; }
    }
  }
  if (!evidence.files.composeFile) {
    for (const name of ["docker-compose.yml", "docker-compose.yaml", "compose.yml", "compose.yaml"]) {
      if (existsSync(join(root, name))) { evidence.files.composeFile = name; break; }
    }
  }
  if (evidence.files.ciWorkflows.length === 0 && existsSync(join(root, ".github", "workflows"))) {
    try {
      for (const f of readdirSync(join(root, ".github", "workflows"))) {
        if (f.endsWith(".yml") || f.endsWith(".yaml")) {
          evidence.files.ciWorkflows.push(`.github/workflows/${f}`);
        }
      }
    } catch {/* ignore */}
  }
  if (evidence.files.iacRoots.length === 0) {
    for (const name of ["cdk.json", "main.tf", "Pulumi.yaml", "Chart.yaml", "kustomization.yaml"]) {
      if (existsSync(join(root, name))) evidence.files.iacRoots.push(name);
    }
  }
  evidence.signals.has_rfc_docs =
    existsSync(join(root, "docs", "rfcs")) ||
    existsSync(join(root, "docs", "proposals")) ||
    existsSync(join(root, "rfcs")) ||
    existsSync(join(root, "RFCS")) ||
    existsSync(join(root, "keps")) ||           // Kubernetes Enhancement Proposals
    existsSync(join(root, "kips")) ||           // Kafka Improvement Proposals
    existsSync(join(root, "enhancements")) ||   // common K8s ecosystem
    existsSync(join(root, "design")) ||
    existsSync(join(root, "docs", "design")) ||
    existsSync(join(root, "docs", "decisions"));
  evidence.signals.has_governance =
    existsSync(join(root, "GOVERNANCE.md")) ||
    existsSync(join(root, "MAINTAINERS.md")) ||
    existsSync(join(root, "MAINTAINERS")) ||
    existsSync(join(root, "OWNERS"));
  evidence.signals.has_codeowners =
    existsSync(join(root, "CODEOWNERS")) ||
    existsSync(join(root, ".github", "CODEOWNERS")) ||
    existsSync(join(root, "docs", "CODEOWNERS"));
  evidence.signals.has_security_policy =
    existsSync(join(root, "SECURITY.md")) ||
    existsSync(join(root, ".github", "SECURITY.md"));

  evidence.signals.has_readme = !!evidence.files.readme;
  evidence.signals.has_dockerfile = !!evidence.files.dockerfile;
  evidence.signals.has_compose = !!evidence.files.composeFile;
  evidence.signals.has_iac = evidence.files.iacRoots.length > 0;
  evidence.signals.has_deployment_workflow = evidence.files.ciWorkflows.some((p) => /deploy|release|cd/i.test(p));
  evidence.signals.has_ci = evidence.files.ciWorkflows.length > 0;
  evidence.signals.has_adrs = !!evidence.files.adrDir;
  evidence.signals.has_runbook = evidence.files.runbookFiles.length > 0;
  evidence.signals.has_ai_usage_doc = !!evidence.files.aiUsageDoc;
  evidence.signals.has_env_example = existsSync(join(root, ".env.example")) || existsSync(join(root, ".env.sample"));
  evidence.signals.has_license = existsSync(join(root, "LICENSE")) || existsSync(join(root, "LICENSE.md"));
  evidence.signals.has_changelog = existsSync(join(root, "CHANGELOG.md")) || existsSync(join(root, "CHANGELOG"));
  evidence.signals.has_agents_md = existsSync(join(root, "AGENTS.md"));
  evidence.signals.has_makefile = existsSync(join(root, "Makefile"));

  // notebooks / ML
  evidence.signals.has_notebooks = evidence.files.notebooks.length > 0;
  evidence.signals.notebook_heavy = evidence.files.notebooks.length > 3;
  evidence.signals.has_data_dir = existsSync(join(root, "data"));
  evidence.signals.has_experiments_dir = existsSync(join(root, "experiments"));
  evidence.signals.has_models_dir = existsSync(join(root, "models"));
  evidence.signals.has_requirements_with_ml_deps = hasMlDeps(root);

  // k8s / helm / argocd
  evidence.signals.has_k8s_manifests = evidence.files.k8sManifests.length > 0;
  evidence.signals.has_helm_chart = evidence.files.helmCharts.length > 0;
  evidence.signals.has_argocd_apps = existsSync(join(root, "argocd")) || existsSync(join(root, "apps"));
  evidence.signals.has_monitoring_config =
    evidence.files.ciWorkflows.some((p) => /(grafana|datadog|prometheus|sentry|otel)/i.test(p)) ||
    Object.keys(pkg ?? {}).some((k) => /(sentry|datadog|opentelemetry)/i.test(k));

  // mobile depends on `deps` which we compute here once, then reuse below
  const deps: Record<string, unknown> = pkg
    ? { ...((pkg as { dependencies?: object }).dependencies ?? {}), ...((pkg as { devDependencies?: object }).devDependencies ?? {}) }
    : {};

  // library / cli
  evidence.signals.has_package_publish_config =
    !!(pkg && (pkg.main || pkg.exports || pkg.module) && pkg.name && !(pkg as Record<string, unknown>).private);
  evidence.signals.has_pyproject_publish = !!evidence.files.pyprojectToml;
  evidence.signals.has_bin_field = !!(pkg && pkg.bin);
  evidence.signals.has_cargo_bin = (() => {
    const cargo = join(root, "Cargo.toml");
    if (!existsSync(cargo)) return false;
    const c = safeRead(cargo);
    // Explicit [[bin]] block, or any default-location binary
    if (/\[\[bin\]\]/.test(c)) return true;
    if (existsSync(join(root, "src", "main.rs"))) return true;
    if (existsSync(join(root, "src", "bin"))) return true;
    // Cargo workspace whose root crate has no library but has Cargo.lock → likely an app
    if (!/^\[lib\]/m.test(c) && existsSync(join(root, "Cargo.lock"))) return true;
    return false;
  })();
  evidence.signals.has_go_main = existsSync(join(root, "main.go")) || existsSync(join(root, "cmd"));
  evidence.metrics.cmdSubdirCount = (() => {
    const cmd = join(root, "cmd");
    if (!existsSync(cmd)) return 0;
    try { return readdirSync(cmd).filter((f) => existsSync(join(cmd, f, "main.go")) || existsSync(join(cmd, f))).length; }
    catch { return 0; }
  })();
  evidence.signals.has_console_scripts = false; // pyproject parse not in scope
  evidence.signals.has_examples_dir = evidence.files.examplesDirs.length > 0;
  evidence.signals.has_api_docs = existsSync(join(root, "docs")) || existsSync(join(root, "api"));
  evidence.signals.has_man_page = existsSync(join(root, "man"));

  // monorepo
  evidence.signals.has_workspaces_field = !!(pkg && (pkg as { workspaces?: unknown }).workspaces);
  evidence.signals.has_nx_json = existsSync(join(root, "nx.json"));
  evidence.signals.has_turbo_json = existsSync(join(root, "turbo.json"));
  evidence.signals.has_pnpm_workspace = existsSync(join(root, "pnpm-workspace.yaml"));
  evidence.signals.has_multi_package_src = existsSync(join(root, "packages")) || existsSync(join(root, "apps"));

  // mobile — require native-project structure, not just peer-dep mentions
  evidence.signals.has_ios_dir =
    existsSync(join(root, "ios")) &&
    (existsSync(join(root, "ios", "Podfile")) ||
     existsSync(join(root, "ios", "AppDelegate.swift")) ||
     hasSubpathMatching(root, "ios", /\.xcodeproj$/));
  evidence.signals.has_android_dir =
    existsSync(join(root, "android")) &&
    (existsSync(join(root, "android", "build.gradle")) ||
     existsSync(join(root, "android", "settings.gradle")) ||
     existsSync(join(root, "android", "app", "build.gradle")));
  evidence.signals.has_react_native = "react-native" in deps;
  evidence.signals.has_flutter_pubspec = existsSync(join(root, "pubspec.yaml")) && existsSync(join(root, "lib"));
  evidence.signals.has_expo_config = "expo" in deps;
  // Root-level native apps: the whole repo IS the app, no ios/ or android/ wrapper.
  const hasGradlew = existsSync(join(root, "gradlew"));
  const hasRootGradleSettings =
    existsSync(join(root, "settings.gradle")) ||
    existsSync(join(root, "settings.gradle.kts"));
  evidence.signals.has_root_android_app =
    existsSync(join(root, "AndroidManifest.xml")) ||
    existsSync(join(root, "app", "src", "main", "AndroidManifest.xml")) ||
    (existsSync(join(root, "build.gradle")) && existsSync(join(root, "app", "build.gradle"))) ||
    (existsSync(join(root, "build.gradle.kts")) && existsSync(join(root, "app", "build.gradle.kts"))) ||
    // Broader: gradlew + Gradle settings + no JS package — assume Android (Kotlin/Java apps)
    (hasGradlew && hasRootGradleSettings && !evidence.files.packageJson && !existsSync(join(root, "pom.xml")));
  evidence.signals.has_root_ios_app =
    (existsSync(join(root, "Podfile")) && !evidence.files.packageJson) ||
    existsSync(join(root, "Package.swift")) && hasSubpathMatching(root, ".", /\.xcodeproj$/) ||
    hasSubpathMatching(root, ".", /\.xcodeproj$/) && existsSync(join(root, "Info.plist"));
  // Xamarin / .NET MAUI mobile: root .sln + iOS or Android C# projects
  evidence.signals.has_xamarin_mobile = (() => {
    if (!hasSubpathMatching(root, ".", /\.sln$/)) return false;
    const srcDir = join(root, "src");
    if (!existsSync(srcDir)) return false;
    try {
      const subdirs = readdirSync(srcDir);
      return subdirs.some((d) => /^(iOS|Android|App|Mobile|MAUI)([.-]|$)/i.test(d));
    } catch { return false; }
  })();
  evidence.signals.has_screenshots_dir = existsSync(join(root, "screenshots")) || existsSync(join(root, "assets/screenshots"));
  evidence.signals.has_app_store_link = !!(evidence.files.readme && /apps\.apple\.com|play\.google\.com/i.test(evidence.files.readme.content));

  // static site / docs — root-level configs
  const rootSiteConfig =
    existsSync(join(root, "next.config.js")) || existsSync(join(root, "next.config.mjs")) || existsSync(join(root, "next.config.ts")) ||
    existsSync(join(root, "astro.config.mjs")) || existsSync(join(root, "astro.config.js")) || existsSync(join(root, "astro.config.ts")) ||
    existsSync(join(root, "gatsby-config.js")) || existsSync(join(root, "gatsby-config.ts")) ||
    existsSync(join(root, "_config.yml")) || existsSync(join(root, "hugo.toml")) || existsSync(join(root, "hugo.yaml")) ||
    existsSync(join(root, ".eleventy.js")) || existsSync(join(root, "eleventy.config.js"));
  const rootDocsConfig =
    existsSync(join(root, "mkdocs.yml")) ||
    existsSync(join(root, "docusaurus.config.js")) || existsSync(join(root, "docusaurus.config.ts")) ||
    existsSync(join(root, "vitepress.config.ts")) || existsSync(join(root, "vitepress.config.js")) ||
    existsSync(join(root, ".vitepress", "config.ts")) || existsSync(join(root, ".vitepress", "config.js"));
  evidence.signals.has_static_site_config = rootSiteConfig;
  evidence.signals.has_docs_site_config = rootDocsConfig;
  // Workspace-nested site config: for monorepos whose primary purpose is a content site
  // (e.g. withastro/docs, tailwindcss.com if structured as workspaces).
  evidence.signals.has_workspace_site_config = (() => {
    for (const sub of ["packages", "apps", "site", "docs", "www"]) {
      const dir = join(root, sub);
      if (!existsSync(dir)) continue;
      try {
        for (const pkgName of readdirSync(dir)) {
          const pkgDir = join(dir, pkgName);
          for (const conf of ["astro.config.mjs", "astro.config.js", "astro.config.ts",
                              "next.config.js", "next.config.mjs", "next.config.ts",
                              "gatsby-config.js", "docusaurus.config.js", "vitepress.config.ts",
                              "_config.yml", "hugo.toml", "mkdocs.yml"]) {
            if (existsSync(join(pkgDir, conf))) return true;
          }
        }
      } catch {/* ignore */}
    }
    return false;
  })();
  evidence.signals.has_content_dir =
    evidence.files.contentDirs.length > 0 ||
    existsSync(join(root, "content")) ||
    existsSync(join(root, "src", "content")) ||
    existsSync(join(root, "src", "pages")) ||
    existsSync(join(root, "src", "posts")) ||
    existsSync(join(root, "_posts"));

  // internal-tool heuristic: small src footprint across common languages
  const srcCount = all.filter((p) =>
    /\.(ts|tsx|js|jsx|mjs|cjs|py|go|rs|rb|php|java|scala|kt|kts|c|cc|cpp|cs|ex|exs|swift)$/.test(p) &&
    !/(\.|\/)(test|spec)\./.test(p)
  ).length;
  evidence.signals.has_single_script_entry =
    srcCount > 0 && srcCount <= 5 &&
    !evidence.signals.has_workspaces_field &&
    !evidence.signals.has_compose &&
    !evidence.signals.has_iac;
  evidence.signals.notebook_heavy = evidence.files.notebooks.length > 5;

  evidence.signals.has_tests =
    existsSync(join(root, "tests")) ||
    existsSync(join(root, "test")) ||
    existsSync(join(root, "__tests__")) ||
    all.some((p) => /\.(test|spec)\.[tj]sx?$/.test(p));

  if (evidence.files.readme) {
    const c = evidence.files.readme.content;
    evidence.metrics.readmeLines = evidence.files.readme.lines.length;
    evidence.metrics.readmeWords = c.split(/\s+/).filter(Boolean).length;
    evidence.signals.has_live_url_in_readme = /https?:\/\/(?!github\.com|gitlab\.com|bitbucket\.)/i.test(c);
    evidence.signals.has_architecture_diagram =
      /!\[[^\]]*architect/i.test(c) || /```mermaid/i.test(c) || /architecture\.(png|svg|jpg)/i.test(c);
    evidence.signals.no_usage_block = !/\b(usage|example)\b[\s\S]{0,200}```/i.test(c);
    evidence.signals.no_changelog = !evidence.signals.has_changelog;
    evidence.signals.no_screenshots = !/!\[[^\]]*\]\([^)]+\.(png|jpg|jpeg|gif)\)/i.test(c) && !evidence.signals.has_screenshots_dir;
    evidence.signals.no_demo_media = !/asciinema|\.gif|\.cast/i.test(c);
    evidence.signals.no_runbook = !evidence.signals.has_runbook;
    evidence.signals.no_architecture_diagram = !evidence.signals.has_architecture_diagram;
  } else {
    evidence.signals.no_usage_block = true;
    evidence.signals.no_changelog = true;
    evidence.signals.no_screenshots = true;
    evidence.signals.no_demo_media = true;
    evidence.signals.no_runbook = true;
    evidence.signals.no_architecture_diagram = true;
  }

  evidence.metrics.topLevelDirCount = dirs.size;

  return evidence;
}

function walk(root: string, max: number): string[] {
  const out: string[] = [];
  const stack: string[] = [root];
  while (stack.length && out.length < max) {
    const cur = stack.pop()!;
    let entries: string[] = [];
    try { entries = readdirSync(cur); } catch { continue; }
    for (const name of entries) {
      if (IGNORE.has(name)) continue;
      const abs = join(cur, name);
      let st;
      try { st = statSync(abs); } catch { continue; }
      if (st.isDirectory()) stack.push(abs);
      else out.push(abs);
      if (out.length >= max) break;
    }
  }
  return out;
}

function safeRead(p: string): string {
  try { return readFileSync(p, "utf8"); } catch { return ""; }
}

function dirOf(rel: string): string {
  const i = rel.lastIndexOf("/");
  return i >= 0 ? rel.slice(0, i) : rel;
}

function hasSubpathMatching(root: string, sub: string, pattern: RegExp): boolean {
  const dir = join(root, sub);
  if (!existsSync(dir)) return false;
  try { return readdirSync(dir).some((f) => pattern.test(f)); } catch { return false; }
}

function hasMlDeps(root: string): boolean {
  const req = join(root, "requirements.txt");
  if (!existsSync(req)) return false;
  const c = safeRead(req).toLowerCase();
  return /\b(torch|tensorflow|jax|scikit-learn|transformers|numpy|pandas|xgboost|lightgbm)\b/.test(c);
}
