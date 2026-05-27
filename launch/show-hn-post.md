# Show HN — submit this

**Submit at:** https://news.ycombinator.com/submit
**Best window:** 8–11am EST weekday for max visibility (peak HN reading)
**You must submit personally as the creator** — HN moderators check.

---

## Title (one line, exact format)

```
Show HN: Tucaken Signal – Local-first portfolio analyzer scored across 5 hiring-signal pillars
```

Alt titles if you want to A/B:
- `Show HN: Tucaken Signal – I analyzed my own GitHub portfolio the way a recruiter does and built a CLI for it`
- `Show HN: Tucaken Signal – Evidence-grounded portfolio analyzer (local-first, no LLM)`

Recommended: the first. Specific, names the structural differentiator (5 pillars), and "local-first" is HN catnip in 2026.

## URL

```
https://github.com/Nelson-Lamounier/tucaken-signal
```

## Text (leave blank — Show HN convention is URL-only submission, then first comment from you)

---

## First comment (post this immediately after submitting)

Paste this as the first comment on the thread. Show HN convention: creator drops the "here's the why" comment within minutes of the post.

```
Author here. Quick context on why I built this and what makes it different
from the other GitHub-scoring tools that shipped this year.

The premise: in 2026 hiring, recruiters spend ~55 seconds on a portfolio,
77% of teams encounter AI-generated applications regularly, and 49% of US
hiring managers auto-dismiss résumés they suspect are AI-generated. The
fallback signal — your GitHub repos — was supposed to fix this, but most
repos undersell the engineer because the depth is in the code and the
55-second reader is reading the README.

Tucaken Signal reads the repo (locally, no upload) and scores it across
5 pillars:

  • Authenticity (AI fingerprints + commit-history human-trail signals)
  • Readability (above-the-fold density, scan-timing estimation)
  • System Thinking (architectural-decision detection, ADR gap analysis)
  • Production Reality (deployment evidence vs tutorial-shaped signals)
  • Stage Calibration (junior/mid/senior/staff routing — same repo, different recommendations)

Output is a recruiter-perspective preview ("here's what someone sees in
30 seconds, here's what's invisible") plus 5-15 evidence-grounded
suggestions, each citing a real file in your repo. There's a `draft`
command that generates accept-ready content for specific suggestions
and an `apply` command that writes them in via a branch.

How it's different from the LLM-pump GitHub scorers that shipped in 2026:

  1. Local-first by default. Your code never leaves your machine. Optional
     opt-in GitHub API integration for stage signals (BYOK; goes direct
     to api.github.com, Tucaken not in the path).
  2. Deterministic. Same repo → same report. No LLM creative writing.
  3. Stage-aware. The same repo scored for junior vs staff produces
     materially different recommendations.
  4. Evidence-grounded. Every suggestion cites a specific file/path. No
     "you should probably add X" — it's "your repo at path/to/file shows
     X, here's a draft."

Three surfaces:
  - CLI: `npm install -g @tucaken/signal-cli`
  - Claude Code skill (manual install for now; instructions in repo)
  - MCP server: `claude mcp add tucaken-signal npx -y @tucaken/signal-mcp`

Validation: 93% archetype classification accuracy on a 43-repo OSS fixture
set; 87% stage accuracy with GitHub signals (56% static-only). Both
honest numbers, full methodology + remaining gaps in
validation/RESULTS.md.

The ontology (9 archetypes × 4 stages × 5 pillars × pillar weights) is
MIT-licensed and separately versioned at @tucaken/ontology — fork and
extend.

Happy to answer questions about the static-analysis design vs LLM
alternatives, the stage-calibration approach, the privacy model, or
anything else. Direct feedback welcome — especially on edge cases where
the classifier gets it wrong against your own repo.
```

## Engagement protocol (read before posting)

1. **Post the URL submission**, immediately post the first comment above.
2. **Stay engaged for 12 hours minimum.** First-hour comments shape the
   thread. Reply to every substantive comment in the first 2 hours; after
   that, every 30-60 min until the post falls off the front page.
3. **Acknowledge bugs publicly.** If someone says "I ran it against X
   and it misclassified," reply with "Filed as issue [link] — fixing in
   v0.1.3" rather than defending the call.
4. **Don't argue with the AI-skeptics.** If someone says "static analysis
   for portfolios is silly, just use ChatGPT," let it stand. The thread
   will adjudicate.
5. **No upvote begging in other channels.** HN detects and penalises.

## Common HN comment patterns and recommended responses

See `comment-prep.md` in this folder.
