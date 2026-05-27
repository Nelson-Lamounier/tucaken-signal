# Validation

Three validation items from spec review must clear before locking v1.0.

## 1. AI-transparency pillar — engineer interviews (BLOCKED on humans)

Talk to **5 engineers** (mix of junior + senior). Question set in
`interviews/ai-transparency-question-set.md`. Capture answers in
`interviews/responses/<initials>.md`. Decision gate: if ≥3 of 5 say
`AI_USAGE.md` feels like overhead, restructure the pillar before
shipping (likely re-frame as opt-in suggestion rather than default-on
scoring penalty).

Cannot be automated. Tracked here so it isn't forgotten.

## 2. Stage-inference accuracy — labeled fixture set

Run `yarn validate:stage-inference`. Reads `stage-inference/fixtures.json`
(20–30 hand-labeled repos: URL + expected stage), clones each into a
scratch dir, runs the inference engine, computes accuracy.

**Decision gate:** if accuracy < 70%, disable auto-inference by default
and prompt the user instead (see spec open-question #3).

Current fixture file is a seed of 5 examples — extend before locking.

## 3. Recruiter preview mockups — virality sanity-check

`recruiter-preview-mocks/` contains static mock outputs of the preview
renderer against 3 real repo shapes (high-signal, medium-signal,
low-signal). Review with 2-3 engineers before locking the renderer
layout. If the mockup falls flat (i.e. it does not produce the
"hm, I want to share this" reaction), the feature needs rethinking.
