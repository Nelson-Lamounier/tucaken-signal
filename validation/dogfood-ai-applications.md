# Dogfood report — ai-applications

**Date:** 2026-05-27
**Target:** `/Users/nelsonlamounier/Desktop/portfolio/ai-applications`
**HEAD:** `c62752037c89cfef192f95c305163e97df30d9eb` (working tree clean)
**Surfaces tested:** CLI direct, JSON output, compare-stages, preview, --with-github

## TL;DR

The classifier reads ai-applications correctly on the main dimensions:
**monorepo / staff / 90 production-reality / 85 readability / 70
authenticity**. Substance of the analysis matches the ground truth.

But the run surfaced **3 real bugs** worth fixing before public release:

1. 🐛 **Walker descends into `.claude/worktrees/`** — found 7 copies of
   `cdk.json` (one per worktree), producing 7 duplicate
   "Document AWS CDK over Terraform" decisions and 5 identical
   anticipated questions. Major UX regression.
2. 🐛 **GitHub signals downgrade stage on private repos.** Static-only:
   `staff conf=1.0`. With `--with-github` on a 0-star/0-public-contributor
   repo: `mid conf=0.8`. The threshold shift assumes GH data adds
   points; on private repos it adds none but still raises the bar.
3. 🐛 **DecisionDetector emits duplicates** — same `iac_choice` decision
   fires once per `cdk.json` instance, no de-dup by topic.

## Ground-truth check

Categories: ✅ correct • ⚠️ debatable • 🐛 wrong (bug) • ✨ product-validation
(surfaced something you didn't realize)

| Dimension | Got | Ground truth | Verdict |
|---|---|---|---|
| Archetype | `monorepo` (0.85) | "production_saas or monorepo with high confidence" | ✅ structurally correct; monorepo wins decisive rule before production_saas. If your mental model is production_saas, this is a label-vs-fingerprint call we discussed pre-run. |
| Stage (static) | `staff` (1.0) | "senior or staff" | ✅ exactly right |
| Stage (+github) | `mid` (0.8) | "senior or staff" | 🐛 **BUG** — see #2 below |
| Production-reality pillar | 90 / 100 | high (CDK, 38 migrations, smoke tests) | ✅ |
| Readability pillar | 85 / 100 | medium-high (good pitch, no diagram, root MD clutter) | ⚠ score may be too generous — root has 12+ uppercase MDs that the readability analyzer doesn't penalize |
| Authenticity pillar | 70 + "strong human-judgment signals" | should detect AI assistance, recommend AI_USAGE.md | ✅ correctly recommends AI Usage section; HumanJudgmentDetector found signals (off-hours commits, opinionated naming) |
| System-thinking pillar | 10 / 100 | low (no ADRs, no in-tree architecture diagram, 7 IaC choices undocumented) | ✅ correctly low |
| Tutorial signal | not flagged | should NOT flag | ✅ TutorialSignalAnalyzer correctly silent |
| Recruiter glance (visible) | pitch, live URL, IaC (aws-cdk) | matches | ✅ |
| Recruiter glance (invisible) | architecture, AI usage transparency, 7 architectural decisions | matches | ✅ |
| Top suggestions | system_thinking dominates (4 of 5) | architecture diagram, ADRs, AI_USAGE | ✅ pillar focus correct, but content polluted by bug #3 |

## The 3 bugs in detail

### Bug 1 — Walker descends into `.claude/worktrees/`

**Symptom:** 7 copies of `cdk.json` detected:

```
infra/cdk.json
.claude/worktrees/reconciliation-phase-a/infra/cdk.json
.claude/worktrees/profile-aggregation-foundation/infra/cdk.json
.claude/worktrees/mirror-reveal-phase-a/infra/cdk.json
.claude/worktrees/direction-phase-a/infra/cdk.json
.claude/worktrees/diagnostic-phase-a/infra/cdk.json
.claude/worktrees/cleanup-post-sp5/infra/cdk.json
```

**Root cause:** `RepoReader.ts` IGNORE set excludes `.git`, `node_modules`,
`dist`, `build`, `.next`, `.yarn`, `coverage`, `.venv`, `__pycache__`,
`.turbo`, `.cache`, `Pods`. Does NOT exclude `.claude/`.

`.claude/worktrees/` is a Claude Code convention for parallel agent
worktrees — exact copies of the repo's state. Walker sees them as
sibling subtrees and counts every file 7 times.

**Fix (one line):** add `.claude` to the IGNORE set in
`packages/signal-cli/src/repo/RepoReader.ts:9`.

**Blast radius:** affects anyone using Claude Code worktree workflows.
Likely 100% of Anthropic-adjacent power users. Embarrassing if it ships.

### Bug 2 — GitHub fetch downgrades private repos

**Symptom:**
- Static-only: `stage: staff, confidence: 1.0`
- With `--with-github`: `stage: mid, confidence: 0.8`
- GH data returned: `0 stars, 2 contributors, 0 releases` (private repo, gh token doesn't surface full team)

**Root cause:** `StageInferenceEngine.ts:60-65` raises the staff
threshold from `≥8` to `≥14` whenever `github` arg is truthy, *regardless
of how many GH points were actually added*. For a private repo with
0/2/0 metrics, GH contributes 0 points but the bar rises 6 points.

**Fix:** only apply the threshold shift when GH data is materially
non-zero, OR add a minimum-data check before using GH thresholds. E.g.:

```ts
const ghContributed = github && (github.stars + github.contributorCount + github.releaseCount) > 5;
if (ghContributed) { /* use higher thresholds */ }
else { /* fall back to static thresholds */ }
```

**Blast radius:** every private-repo invocation with `--with-github`
enabled. Will be the default for any paid-Tucaken user who wires up
GitHub.

### Bug 3 — DecisionDetector duplicates

**Symptom:** "Document 7 undocumented architectural decisions" lists
"AWS CDK over Terraform" 7 times. Anticipated questions section
repeats the same question 5 times.

**Root cause:** `DecisionDetector.ts` iterates `evidence.files.iacRoots`
and emits one decision per cdk.json. Bug 1 amplifies this (7 cdk.json
→ 7 decisions), but the underlying logic should dedupe by `(topic, chose)`
even when iacRoots are legitimately many.

**Fix:** add `const seen = new Set<string>()` keyed by `${topic}::${chose}`
in `DecisionDetector.detectDecisions()`.

**Blast radius:** any repo with multiple IaC entries (legitimate cases:
multi-region CDK, app + infra split). Less severe than bug 1 but
visible to every monorepo user.

## Surface consistency (Phase 2 check)

We ran CLI three ways. JSON outputs:

- `dogfood-static.json`: 7326 bytes
- `dogfood-github.json`: 7351 bytes (delta = GH signal block + threshold shift)

CLI vs skill vs MCP not yet diffed (requires Claude Code session and
MCP wiring). The static→github delta is meaningful and explained;
CLI internal consistency confirmed.

## Stage routing (Phase 3 check)

`compare-stages` produced different top suggestions per stage — routing
works:

| Stage | Top suggestion |
|---|---|
| junior | Add a 'Packages' table (one line per workspace) |
| mid | Add a 'Packages' section listing each workspace + purpose |
| senior | Document why monorepo over polyrepo (one ADR) |
| staff | No architecture diagram |

Junior/mid both push "package map" (correctly — invisibilises the
workspace structure to outsiders). Senior pushes ADR (correct). Staff
escalates to architecture diagram (correct — staff is expected to
have shipped a system view).

✅ Stage routing works as designed.

## Recruiter preview (Phase 4 — 55-second sanity)

Preview output (full):

```
┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
┃   RECRUITER PREVIEW — 55 second simulated scan              ┃
┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛

── 0:00–0:30  Above-the-fold ────────────────────────────────
  Title:        ai-applications
  Pitch:        Production multi-service AI/ML platform on AWS Bedrock. Powers the ar…
  Status:       visible
  Demo link:    absent
  Tech badges:  absent

  Recruiter first impression:
    "Reads as monorepo. Need to scroll to gauge depth."

── 0:30–2:00  Scroll + section scan ─────────────────────────
  Top sections seen:
    • ai-applications
    • Architecture at a glance
    • Stack
  Architecture diagram: no — depth invisible
  Deployment evidence:  visible (IaC / CI)
  AI transparency:      absent (2026 risk: undisclosed-AI assumption)

── 2:00+  Deep-dive (only top ~20% of recruiters reach here) ─
  ADRs:    missing
  Runbook: missing
  Tests:   present
```

**55-second articulation test:** After reading, I can say "production
multi-service AI/ML platform on AWS Bedrock, deployed, no demo link,
no diagram, no AI usage doc, has tests." ✅ working as designed.

**Honest reflection:** The "first impression" is correctly tepid
("need to scroll to gauge depth"). That's not a preview bug — that's
the preview correctly reflecting that the repo's depth is not visible
above the fold. The remedy is in the suggestions, not the preview.

## Product-validation moments (✨)

Two things the tool surfaced that I'd guess were not consciously
visible to you:

1. **The `.claude/worktrees/` pollution affects every signal it touches.**
   Even after we fix bug 1, the dogfood reveals that having
   multiple worktrees on disk meaningfully distorts how the tool reads
   the repo. For your own use, you may want a `.tucakenignore` flag
   (separate issue, future).

2. **The recruiter preview's "first impression" is `monorepo` not
   `AI platform`.** Your README pitch ("Production multi-service AI/ML
   platform on AWS Bedrock") is buried below the title. If the title
   were `ai-applications — production AI platform on AWS Bedrock`,
   the first-impression line would change. That's not a tool bug —
   it's the tool doing exactly what it's supposed to do, which is tell
   you what a 30-second skim conveys.

## Recommended fix order

1. **Fix bug 1** (`.claude` to IGNORE set) — 1 line, instant. Re-run
   dogfood to confirm.
2. **Fix bug 3** (DecisionDetector dedupe) — 3 lines.
3. **Fix bug 2** (GH threshold guard) — 5 lines + needs thinking.
4. Re-run dogfood, capture deltas.

## Phase 5 (apply-and-rerun) — not done

Would need to apply one of the suggestions (e.g. add an
`AI_USAGE.md`) and re-run, confirming the authenticity pillar score
rises. Deferred to next session.

## Phase 2 (cross-surface diff) — not done

Requires Claude Code session with skill installed + MCP wired.
Deferred. Code path is shared (CLI / MCP both call `analyze()`), so
internal consistency is high-confidence; the value of running the
diff is catching unexpected drift, not finding bugs.
