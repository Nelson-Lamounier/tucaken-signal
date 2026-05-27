# Template — Pass 3: Pillar score presentation

Use this structure when presenting the analysis report's overall +
pillar breakdown to the user. Variables in `{{double-braces}}` are
filled from the parsed `TrustSignalReport` JSON.

---

## Recommended format

```
{{repo_name}} — analyzed as `{{archetype.id}}` (confidence {{archetype.confidence}})
Stage target: `{{stage.id}}` ({{stage.inferred ? "inferred from: " + stage.explanation : "user-specified"}}{{stage.confidence ? ", confidence " + stage.confidence : ""}})

Overall trust signal: {{overallScore}}/100

Pillar breakdown:

  {{pillar_bar_visual}}  Authenticity        {{pillars.authenticity.score}}/100  {{pillars.authenticity.notes[0] || ""}}
  {{pillar_bar_visual}}  Readability         {{pillars.readability.score}}/100  {{pillars.readability.notes[0] || ""}}
  {{pillar_bar_visual}}  System Thinking     {{pillars.system_thinking.score}}/100  {{pillars.system_thinking.notes[0] || ""}}
  {{pillar_bar_visual}}  Production Reality  {{pillars.production_reality.score}}/100  {{pillars.production_reality.notes[0] || ""}}
  {{pillar_bar_visual}}  Stage Calibration   {{pillars.stage_calibration.score}}/100  {{pillars.stage_calibration.notes[0] || ""}}
```

Where `{{pillar_bar_visual}}` is the same `●●●○○` visual the CLI produces
(filled = `Math.round(score / 20)`, empty = `5 - filled`).

## Highlight rules

- If a pillar is **≥ 80**, lead with it as a strength (one sentence).
- If a pillar is **≤ 30**, surface it prominently — the gap will dominate
  the recommendations in Pass 5.
- If `stage.inferred && stage.confidence < 0.75` — you should not be in
  Pass 3 yet. Go back to Pass 1 and ask the user for stage.

## What NOT to do

- Don't invent pillar names. There are exactly 5: authenticity,
  readability, system_thinking, production_reality, stage_calibration.
- Don't paraphrase the notes — they were generated from real signals.
- Don't add commentary about pillar scores you didn't read from the JSON
  (no "this is good for a junior engineer" without the data backing it).

## Example output

```
ai-applications — analyzed as `monorepo` (confidence 0.85)
Stage target: `staff` (inferred from: IaC present; deployment workflow present; tests present; monorepo workspace; large codebase; very large codebase; API docs, confidence 1)

Overall trust signal: 63/100

Pillar breakdown:

  ●●●●○  Authenticity        95/100  strong human-judgment signals in code
  ●●●●○  Readability         85/100  no demo link above the fold
  ●○○○○  System Thinking     10/100  no architecture diagram
  ●●●●●  Production Reality  90/100
  ●●●○○  Stage Calibration   60/100  modulator pillar; see compare-stages
```
