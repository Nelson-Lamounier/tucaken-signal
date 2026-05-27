---
name: tucaken-signal
description: |
  Analyze the current repository's portfolio trust-signal quality for hiring
  contexts. Generates evidence-grounded improvements calibrated to your target
  career stage (junior/mid/senior/staff), and can draft + apply the
  recommended changes. Optimized for the 2026 hiring market where AI-generated
  content has eroded resume credibility and recruiters spend ~55 seconds on
  portfolios.
---

# Tucaken Signal

Use this skill when the user asks for portfolio improvements, hiring-signal
analysis, a recruiter-perspective view of a repo, or runs `/tucaken-signal`.

## Step 1 — Determine the target career stage

If the user provided a stage (junior/mid/senior/staff), pass it through. Otherwise:

```bash
tucaken-signal --format=json
```

If `report.stage.confidence < 0.75`, the CLI prints a warning to stderr. In
that case, ask the user which stage to target rather than silently
accepting the inferred one. The auto-inference is most reliable on
mid-and-up repos.

## Step 2 — Run analysis

```bash
tucaken-signal --format=json --stage=<target>
```

Parse the `TrustSignalReport` JSON. Useful fields:

- `archetype.id` — one of 9 archetypes (production_saas, open_source_library,
  internal_tool, ml_research, devops_infra, monorepo, cli_tool, mobile_app,
  static_site)
- `pillars[]` — score 0–100 per pillar (authenticity, readability,
  system_thinking, production_reality, stage_calibration)
- `overallScore` — weighted by archetype × stage
- `recruiterGlance.{visible, invisible}` — what surfaces in 55 seconds vs.
  what is hidden
- `suggestions[]` — top 15, ranked by `pillar_weight × impact / effort`,
  each with `evidenceBasis` references to real files
- `anticipatedQuestions[]` — interview-style questions the codebase would
  face, plus whether they are documented in the repo
- `stage.{id, inferred, confidence, explanation}` — how the stage was set

## Step 3 — Present results

1. Lead with overall score + the one most-load-bearing pillar gap.
2. Show `recruiterGlance` — visible / invisible items — verbatim. This is
   the most user-resonant section.
3. List top 5 suggestions, grouped by pillar. For each: title, one-line
   description, evidence path, and whether `draftAvailable` is true.
4. Surface 2–3 `anticipatedQuestions` if non-empty — these are interview
   conversation starters the engineer can prepare for.
5. Mention `compare-stages` if the user might be targeting multiple
   levels.

## Step 4 — Drafts and apply

If the user wants to act on a suggestion with `draftAvailable: true`:

- Generate draft content:
  ```bash
  tucaken-signal draft <suggestion-id>
  ```
- Or generate + write into the repo (optionally on a branch with a commit):
  ```bash
  tucaken-signal apply <suggestion-id> --branch=docs/signal-improvements
  ```
- For LLM-enhanced drafts, add `--with-llm`. Two paths:
  - BYOK: user has `ANTHROPIC_API_KEY` exported — CLI calls Anthropic directly.
  - IDE bridge: when `TUCAKEN_IDE_BRIDGE=1`, the CLI returns the marker
    `__IDE_BRIDGE__` and expects YOU (the host LLM) to do the rewrite using
    the same prompt the CLI would have sent.

Always show the user the draft before applying. Never run `apply` without
explicit confirmation.

## Step 5 — Additional commands worth surfacing

- `tucaken-signal preview` — literal 55-second recruiter simulation
  (`--animate` paces the reveal). Often the most shareable output.
- `tucaken-signal compare-stages` — same repo scored across all four
  stages; useful when the user is uncertain about their target level.
- `tucaken-signal ontology` — show loaded archetype list + version.

## Tucaken account integration (optional)

If the user is signed in (`tucaken-signal config get tucaken_token`
returns a value):

- `tucaken-signal sync push [projectId]` — saves the current suggestions
  to the user's Tucaken account so they propagate into the next resume
  generation.
- `tucaken-signal sync projects` — lists the user's existing Tucaken
  projects so suggestions can be tied to one.
- Or, when the `@tucaken/signal-mcp` server is wired into the host
  agent, call the MCP tools `list_projects`, `analyze_local_repo`,
  `save_signal_suggestions` directly — no shell invocation needed.

## Privacy posture (load-bearing, don't violate)

- Local-first by default. No network calls without explicit user action.
- Raw code is never sent to Tucaken servers — even in authenticated mode,
  only structured suggestions + evidence file paths + snippet excerpts
  ≤200 chars.
- Telemetry is opt-in (`telemetry opt-in`), anonymous, never includes
  paths or content.
- LLM draft generation requires `--with-llm` AND either an API key or the
  IDE bridge flag — never on by default.

If the user is on a sensitive codebase, prefer `draft` (writes to stdout
or a path you choose) over `apply` (writes inside the repo). Never push
to a remote.
