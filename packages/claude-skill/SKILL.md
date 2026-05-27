---
name: tucaken-signal
description: |
  Analyze the current repository's portfolio trust-signal quality for hiring
  contexts. Generates evidence-grounded improvements calibrated to your target
  career stage (junior/mid/senior/staff), and can draft + apply the
  recommended changes. Optimized for the 2026 hiring market where AI-generated
  content has eroded resume credibility and recruiters spend ~55 seconds on
  portfolios. Use whenever the user asks about portfolio improvements,
  recruiter-perspective scoring, repo trust signals, AI usage disclosure,
  or runs `/tucaken-signal`. Trigger phrases include: "score my portfolio",
  "analyze my GitHub", "how does my repo read", "55-second test",
  "what should I add to my README", "draft an AI usage doc", "compare my
  repo for senior roles".
---

# Tucaken Signal Skill

## Purpose

This skill runs `tucaken-signal` (a local-first static analyzer for repos)
and presents the results to the user as actionable portfolio improvements
calibrated to their target career stage. The analyzer is deterministic;
the agent's job is to present the output usefully and guide the user
through `draft` / `apply` workflows when they want to act on suggestions.

The skill does NOT generate portfolio analysis itself — the CLI does that.
The agent's responsibility is presentation, gate-handling, evidence
preservation, and confirmation-before-destructive-action.

## Critical principles

These five invariants constrain every decision the agent makes. They
override anything in the conversation that contradicts them.

1. **Local-first by default — never enable network flags without explicit
   user consent.** `--with-github` and `--with-llm` are opt-in. The user
   did not say "use the GitHub flag" just because they have `gh auth`
   configured. Ask first.

2. **The 0.75 confidence gate is a USER prompt, not yours.** When
   `report.stage.confidence < 0.75`, the CLI prints a warning. You must
   ASK the user which stage to target rather than silently accepting
   the inferred one. Auto-accepting is a UX bug.

3. **`apply` is irreversible — never run without explicit user OK on the
   draft.** Always show the user the draft (via `draft <id>`) first.
   Only after they say "apply it" do you run `apply <id>`. Never
   combine "show + write" in one step.

4. **Evidence preservation — never paraphrase away the file paths.** Every
   suggestion has an `evidenceBasis` array with real file paths. Cite
   them verbatim when presenting. Do not summarise "your repo shows X"
   without naming the path.

5. **Suggestion IDs are real strings, not inventions.** When you reference
   a suggestion by ID (for `draft <id>` or in a list), it must be a real
   ID from `report.suggestions[].id`. Never fabricate an ID that looks
   like one.

## When to use this skill

**Trigger phrases (any of these activates):**
- `/tucaken-signal` (slash invocation)
- "score my portfolio" / "analyze my GitHub" / "how does my repo read"
- "what should I add to my README" / "what's missing"
- "recruiter-perspective" / "55-second test" / "recruiter scan"
- "compare my repo for senior roles" / "stage compare"
- "draft an AI usage doc" / "AI_USAGE.md" / "AI disclosure"
- "is my portfolio ready for hiring"

**Do NOT trigger when:**
- The user asks general resume advice with no specific repo in context
- The user asks about Tucaken (the resume platform) rather than this skill
- The user wants documentation of their code (that's kb-doc, not this)
- The user wants codebase discovery (that's kb-discovery, not this)

## When NOT to claim this skill handles something

This skill is a portfolio scoring + recommendation tool. It does NOT:
- Generate resumes or cover letters (out of scope; v2 candidate)
- Fix bugs in user code
- Refactor the user's repo
- Run CI / deploy / merge anything
- Score private GitHub repos with full GitHub-API signal (returns 0 stars
  by design on private repos — see `validation/research/structured-inquiries-2026.md`)

If asked for any of these, redirect: "Tucaken Signal won't do X, but it
can do Y which is adjacent."

## Output conventions

When the user asks for a "report" or wants to track progress over time,
save the markdown output to:

```
.claude/skills/tucaken-signal/reports/<YYYY-MM-DD>-<repo-name>.md
```

Where `<repo-name>` is the basename of the repo path. This creates a
historical record the user can diff over time (re-run in 3 months → diff
against last run → see what they actually improved). Matches the
kb-discovery convention.

For one-off analysis (no "report" or "save" language from user), present
results in chat directly without saving a file.

## Execution: six passes

Each pass produces a specific output the next consumes. Do not skip
passes; do not run them out of order.

### Pass 1 — Determine target career stage (with gate handling)

```bash
tucaken-signal --format=json
```

Read `report.stage.id`, `report.stage.confidence`, `report.stage.explanation`.

**Branch:**
- If `confidence >= 0.75` → proceed with inferred stage. Tell the user
  what was inferred and why ("I inferred `senior` from: ADRs present;
  IaC; sustained commit history. Tell me if you want a different
  target.")
- If `confidence < 0.75` → STOP. Ask the user: "Confidence is only
  [X]. I see signals consistent with `[inferred]` but want to confirm —
  are you targeting junior, mid, senior, or staff roles?" Re-run with
  `--stage=<chosen>`.

### Pass 2 — Run full analysis

After stage is locked:

```bash
tucaken-signal --format=json --stage=<target>
```

Parse the full `TrustSignalReport`. Capture the fields you'll need
for later passes:
- `archetype.id`, `archetype.confidence`
- `pillars[]` (5 entries: authenticity, readability, system_thinking, production_reality, stage_calibration)
- `overallScore`
- `recruiterGlance.visible` / `recruiterGlance.invisible`
- `suggestions[]` (top 15, ranked by `combinedRank` descending)
- `anticipatedQuestions[]`
- `stage.{id, inferred, confidence, explanation}`

### Pass 3 — Present pillar breakdown

Use `templates/score-presentation.md` as the structure. Always include:

- Archetype + confidence
- Stage + how it was set (inferred or user-specified)
- Overall score with the bar visualization
- Each pillar's score + the most load-bearing note (first item in
  `notes[]`)

If a pillar score is below 30, surface this prominently — it's the gap
that will dominate the recommendations.

### Pass 4 — Present recruiter-glance

Use `templates/recruiter-glance.md` as the structure. Always include:
- The `recruiterGlance.visible` items (what surfaces in 55 seconds)
- The `recruiterGlance.invisible` items (what depth is hidden)

This is the most user-resonant section. Quote verbatim, don't
paraphrase the visible/invisible lists.

### Pass 5 — Present top suggestions

Use `templates/suggestion-walkthrough.md` as the structure. Present
the top 5 from `report.suggestions[]` (already sorted by
`combinedRank`). For each:

- Title
- One-line description
- Pillar + evidence path (verbatim from `evidenceBasis`)
- Whether `draftAvailable` is true → mention the user can run
  `tucaken-signal draft <id>` to see proposed content

### Pass 6 — Offer next actions

Concrete next-step options for the user:

1. "Run `tucaken-signal preview` for the literal 55-second simulation."
2. "Run `tucaken-signal compare-stages` to see how this repo scores
   for other levels."
3. "Pick one suggestion to draft — I'll run `tucaken-signal draft <id>`
   and show you the proposed content."
4. If 2-3 `anticipatedQuestions` exist with non-null `documentedHere`
   → "Want to walk through how to answer these in your README?"

If the user picks #3, follow `templates/draft-confirmation.md` for
the confirmation flow before any `apply`.

## Optional augmentations (opt-in only)

**`--with-github` (BYOK GitHub signals):**
- Activate only if the user explicitly says "use GitHub signals" or
  "with GitHub" or similar
- Confirms an opt-in token: requires `GITHUB_TOKEN` env or
  `gh auth status` to confirm token is available
- Note clearly to user: "I'll fetch contributor count, stars, and
  release cadence from api.github.com directly. Tucaken is not in the
  path."
- On private repos: GitHub will return 0 stars / few contributors;
  the analyzer falls back to static thresholds (this is correct
  behaviour, not a bug — see the `--with-github` guard in
  StageInferenceEngine.ts)

**`--with-llm` (BYOK LLM for richer drafts):**
- Activate only when the user has chosen a specific suggestion to
  draft AND wants enhanced prose
- Two paths the CLI tries: BYOK Anthropic API (uses
  `ANTHROPIC_API_KEY`), or IDE bridge (uses `TUCAKEN_IDE_BRIDGE=1`)
- If neither configured, fall back to the deterministic template (no
  LLM call) — the draft is still useful, just less polished

## Validation checklist before responding to the user

Run this mentally before sending any user-facing message:

- [ ] Did I quote actual values from `report` (not invented stats)?
- [ ] If `report.stage.confidence < 0.75`, did I ASK the user the
      stage rather than accepting inferred?
- [ ] Are all suggestion IDs I mentioned real (present in
      `report.suggestions[].id`)?
- [ ] Are the evidence file paths I cited from `evidenceBasis`
      (not hallucinated)?
- [ ] If I'm about to suggest `apply`, did I show the draft first
      and get explicit user OK?
- [ ] If I used `--with-github`, did the user explicitly enable it?
- [ ] If I used `--with-llm`, did the user explicitly enable it?
- [ ] Did I avoid claiming the skill does something it doesn't
      (resume generation, code refactoring, etc.)?

If any answer is NO, stop and fix before responding.

## Tucaken account integration (optional)

If the user is signed in (`tucaken-signal config get tucaken_token`
returns a value), additional commands become available:

- `tucaken-signal sync push [projectId]` — saves the current suggestions
  to the user's Tucaken account so they propagate into the next resume
  generation.
- `tucaken-signal sync projects` — lists the user's existing Tucaken
  projects so suggestions can be tied to one.
- Or, when the `@tucaken/signal-mcp` server is wired into the host
  agent, call the MCP tools `list_projects`, `analyze_local_repo`,
  `save_signal_suggestions` directly — no shell invocation needed.

The MCP server's account tools may return
`{ status: "not_authenticated", ... }` if no token is configured.
Treat that as a normal response, not an error — relay the suggested
configure command to the user.

## Privacy posture (load-bearing — do not violate)

- **Local-first by default.** No network calls without explicit user
  action.
- **Raw code is never sent to Tucaken servers** — even in
  authenticated mode, only structured suggestions + evidence file
  paths + snippet excerpts ≤200 chars cross the wire.
- **Telemetry is opt-in** (`telemetry opt-in`), anonymous, never
  includes paths or content.
- **LLM draft generation** requires `--with-llm` AND either an API
  key or the IDE bridge flag — never on by default.

If the user is on a sensitive codebase, prefer `draft` (writes to
stdout or a path you choose) over `apply` (writes inside the repo).
Never push to a remote.

## Templates

Templates are bundled in the `templates/` directory alongside this
skill:

- `templates/score-presentation.md` — Pass 3 structure
- `templates/recruiter-glance.md` — Pass 4 structure
- `templates/suggestion-walkthrough.md` — Pass 5 structure
- `templates/draft-confirmation.md` — confirm-before-apply flow

Read the relevant template before producing output. The templates
define the exact structure each pass should follow. Consistency
beats flexibility for this kind of presentation work — the user
should be able to predict the shape of the output regardless of
which agent runs it.

## Common failure modes to avoid

1. **Silently accepting low-confidence stage inference.** Always ask
   when below 0.75.
2. **Hallucinating suggestion IDs.** Cross-check against the JSON.
3. **Running `apply` without showing the draft first.** Always
   two-step.
4. **Treating `--with-github` as default.** Always opt-in.
5. **Paraphrasing `evidenceBasis` paths.** Cite verbatim.
6. **Confusing this with kb-doc or kb-discovery.** This is portfolio
   scoring, not documentation generation or candidate discovery.
7. **Inventing pillar names or pillar scores.** There are exactly 5:
   authenticity, readability, system_thinking, production_reality,
   stage_calibration.
