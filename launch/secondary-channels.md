# Secondary channels — beyond HN

Order matters. Don't burst all of these in the same hour. Stagger over
24–48 hours so each channel has its own discovery moment.

## Order of posting

1. **HN Show HN** (T+0) — primary signal
2. **X/Twitter thread** (T+30 min) — driving traffic back to HN
3. **Lobsters** (T+2 hours) — if HN gains traction
4. **Reddit r/devops** (T+4 hours) — different audience
5. **Reddit r/cscareerquestions** (T+6 hours) — your actual target users
6. **MCP Discord** (T+1 day) — niche but high-conversion
7. **dev.to / Hashnode** (T+2 days) — long-form write-up
8. **Claude Code skill registry** (T+3 days) — when the registry opens

---

## 1. X/Twitter thread (post 30 min after HN)

Six tweets. Numbered. Plain language. Link to HN in the last one, not
the first (drives traffic both ways).

```
1/  I built a CLI that reads your GitHub repo the way a recruiter does
    in 55 seconds and tells you what's invisible above the fold.

    Local-first. No code uploaded. Deterministic.

    `npm install -g @tucaken/signal-cli`

2/  Why this specifically: 77% of hiring teams encounter AI-generated
    applications regularly in 2026. 49% of US hiring managers
    auto-dismiss résumés they suspect are AI-generated. The fallback
    signal — your GitHub repos — was supposed to fix this. But the
    depth is in the code and the 55-second reader is reading the README.

3/  Tucaken Signal scores your repo on 5 pillars:

    • Authenticity (commit history + AI fingerprints)
    • Readability (above-the-fold density)
    • System Thinking (architecture decision detection)
    • Production Reality (vs tutorial-shaped signals)
    • Stage Calibration (junior vs staff different recommendations)

4/  Differentiator from the LLM-pump GitHub scorers that shipped this year:

    • Local-first by default — your code never uploaded
    • Deterministic — same repo → same report
    • Stage-aware — junior/mid/senior/staff routing
    • Every suggestion cites a real file path

5/  Three surfaces:

    • CLI for any repo
    • Claude Code skill (`/tucaken-signal`)
    • MCP server (`claude mcp add tucaken-signal npx -y @tucaken/signal-mcp`)

    MIT. Ontology fork-extensible.

6/  Show HN here: [LINK TO HN THREAD]

    Direct feedback welcome — especially on archetypes / repos where the
    classifier gets it wrong against yours. Filed bugs go in v0.1.3.
```

---

## 2. Lobsters (~2 hours after HN, if HN ranking >50)

```
Title: Tucaken Signal: local-first portfolio analyzer scored across 5 hiring-signal pillars
URL:   https://github.com/Nelson-Lamounier/tucaken-signal
Tags:  releases programming javascript
```

Add a single-paragraph submission comment explaining the local-first
+ static-analysis angle. Lobsters audience values these specifically.
Don't cross-link to HN.

---

## 3. Reddit r/devops (~4 hours after HN)

**Title:** `Built a static analyzer that reads your GitHub repo the way a recruiter does (local-first, no LLM)`

**Body:**

```
Spent the last few months on this and just published it to npm.

It scores repos across 5 hiring-signal pillars (authenticity,
readability, system thinking, production reality, stage calibration),
classifies the archetype (9 archetypes × 4 career stages × 36 stage
overlays), and outputs evidence-grounded recommendations.

Differentiator vs the LLM-pump portfolio tools that shipped this year:

  - Local-first (no code uploaded)
  - Deterministic (same repo → same report)
  - Stage-aware (junior vs staff different recommendations)
  - Every suggestion cites a real file in your repo

CLI:    npm install -g @tucaken/signal-cli
Source: https://github.com/Nelson-Lamounier/tucaken-signal
MIT, ontology open at @tucaken/ontology.

Curious how this lands against actual production / infra repos. The
classifier identifies kubernetes-style operators, IaC-heavy repos,
multi-service monorepos correctly in my test set but edge cases will
surface.
```

---

## 4. Reddit r/cscareerquestions (~6 hours after HN)

**Title:** `I built a free CLI that audits your GitHub portfolio for the 2026 hiring market`

**Body:**

```
For context: recruiters spend ~55 seconds on a portfolio, 77% of
hiring teams encounter AI-generated applications, and the fallback
signal (your GitHub) often undersells you because depth is in code
and the 55-second reader is reading the README.

I built a CLI that reads any repo locally and tells you:
  - What a recruiter sees in 30 seconds vs 2 minutes vs deep dive
  - 5-15 evidence-grounded improvements (each cites a real file)
  - Stage-specific recommendations (junior advice differs from staff)
  - A draft for the AI usage disclosure many hiring teams now expect

Free, local-first, MIT.

  npm install -g @tucaken/signal-cli
  tucaken-signal /path/to/your/repo

Source: github.com/Nelson-Lamounier/tucaken-signal

Run it against your portfolio and see what your top recommendation is.
Happy to answer questions about the methodology.
```

---

## 5. MCP Discord / Cursor Discord (~1 day)

```
Just shipped an MCP server for portfolio analysis:

  claude mcp add tucaken-signal npx -y @tucaken/signal-mcp

Exposes analyze_local_repo (static analysis of any local path),
get_user_ontology_version, and (when authenticated to Tucaken)
list_projects / save_signal_suggestions for account integration.

Works from Claude Code, Cursor, Codex CLI, anything with MCP.

Source: github.com/Nelson-Lamounier/tucaken-signal
```

Drop in #mcp-servers or equivalent channel. Don't @ anyone.

---

## 6. dev.to / Hashnode long-form (~2 days)

**Title:** `Building a deterministic alternative to LLM-pump GitHub portfolio tools`

**Body outline:**

1. The 2026 hiring trust-signal problem (cite 77% / 49% / 71% stats)
2. Why LLM-pump scoring isn't the right shape (determinism, privacy, evidence)
3. The 9-archetype × 4-stage × 5-pillar structure
4. Show recruiter-preview output for 2-3 real repos
5. The 0.75 confidence gate as the load-bearing UX safety net
6. Open source decisions (MIT ontology, public source)
7. Install instructions
8. What's not there yet (v1.1 candidates)

Aim for ~1500 words. Crosspost from your blog if you have one.

---

## 7. Claude Code skill registry (~3 days)

If/when Anthropic opens the public skill registry:

```
Name:        tucaken-signal
Description: Analyze the current repository's portfolio trust-signal
             quality for hiring contexts. Generates evidence-grounded
             improvements calibrated to your target career stage.
Repo:        github.com/Nelson-Lamounier/tucaken-signal
Author:      Nelson-Lamounier
License:     MIT
```

Submit when the registry exists. Until then, the manual symlink install
documented in the SKILL.md is the path.

---

## Things to NOT do during launch window

- Don't post to multiple subreddits simultaneously (looks like spam)
- Don't tag specific influencers in tweets (looks desperate)
- Don't upvote your own HN post from secondary accounts (you'll get banned)
- Don't argue with critics in HN comments — let the thread arbitrate
- Don't post launch links in unrelated Discord servers
- Don't email contacts you haven't talked to in years
- Don't immediately respond to every comment — quality over quantity

## What to monitor

- HN ranking + comment count
- npm download stats: https://npmcharts.com/compare/@tucaken/signal-cli
- GitHub stars (don't refresh-spam; check 2-3x first day, then daily)
- GitHub issues filed
- Twitter/X engagement (don't reply-guy, but acknowledge thoughtful threads)

## After 48 hours

- Write a short retrospective (issues filed, lessons learned, what surprised you)
- Post to your dev.to as a follow-up
- Address the top 3 issues filed in v0.1.3
- Reach out personally to the 3-5 most thoughtful commenters with "thanks
  for the feedback — what would make this better for you?"

That last bullet is where the soft-beta cohort retroactively happens. The
launch attracts the audience; the personal follow-up converts them into
long-term users.
