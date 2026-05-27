# AI-Transparency Pillar — 2026 Web Research

**Date:** 2026-05-27
**Purpose:** Substitute for engineer-interview validation (deferred to v1.1
post-launch). Synthesizes published 2026 data on AI disclosure in hiring
and OSS to either confirm, refute, or reshape the AI-transparency
pillar's framing before public ship.

## Decision

**Ship the pillar at reduced default weight, framed as opt-in
recommendation rather than scoring penalty.** Web evidence supports the
broader thesis ("transparent AI disclosure becoming a credibility
expectation") but does not specifically validate Tucaken's exact framing
for personal-portfolio disclosure. Post-launch acceptance-rate metric
becomes the real validation signal; interviews happen in v1.1 once
real users are generating real signal.

## Evidence supporting the thesis

### Hiring-side: recruiters do scrutinize AI-generated content

- **49% of US hiring managers auto-dismiss résumés they suspect are
  AI-generated.** Source: AI Resume Statistics 2026.
- **62% reject AI résumés that lack personalization.** Same source.
- **74% of hiring managers have encountered AI-generated content in
  applications; 58% are concerned.** Source: AI Resume Statistics 2026.
- **77% of teams regularly encounter AI-generated or AI-assisted
  applications. 47% have updated interview techniques to focus on
  deeper probing.** Source: Hiring Trends Report 2026 (techrseries).
  *This matches the stat the spec cited — it's a real survey, not
  a fabrication.*

**Key insight from the same source:** *"Generic AI prose triggers
rejection — AI use itself does not."* This is precisely Tucaken's
framing: transparent AI disclosure differentiates the user from the
"generic AI prose" cohort that auto-dismissal targets.

### OSS-side: AI usage policies are appearing in production repos

Concrete examples found in active 2026 OSS projects:

- **metacall/gsoc-2026/AI-USAGE-POLICY.md** — Google Summer of Code
  participant disclosure protocol. "AI as productivity accelerator;
  usage must be explicitly disclosed in all relevant contexts."
- **kyverno/community/AI_USAGE_POLICY.md** — PR-level disclosure via
  commit trailer lines identifying the AI tool.
- **processing/processing4/AI_USAGE_POLICY.md** — restrictive
  ("AI tools only assistively, not generatively") + includes an
  AGENTS.md telling AI assistants to act as guides not code generators.
- **GitHub itself updated its AI usage policy in 2026** (April 2026
  Copilot interaction data policy change) — governance becoming
  platform-normalized.

This proves the *infrastructure* for AI disclosure is appearing
organically in 2026 OSS culture.

### Hiring-side: the resume is structurally weakening as a signal

- **Only 37% of employers view credentials and learning history among
  the most reliable indicators of talent.** Source: spec-cited.
- **41% are actively moving away from resume-first hiring; 10% have
  largely replaced resumes with skills-based assessments.** Same.
- **Only 26% of applicants trust AI to evaluate them fairly.**
  Source: AI Recruitment Statistics 2026.

This validates the broader Tucaken thesis: the resume signal is
collapsing and engineers need alternative credibility-projecting
artifacts.

## Evidence the spec missed / important nuance

### Most existing AI_USAGE.md examples are *contributor policies*, not *personal disclosures*

All three production examples found (metacall, kyverno, processing) are
policies governing what *contributors to a project* can do with AI.
They are not engineers disclosing how *they themselves* built the
project.

**Tucaken's framing is the latter — novel, not unprecedented.** The
infrastructure is there (people understand "AI_USAGE.md" as a
filename), but the specific application (personal portfolio disclosure)
is unvalidated by direct precedent.

This is the gap that engineer interviews would close. Web research
cannot.

### The "AI slop" problem in OSS is real and adjacent

> *"AI slop is a large quantity of low-quality — and oftentimes
> inaccurate — contributions that don't add value to the project. They
> make it harder than ever to maintain projects."* (GitHub blog,
> Open Source 2026 outlook)

This creates a competing framing: if engineers associate "AI in code"
with "AI slop," documenting AI use could backfire (users assume the
project IS slop). Tucaken's framing — "transparent AI use beats hidden
AI use" — pre-supposes the recruiter draws the same line, which is
not directly tested.

### Compliance, not credibility, is driving most current AI disclosure

The legal-side data (Colorado AI Act, California/Illinois 2026 laws)
shows the regulatory pressure is on *employers* using AI for hiring,
not on *engineers* using AI for code. The "compliance overhead" frame
the spec worried about *is* the dominant frame in legal/HR discourse.

Risk: if engineers read Tucaken's recommendation through that frame,
it lands as "your tool wants me to fill out a compliance form,"
which is the worst possible outcome the spec gate explicitly warned
about.

## What this validates and what it doesn't

| Claim | Web-research verdict |
|---|---|
| Recruiters distrust unmarked AI content in 2026 | ✅ Supported (49% / 58% / 77%) |
| The resume is collapsing as a credibility signal | ✅ Supported (37% / 41%) |
| AI_USAGE.md is becoming an organic OSS convention | ⚠️ Partially — as contributor policy, not personal disclosure |
| Personal portfolio disclosure increases recruiter trust | ❌ Not directly tested |
| The compliance-overhead reaction is a real risk | ⚠️ Adjacent evidence suggests yes |

## Resulting product decisions

Apply BEFORE public ship:

1. **Reduce default authenticity-pillar weight when AI_USAGE.md absent.**
   Drop the `-5` score penalty in `scoreAuthenticity()` when AI
   fingerprints are detected but no doc exists. Keep the +25 bonus
   when the doc IS present (positive reinforcement, not negative).
2. **Reframe the AI_USAGE suggestion.** Currently emits "Add an AI
   Usage section or AI_USAGE.md" with description leading with
   "AI fingerprints detected." Reframe as opportunity, not gap:
   "Add an AI Usage section to differentiate from generic-AI applications
   (49% of recruiters auto-dismiss those in 2026)."
3. **Track acceptance rate post-launch.** Add to opt-in telemetry the
   metric: `ai_usage_doc_suggestion_acceptance_rate` over 7-day window.
   If <30% after 100+ users, the framing is wrong. If >60%, web
   research is retroactively validated.
4. **Defer engineer interviews to v1.1 once real users are generating
   signal.** The pack (`validation/interviews/`) stays in place. Run
   it once we have 50+ paying or active users to recruit from.

## Sources

- [AI Resume Statistics 2026: 72 Verified Stats on AI Hiring, ATS, and Bias](https://jobcannon.io/blog/ai-resume-statistics-2026)
- [Hiring Trends Report 2026: Study Finds AI Is Accelerating the Decline of the Resume](https://techrseries.com/artificial-intelligence/hiring-trends-report-2026-study-finds-ai-is-accelerating-the-decline-of-the-resume-as-employers-demand-more-authentic-signals-of-talent/)
- [AI Recruitment Trends & Statistics In 2026 (MSH)](https://www.talentmsh.com/insights/ai-in-recruitment)
- [121 AI in Recruitment and Hiring Statistics for 2026 (Novoresume)](https://novoresume.com/career-blog/AI-in-hiring-and-recruitment-statistics)
- [77 AI Recruitment Statistics for 2026 (Azumo)](https://azumo.com/artificial-intelligence/ai-insights/ai-recruitment-statistics)
- [2026 Outlook: Artificial Intelligence (Greenberg Traurig)](https://www.gtlaw.com/en/insights/2025/12/2026-outlook-artificial-intelligence)
- [AI-Assisted Hiring Faces a New Compliance Landscape in 2026 (Manatt)](https://www.manatt.com/insights/newsletters/employment-law/ai-assisted-hiring-faces-a-new-compliance-landscape-in-2026-california-and-illinois-put-discriminatory-impact-and-transparency-front-and-center)
- [What to expect for open source in 2026 (GitHub Blog)](https://github.blog/open-source/maintainers/what-to-expect-for-open-source-in-2026/)
- [Predictions For Open Source in 2026 (ActiveState)](https://www.activestate.com/blog/predictions-for-open-source-in-2026-ai-innovation-maintainer-burnout-and-the-compliance-crunch/)
- [metacall/gsoc-2026 — AI-USAGE-POLICY.md](https://github.com/metacall/gsoc-2026/blob/main/AI-USAGE-POLICY.md)
- [kyverno/community — AI_USAGE_POLICY.md](https://github.com/kyverno/community/blob/main/AI_USAGE_POLICY.md)
- [processing/processing4 — AI_USAGE_POLICY.md](https://github.com/processing/processing4/blob/main/AI_USAGE_POLICY.md)
- [GitHub Copilot Interaction Data Usage Policy 2026 (NewTechyTips)](https://www.newtechytips.com/github-copilot-interaction-data-usage-policy-2026/)
