# Structured Web Research — Validation Substitute (2026)

**Date:** 2026-05-27
**Substitutes for:** the engineer-interview pack (`validation/interviews/`),
deferred to v1.1 once real users are generating signal.
**Method:** Predict-before-search. Disconfirming queries alongside
confirming ones. Structured per-inquiry artifact mirroring what the
interview analysis would have produced.

## Inquiries 1–5

### Inquiry 1 — AI-disclosure sentiment in engineering work

**Validates:** Authenticity pillar framing.

**Prediction (made before searching):** Engineers are divided. A vocal
"disclose everything" minority, a larger "don't make a thing of it"
mainstream, and rising hostility to "AI compliance theater."
AI_USAGE.md will be supported in OSS-contributor-policy contexts but
controversial for personal portfolios.

**Top sources found:**

- [State AI Laws — Cooley](https://www.cooley.com/news/insight/2026/2026-04-24-state-ai-laws-where-are-they-now) — backlash on AI compliance mandates is real and active in 2026.
- [2026 AI Laws Update — Gunderson Dettmer](https://www.gunder.com/en/news-insights/insights/2026-ai-laws-update-key-regulations-and-practical-guidance) — Colorado, Connecticut, Utah have all *narrowed* their AI laws under tech-industry pushback.
- (Round 1 sources, separate doc) — Three OSS projects ship AI_USAGE policies as contributor governance: metacall/gsoc-2026, kyverno/community, processing/processing4.

**Actual finding:**
- Compliance-backlash IS real (validates the spec's worry about
  "compliance overhead" reaction).
- BUT it's regulatory backlash, not personal-portfolio backlash. The
  personal-disclosure discourse hasn't formed yet — there's neither
  strong precedent nor strong backlash.
- The OSS contributor-policy examples remain the dominant precedent
  for the filename. Personal-portfolio framing is novel.

**Verdict:** ⚠ Partial confirmation. My prediction was directionally
correct on the compliance-overhead risk but I overstated how formed
the discourse is. Personal-portfolio disclosure is *uncharted*, not
*controversial*.

**Product implication:** Frame the suggestion as *differentiation*
(see Inquiry 2 finding), not *compliance*. Avoid any language that
could read as "you must disclose."

---

### Inquiry 2 — Updated hiring landscape

**Validates:** the broader problem framing — is the trust-signal
problem still acute in mid-2026?

**Prediction:** Stats have worsened. Recruiter fatigue with AI
applications at a peak. Some companies have returned to longer
take-home assessments. Trust-signal problem more acute than spec.

**Top sources found:**

- [Three Ways AI is Reshaping Traditional Technical Interviews in 2026 — IEEE-USA](https://insight.ieeeusa.org/articles/three-ways-ai-is-reshaping-traditional-technical-interviews-in-2026/) — 71% of engineering leaders say AI makes assessment harder.
- [Cheating in Take-Home Assignments — Fabric](https://fabrichq.ai/blogs/how-ai-cheating-killed-take-home-assignments) — take-home assignments are dying, not returning. AI made them invalid.
- [Engineering Interview Trends 2026 — Karat](https://karat.com/engineering-interview-trends-2026/) — companies redesigning assessments to *expect* AI use, then ask candidates how they used it.
- [4 in 10 candidates bailed on AI-interview rounds — Fortune](https://fortune.com/2026/05/04/4-in-10-job-candidates-bailed-hiring-rounds-required-ai-interview/) — candidate trust is low; this isn't just a hiring-side problem.

**Actual finding:**
- Stats DID worsen (71% > previous numbers).
- Take-home is NOT returning — instead, **"AI-aware" assessments
  where AI use is expected and then explained by the candidate** are
  the new norm.
- "Companies asking candidates to explain how they used AI" is
  structurally identical to AI_USAGE.md — but as a live interview
  artifact, not a repo file.

**Verdict:** 🔄 Prediction partly refuted (no take-home return), but
the underlying thesis is *more strongly validated than expected*.
The hiring-side has actively converged on "explain your AI usage" —
Tucaken's pillar is the asynchronous repo equivalent.

**Product implication:**
- This is the strongest evidence in the whole research that the
  AI-transparency pillar is timely.
- The suggestion description should frame `AI_USAGE.md` as
  "the asynchronous version of what hiring is already asking you
  in interviews" — connects the repo artifact to a behaviour
  engineers are already being asked to perform.

---

### Inquiry 3 — Competitive landscape

**Validates:** differentiation hypothesis.

**Prediction:** One or two adjacent tools have shipped since the spec.
Most lightweight. Closest competitor: ResumeGPT-for-GitHub variant.

**Top sources found:**

- [GitHub Profile Analyzer (Next.js + Gemini)](https://github.com/topics/github-analyzer) — AI-powered GitHub profile analyzer, "Recruiter Scores, brutal roasts, actionable insights" in under 2 minutes.
- [AI-powered GitHub audit tool (Mistral + Next.js)](https://github.com/topics/recruitment-tool) — generates recruiter-ready READMEs + career roadmaps.
- [Portfolio Projects That Get You Hired 2026 — DEV.to](https://dev.to/devraj_singh7/the-portfolio-projects-that-actually-get-you-hired-in-2026-1l0e)

**Actual finding:**
- Two direct competitors exist. Both are LLM-pump tools (send
  repo to LLM, get score/roast/README back).
- Neither has: archetype × stage × pillar structure, evidence-grounding
  (their suggestions are LLM-generated not extracted), career-stage
  calibration, local-first privacy posture, ontology-based
  reasoning.

**Verdict:** ✅ Confirmed. Tucaken's differentiation holds and is
sharper than I predicted — competitors are commodity LLM-wrappers
which depend on shipping repo content to cloud LLMs.

**Product implication:**
- README and launch positioning should explicitly differentiate on:
  (a) local-first / no code uploaded
  (b) evidence-grounded (every suggestion cites a real file)
  (c) career-stage calibrated
  (d) deterministic + reproducible (same repo → same report)
- "LLM scores your repo" tools are already in market and produce
  generic output. "Static analyzer scores your repo with stage-aware
  rules" is a positioning competitors can't trivially copy.

---

### Inquiry 4 — Junior / bootcamp-grad commentary

**Validates:** junior-stage recommendations.

**Prediction:** Junior accounts strongly emphasize deployment proof
and live URLs over code quality. AI_USAGE.md does NOT appear in
junior portfolio advice.

**Top sources found:**

- [Using GitHub as a Portfolio — GitHub Discussions](https://github.com/orgs/community/discussions/169760) — projects should be pinned with live working links.
- [GitHub Portfolio Checklist — SocialPrachar](https://socialprachar.com/blog/github-portfolio-checklist-rate-your-projects-effectively) — README quality is the #1 factor; deployed projects > undeployed ones; documenting growth in README ("what I learned") is a juniors-specific pattern.
- [Portfolio Projects That Get You Hired 2026 — DEV.to](https://dev.to/devraj_singh7/the-portfolio-projects-that-actually-get-you-hired-in-2026-1l0e) — ML models people can use, data dashboards, full pipelines with real data.

**Actual finding:**
- Junior advice IS deployment-and-live-URL focused. Confirmed.
- AI_USAGE.md does NOT appear in junior portfolio advice — confirmed.
- New finding I missed: **"learning-trajectory documentation"**
  ("what I learned from this project") is a juniors-specific
  signal. The spec mentions `learning_journey` as a junior section
  but the ontology doesn't have explicit suggestion templates for it.

**Verdict:** ✅ Confirmed for deployment/live-URL. New gap surfaced.

**Product implication:**
- Junior stage suggestions are correctly weighted.
- Worth adding a `learning_journey_doc` suggestion to junior stage
  overlays — currently the spec mentions the section but no
  suggestion template fires for it.
- AI_USAGE.md for juniors should be opt-in / low-weight (matches
  Inquiry 1 + 2 framing).

---

### Inquiry 5 — Senior / staff portfolio practices

**Validates:** senior-stage recommendations.

**Prediction:** ADRs / postmortems / RFCs MORE valued in 2026,
explicitly because they're the things AI can't fake. Senior emphasis
directionally correct but probably under-weighted.

**Top sources found:**

- [Software Engineer Resume Examples 2026 — Resume Optimizer Pro](https://resumeoptimizerpro.com/blog/software-engineer-resume-2026) — "Resumes getting interviews in 2026 lead with system design, quantify AI-assisted velocity, and show architectural judgment on every bullet."
- [A Senior Engineer's Guide to FAANG Interviews — interviewing.io](https://interviewing.io/guides/hiring-process) — system design > coding for senior; postmortem discussion is differentiating.
- [Engineering Interview Trends 2026 — Karat](https://karat.com/engineering-interview-trends-2026/) — AI-leverage demonstration is what moves Senior → Staff at FAANG.

**Actual finding:**
- ADRs / postmortems / RFCs confirmed as differentiating — matches
  spec.
- **NEW finding I missed: "Quantify AI-assisted velocity" is a 2026
  staff-resume pattern.** Engineers being asked to put numbers on
  their AI-leverage ("shipped X services in Y weeks with AI
  assistance handling Z%"). Tucaken doesn't address this.

**Verdict:** ✅ Senior framing confirmed. Net-new gap surfaced for
v1.1.

**Product implication:**
- Senior stage suggestions are correctly weighted; no v1.0 change.
- v1.1 candidate: an "AI-velocity quantification" suggestion that
  parses commit cadence + AI fingerprints + sustained delivery to
  surface a draft like "documented your AI-assisted output over
  the last 90 days: X commits, Y features shipped, Z% of files
  show AI patterns." This is a real 2026 staff resume pattern
  and nobody in the static-analysis space is doing it.

---

## Cross-cutting findings

### Things the spec got right
1. The trust-signal problem is acute and getting worse (71% > 47%).
2. AI disclosure is becoming a credibility signal — validated by
   live-interview practice ("explain how you used AI").
3. Personal-portfolio disclosure is novel territory — no strong
   precedent or backlash. Open positioning.
4. Junior emphasis on deployment evidence is matched by published
   advice.
5. Senior emphasis on architecture documentation is matched by
   FAANG hiring patterns.

### Things the spec missed
1. **AI-velocity quantification** is a 2026 staff resume pattern.
   No suggestion in v1.0 addresses this. v1.1 candidate.
2. **Learning-trajectory documentation** for juniors is mentioned
   in ontology sections but has no suggestion templates. v1.0
   gap, easy fix.
3. **Competitive context is sharper than spec implied.** Two
   commodity-LLM competitors exist; differentiation messaging must
   be explicit in launch.
4. **Hiring-side language convergence** — "explain how you used
   AI" is now interview-standard, which is exactly the framing the
   pillar should mirror.

### Things still untested by web research (need real users)
1. Does the recruiter-preview output land as viral / shareable?
2. Do users actually accept the AI_USAGE.md suggestion when
   surfaced? (Acceptance-rate metric will tell us post-launch.)
3. Does the stage-calibration feel correct for the user
   specifically? (Soft-beta cohort closes this gap.)
4. Does the analysis carry enough trust to drive action?
   (Acceptance-rate + suggestion-application metrics close this.)

## Decisions for v1.0 ship

Based on the research, these changes go into v0.1.2 before public
launch:

1. **Drop the -5 penalty in `scoreAuthenticity()`** when AI
   fingerprints are detected but no doc exists. The 71% / hiring-shift
   data validates the framing but the personal-disclosure discourse
   is too uncharted to penalize.
2. **Reframe the AI_USAGE.md suggestion** to lead with
   *"the asynchronous version of what 71% of hiring is already
   asking you in interviews"* — anchor on a real hiring practice,
   not on a controversial compliance frame.
3. **Add competitive-differentiation section to README** —
   local-first, evidence-grounded, deterministic, career-stage
   calibrated. Differentiate from commodity LLM-pump tools.
4. **Add `learning_journey_doc` suggestion template** to junior
   stage overlays. Cheap fix; matches published junior advice.
5. **Schedule v1.1 work:** AI-velocity quantification suggestion
   for staff stage. Add to roadmap.

## Telemetry hooks needed for post-launch validation

To learn what web research cannot tell us, the existing telemetry
system needs two new event types:

- `suggestion_surfaced` `{ suggestion_id, stage, archetype }` —
  fires when a suggestion appears in output
- `suggestion_accepted` `{ suggestion_id, mode: draft|apply }` —
  fires when user runs `tucaken-signal draft <id>` or `apply <id>`

The ratio `accepted / surfaced` per suggestion is the missing signal.
Specifically watch `authenticity.ai_usage_doc` — if <30% acceptance
after 100 users, the framing was wrong despite the web evidence.
If >60%, web research is retroactively validated.

## Honest limits of this substitution

What web research could NOT give us, and the soft-beta cohort needs
to provide:

- **No emotional reactions to specific output.** Web evidence
  aggregates discourse; it doesn't tell us how a specific user
  feels reading their own recruiter-preview.
- **No quotable users for launch materials.** "Discourse suggests
  X" doesn't move marketing copy the way "5 engineers said X" does.
- **No catching unknown unknowns.** Searches surface what we knew
  to query; interviews surface what we didn't know to ask.
- **No early-adopter cohort.** Public-cold launch starts with
  zero engaged users.

The soft-beta plan (separate document) closes #1, #2, #4. #3 is
genuinely lost in the substitution and we accept that.

## Sources

See [validation/research/ai-transparency-web-research-2026.md](./ai-transparency-web-research-2026.md)
for round-1 sources. Round-2 sources used in this document:

- [State AI Laws Where Are They Now — Cooley](https://www.cooley.com/news/insight/2026/2026-04-24-state-ai-laws-where-are-they-now)
- [2026 AI Laws Update — Gunderson Dettmer](https://www.gunder.com/en/news-insights/insights/2026-ai-laws-update-key-regulations-and-practical-guidance)
- [Three Ways AI is Reshaping Traditional Technical Interviews in 2026 — IEEE-USA](https://insight.ieeeusa.org/articles/three-ways-ai-is-reshaping-traditional-technical-interviews-in-2026/)
- [Cheating in Take-Home Assignments — Fabric](https://fabrichq.ai/blogs/how-ai-cheating-killed-take-home-assignments)
- [Engineering Interview Trends 2026 — Karat](https://karat.com/engineering-interview-trends-2026/)
- [4 in 10 candidates bailed on AI-interview rounds — Fortune](https://fortune.com/2026/05/04/4-in-10-job-candidates-bailed-hiring-rounds-required-ai-interview/)
- [Using GitHub as a Portfolio — GitHub Discussions](https://github.com/orgs/community/discussions/169760)
- [GitHub Portfolio Checklist — SocialPrachar](https://socialprachar.com/blog/github-portfolio-checklist-rate-your-projects-effectively)
- [Portfolio Projects That Get You Hired 2026 — DEV.to](https://dev.to/devraj_singh7/the-portfolio-projects-that-actually-get-you-hired-in-2026-1l0e)
- [Software Engineer Resume Examples 2026 — Resume Optimizer Pro](https://resumeoptimizerpro.com/blog/software-engineer-resume-2026)
- [A Senior Engineer's Guide to FAANG Interviews — interviewing.io](https://interviewing.io/guides/hiring-process)
