# Comment-prep — anticipated HN questions and how to answer

Read once before launch. When the comment lands, you'll recognise the
pattern and have a default response ready.

## Pattern 1: "Why not just use ChatGPT/Claude to do this?"

**Likely framing:** "An LLM could generate the same suggestions in 10
seconds — why build a tool?"

**Your default response:**

```
Three reasons LLMs aren't the right shape for this specific task:

1. Determinism — same repo always returns the same report. LLM scoring
   drifts between runs which makes the recommend→apply→re-measure loop
   unreliable.
2. Privacy — your code stays on your machine. Most users don't want to
   ship their unreleased project to a third-party LLM endpoint just to
   get portfolio feedback.
3. Evidence-grounding — every suggestion cites a specific file the
   analyzer extracted. "Add Y because your repo shows X at path/to/file"
   reads differently than "you should probably consider adding Y."

There's an opt-in --with-llm flag for users who want LLM-enhanced
draft content. The analysis itself never requires an LLM call.
```

## Pattern 2: "How is this different from [other GitHub portfolio tool]?"

**Likely framing:** Someone names one of the commodity tools that shipped
this year — usually an LLM-pump scorer.

**Your default response:**

```
The two that shipped this year are good at what they do — LLM creative
writing about your repo. Tucaken's positioning is structurally different:

  • Local-first (no code uploaded vs cloud-LLM in their path)
  • Deterministic (reproducible report vs different output every run)
  • Stage-aware (junior vs staff materially different recommendations)
  • Ontology-grounded (9 archetypes × 4 stages × 5 pillars; theirs is
    free-form prose)
  • Evidence-grounded (every suggestion cites a file path)

Trade-off is honest — they give you LLM-quality prose at the cost of
shipping code to a vendor. We give you deterministic analysis with code
never leaving your machine, at the cost of less prose flair. Different
products for different concerns.
```

## Pattern 3: "Did this tell you anything useful about your own repo?"

**Likely framing:** Test of whether the dogfood was real.

**Your default response:**

```
Yes — and the surprises caught real bugs. When I ran v0.1.0 against my
own ai-applications repo it found 7 copies of cdk.json because my
.claude/worktrees/ directory had parallel agent worktrees. That broke
the architecture-decision detection (7 duplicate ADR suggestions). Fixed
in v0.1.1.

The repo also surfaced that my system-thinking pillar score was 10/100
despite having extensive CDK infrastructure work — because none of the
architectural decisions were documented as ADRs. That's actually correct.
The infrastructure work exists; it's invisible from the README. Filed
the ADR backfill as my own top action item.

Dogfood report at validation/dogfood-ai-applications.md in the repo.
```

## Pattern 4: "What about [edge case archetype / repo type]?"

**Likely framing:** Someone names Rust workspaces, Bazel monorepos,
nix-based projects, etc.

**Your default response:**

```
v1.0 covers the 9 most common archetypes (production_saas, library,
internal_tool, ml_research, devops_infra, monorepo, cli_tool, mobile_app,
static_site). Each gets stage-specific suggestion templates.

[Their archetype] would be a v1.1 extension. The ontology lives in
@tucaken/ontology and is MIT-licensed — happy to take a PR or you can
fork it. The classifier is a 7-rule decisive-pipeline with score-based
fallback, so adding an archetype is mostly ontology YAML + 1-3 lines
in RepoClassifier.

The remaining ~30% of archetype space (Rust workspaces, Bazel, nix
flake-projects, etc.) is in the explicit roadmap. Want me to track
yours specifically?
```

## Pattern 5: "Privacy concerns / does this send my data anywhere?"

**Your default response:**

```
By default, no network calls at all. The analyzer is purely local
static analysis.

Three opt-in modes:
  • --with-github: BYOK GITHUB_TOKEN, fetches contributor count and
    stars direct from api.github.com. Tucaken not in the path.
  • --with-llm: BYOK ANTHROPIC_API_KEY, only invoked for draft
    generation when you explicitly ask. Tucaken not in the path.
  • Tucaken account sync (v1.1): opt-in, sends only structured findings
    and ≤200-char snippets, never raw code.

Telemetry is opt-out by default. Source at github.com/Nelson-Lamounier/tucaken-signal
if you want to verify any of this.
```

## Pattern 6: "Why is the validation only 87% stage / 93% archetype?"

**Likely framing:** Skeptic challenging the gates.

**Your default response:**

```
Those are the honest numbers and we publish the methodology.

Archetype 93% on a 43-repo canonical OSS fixture set. The 7% miss is
documented edge cases (jekyll = ruby gem that ships a CLI, appsmith =
SaaS that ships its own helm chart, date-fns = library structured as
a monorepo). All three are honest label-vs-fingerprint disagreements
on the canonical fixture set, not classifier bugs.

Stage 87% with GitHub signals (56% static-only). The ceiling on
static signals is real — distinguishing "mature lib" from
"industry-standard mature lib" needs contributor counts and release
cadence the static analyzer can't see.

The bigger UX backstop is the 0.75 confidence gate. When the
classifier is unsure, it refuses to act and prompts the user instead.
Of 13 stage misses in our test set, 7 trip the gate — so the silent-
wrong rate in lived UX is ~12% vs the raw 38%.

Full methodology in validation/RESULTS.md.
```

## Pattern 7: "Show HN posts about CLI tools always disappear in 24 hours, why is yours different?"

**Likely framing:** Meta-critique of HN dynamics.

**Your default response:**

```
Probably not different — that's fine. The point of the launch isn't HN
front-page longevity. It's introducing the local-first / static-analysis
positioning to the engineers who'd find it valuable. If 50 engineers
install it from this post and 5 of them file useful issues, that's a
better outcome than a permanent front-page slot.

The CLI is on npm and the source is on GitHub. It's persistent
regardless of HN ranking.
```

## Pattern 8: "Is this just an AI tool wrapped in 'static analysis' marketing?"

**Likely framing:** AI-skepticism turned at the tool itself.

**Your default response:**

```
No — the core analysis pipeline doesn't call any LLM. You can verify by
running it with --offline (the default) and watching network activity.

The only LLM touch points are:
  • --with-llm flag for optional draft enhancement (off by default)
  • A HumanJudgmentDetector that recognises AI-fingerprint patterns
    in code (regex-based, no LLM call — just looking for things like
    formulaic README phrasing)

If you find any LLM call happening in the default path, that's a
privacy bug — please file it.
```

## Patterns to ignore (or one-line acknowledge then drop)

- "MIT vs Apache vs MPL license preference" — "MIT. Open to PRs to add license headers if there's specific need."
- "Why TypeScript not Rust?" — "Yarn 4 monorepo + sharing code with the MCP server. TS was the path of least friction."
- "What about Bitbucket / GitLab?" — "v1.1 candidate; the classifier is hosting-agnostic, only the --with-github flag is GitHub-specific."
- "AGENTS.md vs SKILL.md religious wars" — don't engage.

## When you've answered enough

After ~10 substantive replies, your engagement value drops. Let the
community discuss without you for a few hours. Come back to address
direct questions and bug reports, not opinions.

## Bug reports during the launch window

If someone files a GitHub issue during the 24h window:

1. Triage label within 30 min (`bug` / `enhancement` / `question`)
2. If reproducible, acknowledge in the HN thread: "Filed as #N, fixing
   in v0.1.3 this week"
3. If not reproducible, ask for the repo URL or `tucaken-signal --format=json` output

This signal — "the author is responsive" — drives more conversions
than the original post.
