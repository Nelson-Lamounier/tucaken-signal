# Sample AI_USAGE.md (shown to interviewees in Q4)

This is the artifact the tool would generate when an engineer accepts
the AI-transparency suggestion. We generated it against the
`ai-applications` repo on 2026-05-27.

Show this to the interviewee on screen-share. Ask:

> "If you opened a GitHub repo and saw this `AI_USAGE.md` at the
> root, what's your first reaction?"

---

```markdown
# AI Usage

This project was built with significant AI-coding-tool assistance
(Claude Code primarily). In 2026 the credibility move is transparent
disclosure rather than denial — this document is that disclosure.

## Where AI was used

- Scaffolding of new services in `applications/*` followed by manual
  review and integration into the shared CDK constructs.
- Boilerplate for repository / mapper / DTO layers across services
  using the shared hexagonal pattern in `shared/rds/interfaces/` and
  `shared/rds/implementations/`.
- Documentation drafts (this file included), then edited for accuracy.
- SQL migration boilerplate — structure was AI-drafted, schema
  decisions are mine.
- Test fixtures and smoke-test runners.

## Where AI suggestions were overridden

- **CDK topology.** Per-app stacks under a shared base, not one
  monolith. Constraint: per-app blast radius for deploys.
- **Database choice.** Postgres + hexagonal repository pattern over
  the AI-suggested document store. Reason: relational queries dominate.
- **Auth / authz.** Rewritten manually because the first AI pass was
  too permissive on cross-service token reuse.

## What was manually verified

- All security-sensitive paths
- Every SQL migration before it reached the bootstrap pipeline
- All production deployment configuration
- Smoke tests + parity reports

## How to interpret this disclosure

AI-assisted does not mean AI-authored. Every architectural decision
in this codebase was made by me. The AI assisted with making those
decisions easier to express in code.
```

---

## Things to listen for

If the interviewee says:

- *"This is way too much detail"* → overhead reaction
- *"I wouldn't trust this — it could all be lies"* → cynicism reaction
- *"Smart. I'd actually be more confident in this engineer."* → win reaction
- *"I'd skip past it"* → invisibility reaction
- *"This feels like the new corporate compliance form"* → biggest red flag

Note which one (or which combination) shows up.
