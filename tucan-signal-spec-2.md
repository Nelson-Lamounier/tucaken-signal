# Tucaken Signal — Portfolio Trust-Signal Tool for Engineering Work

**Date:** 2026-05-25
**Status:** Design draft v2.0, supersedes the earlier Tucaken Skill draft
**Scope:** v1.0 of a standalone IDE/CLI tool that diagnoses the trust-signal quality of an engineer's repository for hiring contexts in 2026, and generates evidence-grounded improvements. Free product, distributed independently of Tucaken's resume platform. Integrates with Claude Code, Cursor, Kiro, Codex CLI, and any environment that can invoke a CLI. Optional MCP server for authenticated Tucaken account integration.

## Problem

The 2026 tech hiring market runs on broken signal. Three forces converged in 2024-2025 and are now defining how engineers get hired:

1. **The resume is collapsing as a credibility indicator.** Only 37% of employers in 2026 view credentials and learning history among the most reliable indicators of talent. 41% are actively moving away from resume-first hiring; 10% have largely replaced resumes with skills-based assessments.

2. **AI-generated content has destroyed signal trust.** 77% of hiring teams regularly encounter AI-generated or AI-assisted applications. 47% have updated interview techniques to focus on deeper probing. 14% have implemented AI detection tools. Recruiters can no longer distinguish polished-AI from polished-real, so they default to skepticism.

3. **The fallback signal — public engineering work on GitHub — is also broken for most engineers.** Tutorial-shaped portfolios, undocumented decisions, invisible production work, and no transparent signal of how AI was actually used. The depth is in the code; the depth is not visible to anyone who looks at the code.

Recruiters spend approximately 55 seconds on a portfolio. They are not reading code — GitHub shows them that. They are trying to answer three questions in 55 seconds: *can this person reason about systems, communicate trade-offs, and produce work I can trust?* Most repositories answer none of those questions, even when the underlying engineering work would.

This problem affects engineers at every career stage, but in different ways:

- **Juniors** face a 73% drop in entry-level postings and need to prove they can ship real systems with judgment (not tutorials), demonstrate transparent AI usage (not avoidance), and provide deployment evidence beyond local-only code.
- **Mid-level engineers** need to show production deployment, trade-off reasoning, debugging journeys, and architectural choices made under real constraints.
- **Senior engineers** face FAANG-style interview shifts where system design over coding dominates, where cross-functional translation is the moat AI cannot cross, and where production artifacts (RFCs, postmortems, runbooks, ADRs) carry more weight than code volume.

Existing tools in this space optimize for *agent-readiness* — making repositories easy for AI agents to navigate, build, and contribute to. Tools like Factory.ai Agent Readiness, OpenHands readiness-report, and viktor-silakov/ai-ready do this well. But agent-readiness is a fundamentally different question from portfolio-readiness for hiring. A repository at agent-readiness L4 can still completely undersell the engineer to a human recruiter.

**Tucaken Signal is the trust-signal layer for engineering work.** It reads what's actually in the repository, surfaces what's invisible to a 55-second reader, helps engineers document the parts that AI cannot fake, and outputs evidence-grounded recommendations calibrated to the engineer's career stage. The skill does not generate fake polish; it makes real depth visible.

## Thesis (v1.0 success criteria)

> Engineers running Tucaken Signal on a real repository receive analysis that (a) correctly identifies the repository's archetype and the engineer's apparent career stage, (b) produces a portfolio trust-signal score with sub-scores across five pillars, (c) generates 5–15 actionable suggestions grounded in evidence from the repo's own code and history, calibrated to the user's target career stage, and (d) provides accept-ready draft content for the top suggestions. The recommended changes, if applied, would make depth visible within a 55-second recruiter scan.

Measured by:

- **Classification accuracy:** ≥90% archetype identification and ≥80% career-stage identification on a hand-validated set of 50 reference repositories.
- **Suggestion grounding rate:** ≥95% of generated suggestions reference specific files, code patterns, or repository evidence. No generic "all good repos have X" recommendations.
- **55-second readability lift:** post-application, the proportion of the engineer's evidenced depth visible above the README fold increases measurably (target: ≥50% lift on the readability submetric for repos starting below 60/100).
- **Acceptance rate** (opt-in telemetry): ≥40% of generated draft content is accepted or accepted-with-edits within 7 days. Long-term north-star metric.

## The Five Pillars

Tucaken Signal's analysis is structured around five pillars that each map to a real 2026 hiring pressure. Every analyzer, recommendation, and score component traces back to one of these pillars.

### Pillar 1: Authenticity

**The market pressure:** AI-generated content has eroded trust. Recruiters increasingly cannot distinguish AI-polished from human-engineered work, and they default to skepticism.

**What Tucaken Signal does:**
- Detects AI-assistance patterns in code without making accusations: boilerplate density, idiomatic-but-uniform code, AI-style commenting patterns, commit message homogeneity
- Recommends transparent AI-usage documentation (an `AI_USAGE.md` or README section): which parts used AI assistance, which decisions the engineer overrode AI on, which sections were manually verified
- Identifies and surfaces human-only fingerprints: places where engineering judgment is clearly visible (decision documentation, opinionated comments, evolution across commits)
- Highlights evidence trails AI cannot fake at scale: commit history depth, incremental refactors over time, debugging journeys, retroactive renaming patterns

**The framing matters:** the skill never accuses. It observes and recommends. AI usage is not a negative — *undisclosed* AI usage is a credibility risk in 2026. Tucaken Signal helps engineers turn AI-assistance into a transparent strength rather than a hidden liability.

### Pillar 2: 55-Second Readability

**The market pressure:** Recruiters spend 55 seconds on portfolios. Depth invisible in that window does not exist for hiring purposes.

**What Tucaken Signal does:**
- Measures "above-the-fold density": what does the first paragraph and first three section headers of the README communicate?
- Audits the visibility of the hero artifacts: one-line pitch, status (deployed/active/archived), tech stack at a glance, demo link, primary architecture diagram
- Scores the proportion of the engineer's evidenced depth that surfaces in the first 30 seconds, first 2 minutes, and deep-dive scan
- Produces a literal "what a recruiter sees" preview mode (see CLI section below)

This pillar drives a specific category of quick-win recommendations: changes that take minutes but materially lift recruiter readability.

### Pillar 3: System Thinking Made Visible

**The market pressure:** FAANG and FAANG-adjacent hiring increasingly tests system design and architectural reasoning over coding skill. The signal recruiters most want is "can this person reason about systems."

**What Tucaken Signal does:**
- Detects architectural decisions visible in code but undocumented (CDK over Terraform, EKS over ECS, a chosen database vs. obvious alternatives, message broker selection, etc.) and recommends ADR-style documentation
- Auto-generates proposed system architecture diagrams when missing, derived from IaC files, service topology, and component structure
- Identifies "anticipated interview questions" the repo doesn't answer: what would a system design interviewer ask about this codebase, and what would the engineer want documented before that question lands?
- Surfaces trade-off articulation prompts for each major technology choice detected

ADRs and visible architectural reasoning are the single highest-leverage portfolio improvements for mid-to-senior engineers. This pillar is where most of that lift gets generated.

### Pillar 4: Production Reality

**The market pressure:** The portfolio-killer signal for juniors is "this looks like a tutorial." For mid/senior engineers, it's "this never ran in production." Hiring managers want evidence of work under real constraints, not learning exercises.

**What Tucaken Signal does:**
- Detects production-readiness signals: live deployment URL, monitoring configuration, error handling depth, retry logic, observability instrumentation, secrets management, multi-environment setup
- Flags tutorial-shaped signals: heavy reliance on common starter templates, absence of authentication where expected, single-environment configuration, no error states, no tests, no maintenance commits over time
- Recommends specific production-signal additions calibrated to what's already there: "your code shows X (tutorial-level signal); to reach production-readiness signal, consider Y"
- Surfaces maintenance evidence: sustained commit history is a hireable signal that the skill can render visible in the README

### Pillar 5: Career-Stage Calibration

**The market pressure:** Same repository, evaluated for junior vs. senior roles, requires different signal emphasis. Static recommendations miss this.

**What Tucaken Signal does:**
- Accepts an explicit `--stage` flag: junior | mid | senior | staff (or auto-inferred from repo signals)
- Routes recommendations through stage-specific templates:
  - **Junior:** ship-evidence, AI transparency, system thinking even at small scale, learning-trajectory documentation, communication artifacts (blog posts, README quality)
  - **Mid:** production deployment, trade-off documentation, debugging journeys, code review quality, testing maturity
  - **Senior:** ADRs, postmortems, cross-functional artifacts (RFCs, design docs), incident response, mentorship signals
  - **Staff+:** organizational impact, multi-system reasoning, technical writing visibility, community presence linked from README
- Re-runs with a different stage to compare positioning ("how would this repo look for senior roles vs. mid roles?")

No competing tool offers this stage-awareness. It's a primary differentiator.

## Architecture

### High-level flow

```
Repository on disk + (career stage flag or inferred)
   ↓
Analysis Engine (CLI core)
   ├── Repo Classifier        → assigns archetype + infers stage
   ├── Pillar Analyzers       → one set per pillar
   │   ├── Authenticity      → AiUsageAnalyzer, CommitFingerprintAnalyzer
   │   ├── Readability       → ReadmeDensityAnalyzer, AboveFoldAnalyzer
   │   ├── SystemThinking    → ArchitectureAnalyzer, DecisionDetector
   │   ├── ProductionReality → DeploymentAnalyzer, TutorialSignalAnalyzer
   │   └── StageCalibration  → cross-cutting, modulates other outputs
   └── Evidence Collector     → builds the structured evidence map
   ↓
Suggestion Generator
   ├── Cross-references evidence against pillar requirements
   ├── Filters by evidence support (no unsupported recommendations)
   ├── Calibrates to career stage
   └── Ranks by pillar weight × impact × effort
   ↓
Output Renderer (terminal | markdown | json | interactive | recruiter-preview)
   ↓
IDE Adapter (optional, native UI when invoked via /signal in Claude Code/Cursor/etc.)
   ↓
MCP Server (optional, for Tucaken-authenticated users)
```

The CLI is the durable product. IDE adapters are thin entry points. The MCP server is an optional layer that provides live Tucaken account state to authenticated users — projects already in their Tucaken account, prior recommendations, ontology version, technology evidence from previous extractions.

### Privacy and data handling — load-bearing constraint

Tucaken Signal is *local-first*. By default, no repository content, file paths, or metadata leaves the user's machine.

Three explicit modes, in order of permissiveness:

- **Offline mode (default):** entire analysis runs locally. No network calls. LLM-assisted draft generation either uses the host IDE's LLM session (when invoked as an IDE skill) or is skipped (when run as a pure CLI without `--llm` flag). The analysis itself never requires LLM calls — only optional draft generation does.
- **BYOK mode:** user provides an Anthropic API key. Draft generation calls Anthropic's API directly from the user's machine. Tucaken is not in the network path.
- **Tucaken-authenticated mode:** user is signed into Tucaken. Optionally syncs findings to their Tucaken account; optionally pulls account state via the MCP server. Even here, raw code is never sent — only structured findings, file paths, and snippet excerpts ≤200 chars.

Opt-in telemetry collects anonymous usage events (no paths, no content): `{cli_version, ontology_version, archetype_detected, stage, suggestion_count, command_used}`. Default: opt-out.

### Package layout

```
tucaken-signal/                           # The CLI repo, @tucaken/signal on npm
  package.json
  bin/
    tucaken-signal                        # CLI entrypoint
  src/
    cli/
      index.ts
      commands/
        analyze.ts                        # `tucaken-signal analyze [path]`
        draft.ts                          # `tucaken-signal draft <suggestion-id>`
        apply.ts                          # `tucaken-signal apply <suggestion-id>`
        preview.ts                        # `tucaken-signal preview` (recruiter-view mode)
        config.ts
        ontology.ts
    analyzers/
      RepoClassifier.ts                   # archetype + career-stage inference
      authenticity/
        AiUsageAnalyzer.ts                # AI-fingerprint detection
        CommitFingerprintAnalyzer.ts      # commit-history human-trail signals
        HumanJudgmentDetector.ts          # surfaces opinionated decisions in code
      readability/
        ReadmeDensityAnalyzer.ts          # section structure, content density
        AboveFoldAnalyzer.ts              # what's visible in first 30 seconds
        ScanTimingEstimator.ts            # estimates 30s/2min/deep-dive coverage
      system_thinking/
        ArchitectureAnalyzer.ts           # detects architecture, suggests diagrams
        DecisionDetector.ts               # finds undocumented architectural choices
        AnticipatedQuestionGenerator.ts   # what would system-design interviewer ask
      production_reality/
        DeploymentAnalyzer.ts             # live deployment, monitoring, IaC
        TutorialSignalAnalyzer.ts         # detects tutorial-shaped patterns
        MaintenanceSignalAnalyzer.ts      # sustained activity over time
      stage_calibration/
        StageInferenceEngine.ts           # infers career stage from repo signals
        StageRouter.ts                    # routes recommendations through stage filters
      shared/
        DocumentationAnalyzer.ts          # /docs, ADRs, runbooks
        StructureAnalyzer.ts              # folder layout
        TestingAnalyzer.ts
        DependencyAnalyzer.ts             # reuses Tucaken's tech-extractor logic
        LicensingAnalyzer.ts
        AgentsmdDetector.ts               # detect AGENTS.md as a positive signal
    evidence/
      EvidenceCollector.ts
      EvidenceMap.ts
    ontology/
      archetypes/                         # archetype definitions
      stages/                             # career-stage expectations per archetype
      sections/                           # README section definitions
      artifacts/                          # expected file/folder patterns
      pillars/                            # pillar weight maps per stage
      OntologyLoader.ts
    suggestions/
      SuggestionGenerator.ts
      SuggestionRanker.ts                 # pillar-weighted ranking
      DraftGenerator.ts
      DraftTemplates/
    scoring/
      TrustSignalScore.ts                 # overall score
      PillarScores.ts                     # per-pillar sub-scores
      ReadabilitySubscores.ts             # 30s / 2min / deep-dive
    output/
      TerminalRenderer.ts
      MarkdownRenderer.ts
      JsonRenderer.ts
      InteractiveRenderer.ts
      RecruiterPreviewRenderer.ts         # NEW — see "Recruiter Preview Mode"
    llm/
      LlmClient.ts
      AnthropicClient.ts                  # BYOK
      IdeBridgeClient.ts                  # for IDE adapters
      TucakenApiClient.ts                 # subscriber path
    sync/
      TucakenSyncClient.ts                # opt-in account sync
    mcp/                                  # NEW — optional MCP server companion
      TucakenMcpServer.ts                 # exposes Tucaken account state
      tools/                              # individual MCP tools

tucaken-signal-claude-skill/              # Claude Code skill adapter
  SKILL.md
  scripts/invoke.sh
  templates/skill-output.md

tucaken-signal-cursor/                    # Cursor extension
  package.json
  src/extension.ts

tucaken-ontology/                         # NEW — separately versioned ontology repo
  archetypes/
  stages/
  pillars/
  CHANGELOG.md
  LICENSE                                 # MIT
```

### Tooling

- **Tree-sitter via web-tree-sitter (wasm)** — code structure analysis, AI-fingerprint pattern detection at the syntax level.
- **`simple-git`** — commit history analysis, contributor signal detection.
- **`gray-matter`** — markdown frontmatter parsing.
- **`yaml`** — ontology files, Helm charts, CI configs.
- **Anthropic TypeScript SDK** — when LLM-assisted draft generation is active.
- **`@modelcontextprotocol/sdk`** — for the optional MCP server companion.
- **No native dependencies** in the core CLI — cross-platform install painless.

## Career Stage and Archetype — Two-Dimensional Input

A repository is evaluated against the intersection of two dimensions: its archetype (what kind of project it is) and the engineer's career stage (what they're targeting).

### Archetypes (v1.0)

Nine archetypes cover ~95% of real-world repositories:

1. `production_saas` — deployed multi-component application
2. `open_source_library` — published package with API consumers
3. `internal_tool` — utility/CLI/script for personal or team use
4. `ml_research` — Jupyter-heavy data science/ML repo
5. `devops_infra` — IaC, K8s, CI/CD configuration repos
6. `monorepo` — multi-component workspace, regardless of deployment
7. `cli_tool` — published command-line tool
8. `mobile_app` — iOS/Android/React Native app
9. `static_site` — docs site, blog, marketing page

### Career Stages

Four stages, each with distinct portfolio expectations:

- `junior` — early-career, targeting first or second engineering role
- `mid` — 2-5 years experience, targeting senior-track roles
- `senior` — 5+ years, targeting senior/staff IC or tech-lead positions
- `staff` — staff/principal+, targeting staff/principal/architect roles

Each archetype × stage combination defines a different set of priority recommendations. A `production_saas` repo evaluated for `junior` emphasizes deployment proof and AI transparency; the same repo for `senior` emphasizes ADRs, postmortems, and architectural decision visibility.

### Stage inference

When not specified, the StageInferenceEngine estimates stage from:
- Commit history span and consistency
- Complexity signals (multi-component architecture, IaC depth, production patterns)
- Documentation maturity (ADR presence, runbooks)
- External collaboration evidence (PR reviews, external contributors)
- Code patterns (idiom maturity, error handling depth, testing organization)

Inference is presented to the user with explanation and is overridable: "We inferred your target stage as `mid` based on [signals]. Use `--stage=senior` to evaluate for senior-targeting positioning."

## The Repo-Shape Ontology

The ontology consists of four layers of definition. The core structure from v1 is preserved; the additions are pillar weight maps and career-stage expectations.

### Archetype definitions

Same shape as v1, with these additions:

```yaml
# archetypes/production-saas.yaml
id: production_saas
name: "Production SaaS Application"
description: >
  A deployed software-as-a-service product, typically multi-component,
  with real users and operational concerns.

classification_signals:
  # ...as in v1

expected_sections:
  # ...as in v1

expected_artifacts:
  # ...as in v1

depth_signals:
  # ...as in v1

# NEW: pillar weights for this archetype
pillar_weights:
  authenticity: 0.20
  readability: 0.20
  system_thinking: 0.25
  production_reality: 0.25
  stage_calibration: 0.10   # modulator, not standalone scorer
```

### Career-stage expectations

A new layer that overlays archetype expectations:

```yaml
# stages/junior-production-saas.yaml
stage: junior
archetype: production_saas

priority_sections:
  - hero                          # always priority
  - getting_started               # juniors need to show they can onboard others
  - architecture                  # even small-scale system thinking matters
  - deployment                    # critical signal — moves you past tutorials
  - ai_usage                      # NEW — junior-specific
  - learning_journey              # NEW — junior-specific

priority_artifacts:
  - readme_demo_link
  - production_deployment_evidence

deemphasized_sections:
  - design_decisions              # juniors don't need ADRs yet, mid does

required_pillars:
  - authenticity                  # critical for juniors in AI-era
  - production_reality            # the tutorial vs. real divide

stage_specific_suggestions:
  - id: ai_transparency_section
    title: "Add an AI Usage section to your README"
    description: >
      In 2026, transparent AI usage is more credible than denied AI usage.
      Document which parts you used AI for, what you overrode, what you verified.
    trigger: ai_fingerprints_detected | repo_recent
  - id: deployment_proof
    title: "Make your deployment proof visible in the README"
    description: >
      Live URL + uptime + 'how it's deployed' beats three tutorial-shaped
      projects on a junior resume.
    trigger: has_deployment_evidence AND NOT visible_in_readme
```

```yaml
# stages/senior-production-saas.yaml
stage: senior
archetype: production_saas

priority_sections:
  - architecture
  - design_decisions              # ADRs are critical for senior
  - deployment
  - operational_practices         # NEW — senior-specific
  - postmortems_or_incidents      # NEW — senior-specific

priority_artifacts:
  - adrs                          # mandatory at senior level
  - runbook
  - rfc_documents                 # NEW

required_pillars:
  - system_thinking               # the senior moat
  - production_reality

stage_specific_suggestions:
  - id: adr_backfill
    title: "Document your architectural decisions retroactively"
    description: >
      Your code shows X, Y, Z architectural choices. Senior interviews
      probe the reasoning behind these — make it visible now.
    trigger: significant_architectural_choices_detected AND NOT adr_files_present
  - id: postmortem_invitation
    title: "Surface a debugging or incident story in the README"
    description: >
      Senior engineers are evaluated on how they handle failure modes.
      A clear postmortem or 'lessons learned' section signals operational maturity.
    trigger: has_significant_bug_fix_commits OR has_revert_commits
```

These stage files are the highest-leverage content in the ontology. They're what makes Tucaken Signal's recommendations actually relevant rather than generic.

### Pillar weight maps

Different archetype × stage combinations weight pillars differently. The TrustSignalScore is computed as:

```
overall_score = sum(pillar_score[p] × pillar_weight[archetype][stage][p]) for p in pillars
```

This means the same repo gets a different score for junior vs. senior targeting — appropriately, because the work it does to qualify for those roles is different.

## Analysis Modules

### Authenticity pillar analyzers

**AiUsageAnalyzer.** Detects AI-fingerprint signals without judgment:
- Boilerplate density (code that matches common AI-output patterns)
- Comment uniformity (LLM comments often have a recognizable style)
- Function-naming patterns (LLM-generated names tend toward verbose descriptive forms)
- Test patterns matching AI-output conventions
- Commit message homogeneity (suspiciously consistent style across commits)

Output: a confidence score for "AI assistance likely used here" per file/directory, with recommendation to document it transparently.

**CommitFingerprintAnalyzer.** Identifies human-only signals in commit history:
- Off-hours commits (work-life patterns AI can't fake)
- Iterative refactor patterns (commits showing learning over time)
- Reverts and corrections (humans make mistakes; AI doesn't admit them)
- Commit message variability (real engineers write commit messages differently across moods/contexts)

**HumanJudgmentDetector.** Surfaces opinionated decisions in code:
- Comments explaining "why not X" (AI rarely writes these)
- Idiosyncratic but reasonable variable names
- Sudden style changes that suggest human re-thinking
- TODO/FIXME comments with personality

### Readability pillar analyzers

**ReadmeDensityAnalyzer.** Same as v1's ReadmeAnalyzer with addition of:
- Information density per section (words-per-claim ratio)
- Visual element distribution (diagrams, badges, screenshots)
- Heading hierarchy quality

**AboveFoldAnalyzer.** Specifically inspects what's visible without scrolling:
- First 50 lines of README
- First three section headings
- Hero element presence (pitch, status, demo link, primary tech badge)

**ScanTimingEstimator.** Models recruiter scan behavior:
- 30-second pass: hero, top headings, badges
- 2-minute pass: scrolled README, primary diagram
- Deep-dive: docs/, ADRs, code structure

Outputs sub-scores for each timing tier. The "55-second readability" score combines the 30s and 2-min passes.

### System Thinking pillar analyzers

**ArchitectureAnalyzer.** Same as v1, extended with:
- Detects multi-service patterns from IaC and Docker Compose
- Identifies data-flow patterns from imports + manifest files
- Generates Mermaid diagram drafts when missing

**DecisionDetector.** Finds undocumented architectural choices:
- Database selection (PostgreSQL vs. MongoDB, with code showing actual schemas)
- IaC tool selection (CDK vs. Terraform vs. Pulumi)
- Message broker selection (Redis vs. RabbitMQ vs. Kafka)
- Framework selection where multiple were viable
- Hosting/deployment platform choice

For each: produces an ADR draft proposal: "You chose X over Y. The visible code shows [evidence]. Document the reasoning."

**AnticipatedQuestionGenerator.** New module. Given the detected stack and architecture, generates 3-5 questions a system design interviewer would likely ask, and identifies which ones the repo's documentation does or doesn't answer.

### Production Reality pillar analyzers

**DeploymentAnalyzer.** Detects deployment paths and live signals:
- IaC presence (CDK, Terraform, Helm, etc.)
- Deployment workflow detection (GitHub Actions, GitLab CI, etc.)
- Live URL detection (from README, package.json `homepage`, deployment configs)
- TLS/uptime check (if URL detected, optionally verify it responds)
- Monitoring config (Grafana, Prometheus, Datadog, etc.)

**TutorialSignalAnalyzer.** Identifies patterns that read as tutorial-shaped:
- Heavy use of `create-react-app` / `create-next-app` defaults unchanged
- Absence of customization in common scaffolded files
- Lack of error handling in places where it'd be expected for production
- Single-environment configuration (no dev/staging/prod split)
- Generic project names (`my-app`, `test-project`, `learning-typescript`)
- No tests OR only tutorial-style placeholder tests

**MaintenanceSignalAnalyzer.** Surfaces sustained-activity signals:
- Commit cadence over time (steady vs. burst-then-dormant)
- Dependency update patterns
- Bug-fix and refactor commits as a fraction of total commits
- "Last active" timestamp and how stale it is

## Suggestion Generation

When analyzers complete and the EvidenceMap is built:

1. **Identify primary archetype + career stage** from RepoClassifier + StageInferenceEngine (or user-provided flags)
2. **Load the relevant ontology configurations:** archetype definition, stage-specific expectations, pillar weights
3. **Run pillar-specific gap analysis:**
   - For each pillar, evaluate the repo's score against the stage's threshold
   - Generate pillar-specific suggestions from the stage expectations
4. **Filter by evidence support:** every suggestion must reference real evidence
5. **Rank by `pillar_weight × impact_score / max(effort_score, 0.1)`:** stage-relevant pillars weight higher
6. **Surface top 5-15** in default output; rest available via `--verbose`

### Suggestion shape

```typescript
interface Suggestion {
  id: string;
  pillar: "authenticity" | "readability" | "system_thinking" | "production_reality" | "stage_calibration";
  category: "missing" | "thin" | "enhancement" | "structural" | "stage_specific";
  stage_target: "junior" | "mid" | "senior" | "staff" | "any";
  title: string;
  description: string;
  evidence_basis: EvidenceRef[];
  impact_score: number;
  effort_score: number;
  pillar_weight: number;       // from archetype × stage config
  combined_rank: number;        // pillar_weight × impact / effort
  target_path?: string;
  draft_available: boolean;
}
```

## The "Recruiter Preview" Mode

New first-class output mode (`tucaken-signal preview` or `--mode=preview`). Produces a literal simulation of what a recruiter sees in 55 seconds.

The output is two parts:

**Part 1: The 30-second scan.** What's above the fold of the README, presented exactly as it would render on GitHub. Mock recruiter "first impressions" generated from the actual content: "this engineer appears to work on [X]; the project status is [Y]; the tech stack at a glance is [Z]; I would [keep reading | move on] based on [specific signals]."

**Part 2: The 2-minute scroll.** Sections that would surface in further scrolling, what they communicate, what depth would be visible.

This mode is the most viral feature in the spec. Engineers will screenshot and share these previews. The "what a recruiter sees in 55 seconds of *my* repo" framing is sticky, demonstrably useful, and creates organic distribution. Worth treating as a marketing surface as well as a product feature.

The preview output is also useful for users to recognize gaps the static recommendations can't capture — sometimes a repo's content is fine, but its *ordering* or *prominence* is wrong, and only seeing it from a recruiter's POV reveals that.

## CLI Architecture

### Commands

```
tucaken-signal [path]                         # default = analyze cwd
  --stage=junior|mid|senior|staff             # career-stage target (auto-inferred if not set)
  --archetype=<id>                            # override classifier
  --format=terminal|md|json|preview           # output format (preview = recruiter mode)
  --mode=analyze|preview                      # short form for the most common variant
  --interactive                               # TTY accept/reject mode
  --pillar=<id>                               # focus output on one pillar
  --ontology-version=<v>
  --offline                                   # disable network (default)
  --with-llm                                  # enable LLM draft generation
  --verbose
  --quiet

tucaken-signal preview [path]                 # alias for --format=preview
  --stage=<id>
  --animate                                   # simulate recruiter scan over 55 seconds (terminal)

tucaken-signal draft <suggestion-id>
  --output=<path>
  --apply

tucaken-signal apply <suggestion-id>
  --branch=<name>
  --no-commit

tucaken-signal compare-stages [path]          # NEW — show how same repo scores across stages
  # outputs side-by-side scoring + top suggestions per stage

tucaken-signal config get|set
tucaken-signal ontology list|show|version
tucaken-signal sync                           # opt-in Tucaken account sync
tucaken-signal telemetry opt-in|opt-out
```

### Default terminal output

```
$ tucaken-signal

Analyzing /Users/nelson/code/tucaken... (2.3s)

Archetype:     production_saas (confidence: 0.87)
Inferred stage: mid (use --stage to override)

Trust Signal Score:  ●●●○○  62/100

  Authenticity        ●●●○○  58  (AI transparency missing)
  Readability         ●●○○○  41  (much depth invisible above the fold)
  System Thinking     ●●●●○  78  (architectural choices visible in code)
  Production Reality  ●●●●○  74  (deployed, monitored, real)
  Stage Calibration   ●●●○○  60  (mid-targeted; senior would score lower)

What a recruiter sees in 55 seconds:
  → Mostly: "AI-enabled career platform, deployed, modern stack"
  → Not visible: your CDK/EKS architecture work, your self-healing infra,
    your evidence-based extraction approach
  → Run `tucaken-signal preview` to see the full simulated scan.

Top suggestions (5 of 11):

  1. [READABILITY • QUICK WIN]
     Add a one-paragraph pitch above the fold                          ~10 min
     Your README opens with installation instructions. Recruiters need
     to know what this is in 30 seconds.

  2. [SYSTEM THINKING • HIGH IMPACT]
     Document your CDK/EKS architecture choice                         ~30 min
     Your repo shows significant infrastructure work (CDK, Karpenter,
     ArgoCD, self-healing patterns) but doesn't explain the architecture.
     This is the highest-signal documentation a mid/senior portfolio can have.

  3. [AUTHENTICITY • CREDIBILITY]
     Add an AI Usage section to your README                           ~15 min
     Some files show AI-assistance patterns (boilerplate density in
     [3 files]). In 2026, transparent AI usage is a credibility signal,
     not a weakness.

  4. [SYSTEM THINKING • RETROACTIVE ADRS]
     Document 4 undocumented architectural decisions                  ~1 hr
     Detected: CDK over Terraform, EKS over ECS, pgvector inside RDS,
     Bedrock over OpenAI. Each is interview-question fuel.

  5. [READABILITY • DEPTH VISIBILITY]
     Add a system architecture diagram above the deployment section   ~25 min
     Auto-generated diagram available via `tucaken-signal draft architecture`.

Run `tucaken-signal compare-stages` to see how this repo scores for senior roles.
Run `tucaken-signal preview` for the full 55-second recruiter simulation.
Run `tucaken-signal draft <id>` to generate draft content for a suggestion.
```

### JSON output

Same content structured for IDE adapters and programmatic use. Same shape as v1 with pillar/stage fields added.

## IDE Adapters

### Claude Code skill

```markdown
---
name: tucaken-signal
description: |
  Analyze the current repository's portfolio trust-signal quality for hiring
  contexts. Generates evidence-grounded improvements calibrated to your target
  career stage (junior/mid/senior/staff). Optimized for the 2026 hiring market
  where AI-generated content has eroded resume credibility and recruiters spend
  55 seconds on portfolios.
---

# Tucaken Signal

When the user invokes `/tucaken-signal` or asks for portfolio improvements:

1. Determine the target career stage. If not provided, run `tucaken-signal --format=json`
   and use the inferred stage. Otherwise pass `--stage=<value>`.
2. Run `tucaken-signal --format=json --stage=<target>` from the workspace root.
3. Parse the JSON output.
4. Present the trust signal score breakdown by pillar.
5. Show the "what a recruiter sees in 55 seconds" summary if available.
6. Present the top 5 suggestions, grouped by pillar.
7. When the user asks for a specific draft, run `tucaken-signal draft <id>` with `--with-llm`.
8. Offer to apply the draft via `tucaken-signal apply <id>` after user review.

If the user is signed into Tucaken (detected by checking `tucaken-signal config get tucaken_token`),
mention the optional MCP server that surfaces their existing Tucaken project data.
```

### Cursor extension

A Cursor extension exposing:
- "Tucaken: Analyze Repo Signal" command (default analyze)
- "Tucaken: Preview as Recruiter" command (preview mode)
- "Tucaken: Compare for Senior Role" command (compare-stages mode)

Each renders results in a side panel with accept/reject UI per suggestion.

### Other IDE adapters

Same pattern, different surface: Kiro, Codex CLI, Gemini CLI, OpenCode, etc. The CLI is the common substrate.

## MCP Server Companion (Optional)

For users authenticated to Tucaken, an optional MCP server provides live account state.

### Why MCP, not just an API call

Skills are procedural knowledge ("how to do X here"). MCP servers expose live state from external systems ("what is true right now over there"). The Tucaken account state — projects, ontology version, technology evidence, prior recommendations — is exactly the kind of live external state MCP is designed for.

When an authenticated user runs the skill in Claude Code, the skill can call MCP tools to:
- Fetch the user's existing Tucaken projects: "I see you have this repo as 'tucaken-monitoring' in Tucaken. The technology evidence from your last extraction includes [X]. Compare to current state."
- Sync recommendations: "save the suggestions you accepted to your Tucaken account so they reflect in your next resume generation"
- Cross-reference: "this repo's technologies overlap with your JD analysis for [role] — these are the highest-leverage suggestions for that specific application"

### Server scope

```typescript
// tools exposed by the MCP server
interface TucakenMcpTools {
  list_projects(): Project[];
  get_project_technologies(projectId: string): Technology[];
  get_recent_jd_analyses(): JdAnalysis[];
  get_user_ontology_version(): OntologyVersion;
  save_signal_suggestions(suggestions: AcceptedSuggestion[]): void;
}
```

Authentication via Tucaken API token, stored in `~/.tucaken/config.json`, sent as Bearer header to the MCP server endpoint.

For v1.0, the MCP server can be a v1.1 follow-on. The CLI ships first; the MCP layer comes when there's user pull for it.

## Privacy and Data Handling — Reaffirmed

The privacy posture is product-defining and not negotiable:

- Default offline; no network calls without explicit user action
- Raw code never sent to Tucaken servers, even in authenticated mode
- LLM draft generation uses one of three paths (host IDE, BYOK, or Tucaken API with user consent) and is always opt-in
- Telemetry is opt-in (not opt-out), anonymous, and never includes paths or content
- MCP server access requires explicit Tucaken authentication and is bidirectional only in the read direction by default

A "Privacy" section in the documentation explicitly states what does and doesn't leave the user's machine in each mode. This is also marketing-worthy: competing tools that send code to cloud services for analysis are increasingly unattractive to engineers.

## Testing

- **Unit:** each analyzer against fixture repositories. Coverage: each archetype × stage combination represented by at least 2 fixture repos.
- **Classification accuracy tests:** 50-repo hand-validated set; assert ≥90% primary archetype match and ≥80% career-stage match.
- **Suggestion grounding tests:** every generated suggestion's `evidence_basis` exists in the repo's files.
- **Pillar-specific tests:** for each pillar, fixture repos that intentionally lack/possess pillar-relevant signals.
- **Stage routing tests:** same fixture repo evaluated at different stages produces appropriately different top suggestions.
- **Recruiter preview tests:** preview output is human-readable, accurate to README content, and renders correctly across terminal widths.
- **Privacy tests:** assert no network calls in offline mode; assert raw code never appears in telemetry payloads.
- **Cross-platform CI:** Linux, macOS, Windows on Node 20 and 22.

## Distribution

### Primary path

```bash
npm install -g @tucaken/signal
tucaken-signal
```

### Without npm

```bash
curl -L https://github.com/tucaken/signal/releases/latest/download/tucaken-signal-macos-arm64 -o tucaken-signal
chmod +x tucaken-signal
./tucaken-signal
```

### Claude Code skill

```bash
/skills install tucaken-signal
```

### Cursor

Install from Cursor extension marketplace.

### Ontology as a separate open-source repo

The ontology lives in `tucaken-ontology` (MIT license), separately versioned. The npm package embeds a pinned version. Community can contribute new archetypes, stage definitions, or suggestion templates via PRs to that repo. Quality-gated by maintainers.

## Explicitly out of scope (deferred)

- **Automatic application of suggestions without review.** v2+.
- **GitHub PR generation against remotes.** v2+.
- **Multi-repo organization audits.** Different product.
- **Continuous on-save analysis.** v2+.
- **Custom user-defined archetypes/stages.** v2+ via ontology PR or local override.
- **Translation beyond English.** v1 English-only.
- **Auto-generation of ADRs from commit history retroactively.** v2+.
- **Cost-calculator framing tied to Tucaken extraction quality.** Out of scope by design; keeps the skill standalone.
- **AI-content detection as a feature.** Tucaken Signal *observes* AI patterns to support transparency recommendations. It does not provide a "detect AI authorship" tool — that's a different product, ethically fraught, and a category we don't want to enter.
- **Agent-readiness scoring.** Explicit positioning: pair with agent-readiness tools (Factory.ai, OpenHands readiness-report) for that need.

## Open questions for spec review

1. **Naming.** "Tucaken Signal" is the working name. Strong: maps to 2026 hiring vocabulary ("signal"), keeps Tucaken brand. Risk: collision with Signal messaging app brand. Alternatives: "RepoSignal by Tucaken", "Tucaken Surface", "Tucaken Witness". **Default: Tucaken Signal.** Worth a brief brand check before launch.

2. **Pillar weight defaults.** Should the default pillar weights be uniform (each at 0.20) or pre-calibrated per archetype × stage? Pre-calibrated is more accurate but requires more upfront work to populate the matrix. **Default: pre-calibrated for v1, with override flag for users who want to weight differently.**

3. **Stage inference confidence threshold.** What's the minimum confidence to auto-set stage vs. asking the user? **Default: 0.75 confidence auto-sets; below that prompts the user.**

4. **Recruiter preview mode — interactive simulation?** Should `--animate` actually simulate a 55-second scan in the terminal (slowly revealing content over time), or just label "30s threshold", "2-min threshold"? **Default: static labels in v1; animation is a v1.1 polish feature.**

5. **AI usage detection — surface or silent?** Should the AI-fingerprint analyzer surface its findings directly ("we detected AI patterns in these files"), or only via the recommendation ("consider documenting AI usage")? Surfacing risks feeling accusatory; staying silent reduces the credibility of the recommendation. **Default: surface findings in `--verbose` mode only; the default output frames it as a recommendation, not a detection.**

6. **MCP server in v1 or v1.1?** Building the MCP companion adds scope. v1 ships as standalone CLI/skill; MCP as v1.1 once there's user demand. **Default: v1.1.** But scaffold the architecture in v1 to enable easy addition later.

7. **Open-source the ontology, or keep proprietary?** Open: community contributions, transparency, Graphify-style distribution model. Closed: keeps the asset proprietary. **Default: open MIT under `tucaken-ontology` repo with maintainer-gated PRs.** The value is in curation, not secrecy.

8. **Should "compare-stages" be a default-visible feature?** It's powerful but might confuse first-time users. **Default: keep it as an explicit command, not surfaced in default output.** Reference it in the standard analyze output's footer ("Run compare-stages to see senior-targeting score").

## Reference

This spec describes Tucaken Signal as a standalone product addressing the 2026 hiring trust-signal crisis. The skill is intentionally separate from Tucaken's resume platform and its ingestion pipeline. The relationship between the two is coherence-based: the same team builds both, the ontologies share intellectual lineage, an authenticated user can optionally sync findings via MCP, but the skill is fully usable, valuable, and complete for users who never sign up for Tucaken.

The strategic rationale:

1. **The 2026 hiring market is structurally broken in a specific, identifiable way.** Resume signal is collapsing; AI-content has destroyed trust; GitHub repos undersell engineering work; recruiters compensate with skepticism and shortened attention.

2. **Existing tools optimize for the wrong audience.** Agent-readiness tools serve AI agents; nobody serves the *human recruiter trying to evaluate a human engineer in 55 seconds.* That's the gap Tucaken Signal occupies.

3. **The five-pillar structure maps to real, measurable market pressures.** Authenticity addresses AI-content erosion. Readability addresses 55-second scans. System Thinking addresses FAANG interview shifts. Production Reality addresses tutorial-portfolio problems. Stage Calibration addresses the junior/senior signal divergence.

4. **Career-stage awareness is uniquely Tucaken's.** Same repo, evaluated for junior vs. senior, produces different recommendations. No competitor does this.

5. **Privacy positioning is structural, not marketing.** Local-first, raw code never sent, opt-in everything. This makes the skill defensible against the growing class of cloud-based competitors.

6. **The ontology is the durable asset.** The CLI is its delivery surface. IDE adapters are entry points. MCP is the optional Tucaken-integration layer. Each layer is replaceable; the ontology — particularly the career-stage expectations — is what compounds in value over time.

The repo-shape ontology will be open-sourced under MIT in a separate `tucaken-ontology` repository. Community contributions to archetypes and stages are welcomed; quality is maintainer-gated. This positions Tucaken as a thoughtful contributor to engineering culture and creates a moat through curation rather than secrecy.