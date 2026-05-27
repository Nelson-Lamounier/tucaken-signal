# Tucaken Signal

Portfolio trust-signal analyzer for engineering work (2026 hiring market).
See [`tucan-signal-spec-2.md`](tucan-signal-spec-2.md) for the full design.

The tool reads a repository, classifies it across 9 archetypes and 4
career stages, scores it on 5 hiring-signal pillars, and generates
evidence-grounded recommendations that make invisible engineering depth
visible in a 55-second recruiter scan.

## Install

```bash
npm install -g @tucaken/signal-cli@latest
```

Or run any command with:

```bash
tucaken-signal .                        # full analysis of cwd
tucaken-signal preview .                # 55-second recruiter simulation
tucaken-signal preview . --animate      # paced reveal
tucaken-signal compare-stages .         # same repo across junior/mid/senior/staff
tucaken-signal --format=md .            # markdown report
tucaken-signal draft <suggestion-id>    # accept-ready draft
tucaken-signal apply <id> --branch=docs/signal-improvements   # write draft + commit
```

### Claude Code skill

```bash
mkdir -p ~/.claude/skills
git clone https://github.com/Nelson-Lamounier/tucaken-signal /tmp/_t \
  && cp -r /tmp/_t/packages/claude-skill ~/.claude/skills/tucaken-signal \
  && rm -rf /tmp/_t
# Then in any Claude Code session: /tucaken-signal
```

### MCP server (Claude Code, Cursor, Codex CLI)

```bash
claude mcp add tucaken-signal npx -y @tucaken/signal-mcp
```

### From source (dev)

```bash
yarn install && yarn build
yarn cli .
```

## How this differs from other GitHub portfolio analyzers

Two commodity tools shipped in 2026 that send your repo to a cloud LLM
and return a "recruiter score" with generic suggestions. Tucaken Signal
is structurally different:

| | Commodity LLM analyzers | Tucaken Signal |
|---|---|---|
| **Where your code goes** | Uploaded to a cloud LLM | Stays on your machine (local-first) |
| **How suggestions are generated** | LLM creative writing | Static analysis + evidence extraction from your repo |
| **Reproducibility** | Different output every run | Same repo → same report (deterministic) |
| **Career-stage awareness** | None — one size fits all | Junior / mid / senior / staff routing with different rubrics |
| **Structure** | Free-form prose | 9 archetypes × 4 stages × 5 hiring-signal pillars |
| **Evidence grounding** | "We suggest you add X" | "Your repo at `path/to/file` shows X — here's a draft" |
| **Privacy posture** | Code uploaded; subject to vendor TOS | Default offline; raw code never leaves your machine |
| **Cost to run** | LLM tokens per analysis | Free (no LLM required) |
| **Optional GitHub signals** | n/a | Opt-in `--with-github` for stage signal lift (BYOK, direct to api.github.com) |

The trade-off is honest: commodity tools give you LLM-quality prose
recommendations at the cost of shipping your code to a third party.
Tucaken Signal gives you deterministic, evidence-grounded analysis with
your code never leaving your machine, at the cost of less prose flair.

## The 0.75 confidence gate is the load-bearing UX safety net

Rule-based stage inference on real repositories hits **~45% raw
accuracy** (see [`validation/RESULTS.md`](validation/RESULTS.md)). That
number does not translate into bad UX in the field, because the CLI
will not silently accept low-confidence inferences:

```text
⚠ Stage inference confidence 0.43 below gate (0.75).
  Inferred: junior (inferred from: tests present)
  Re-run with --stage=junior|mid|senior|staff to lock target, or --yes to accept.
```

This means **accuracy ≠ reliability** for this tool. When the
classifier is unsure, it stops and asks; when it's sure (confidence
≥ 0.75), it's almost always right. Production_saas and devops_infra
repos at mid-and-up hit the gate consistently; pure libraries and ML
research repos correctly trip below it because their stage is
genuinely ambiguous from static signals alone.

The Claude Code skill ([`packages/claude-skill/SKILL.md`](packages/claude-skill/SKILL.md))
enforces the same rule: when confidence is low, the host agent asks
the user rather than running with the inferred value.

## What ships (v1.0)

| Area | Status |
|---|---|
| 9 archetypes + 36 stage overlays (4 × 9) | ✅ all in `tucaken-ontology` |
| 5-pillar scoring (authenticity / readability / system-thinking / production-reality / stage-calibration) | ✅ all wired |
| Decisive-signal RepoClassifier | ✅ 7-rule pipeline + score fallback |
| StageInferenceEngine + 0.75 confidence gate | ✅ |
| Analyzers: AiUsage, CommitFingerprint, HumanJudgment, Architecture, DecisionDetector, AnticipatedQuestions, TutorialSignal, Maintenance | ✅ |
| Renderers: terminal / json / markdown / recruiter-preview (with `--animate`) | ✅ |
| Commands: `analyze` / `preview` / `compare-stages` / `draft` / `apply` / `ontology` / `config` / `telemetry` / `sync` | ✅ |
| LLM bridge (Null / BYOK / IDE-bridge) | ✅ opt-in via `--with-llm` |
| `@tucaken/signal-mcp` MCP server (5 tools) | ✅ |
| Claude Code skill adapter | ✅ |
| Cursor / VS Code extension | ✅ |
| Validation harnesses (classification + stage-inference) | ✅ runnable, gated |

Spec body items not in v1.0:

- Multi-repo organisation audits (different product)
- Continuous on-save analysis (v2+)
- Custom user-defined archetypes / stages (v2+)
- Translation beyond English (v1 is English-only)
- AI-content detection as a feature (deliberately out of scope)

## Privacy posture (load-bearing)

- **Default offline.** No network calls without explicit user action.
- **Raw code never sent off-machine** — even in authenticated Tucaken
  mode, only structured findings + file paths + snippet excerpts
  ≤200 chars cross the wire.
- **Telemetry opt-in** (default opt-out). Events contain
  `{cli_version, ontology_version, archetype, stage, suggestion_count, command_used}`
  — no paths, no content.
- **LLM draft generation** requires `--with-llm` AND either
  `ANTHROPIC_API_KEY` (BYOK) or `TUCAKEN_IDE_BRIDGE=1`. Never on by
  default.
- **`apply` never pushes to a remote.** Writes locally, optionally
  commits, that's it.

## Validation status

| Set | Sample | Accuracy | Gate | Status |
|---|---|---|---|---|
| Archetype classification | 46 OSS repos | ~62% (post-relabel) | ≥90% | ❌ below |
| Stage classification | 46 OSS repos | ~55% (post-relabel) | ≥80% | ❌ below |
| Stage-inference (OSS only) | 23 | ~45% | ≥70% | ❌ below |

These are honest numbers on a public-OSS-only fixture set. See
[`validation/RESULTS.md`](validation/RESULTS.md) for full detail and
the load-bearing distinction between accuracy and the 0.75 gate.

Validation items still requiring human work:

1. **AI-transparency pillar engineer interviews** — `validation/interviews/`.
2. **Junior/mid stage fixtures** — placeholders in
   `validation/stage-inference/fixtures.json` awaiting real
   colleague/private repos. The OSS sample is staff/senior-heavy by
   construction.
3. **Recruiter-preview virality review** — three mocks in
   `validation/recruiter-preview-mocks/` for engineer feedback.

## Layout

```text
packages/
  ontology/            # @tucaken/ontology — YAML data + TS loader (MIT)
  signal-cli/          # @tucaken/signal-cli — analyzer + CLI
  claude-skill/        # @tucaken/signal-claude-skill — SKILL.md adapter
  mcp-server/          # @tucaken/signal-mcp — MCP server (5 tools)
  cursor-extension/    # tucaken-signal-cursor — VS Code / Cursor extension
validation/
  RESULTS.md           # accuracy run history + triage learnings
  classification/      # 50-fixture archetype + stage harness
  stage-inference/     # 25-fixture stage-only harness
  interviews/          # human-loop validation question set
  recruiter-preview-mocks/  # virality sanity-check mocks
```

## Distribution (planned)

```bash
npm install -g @tucaken/signal-cli
tucaken-signal
```

Claude Code skill install (planned):

```bash
/skills install tucaken-signal
```

The ontology lives under MIT in `packages/ontology/data/`. Community
contributions to archetypes and stages are welcomed; quality is
maintainer-gated.
