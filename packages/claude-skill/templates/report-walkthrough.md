# Template — presenting the scan report

After `tucaken-signal scan <path>` writes the report, read the generated
`.tucaken-signal/reports/<date>-<repo>.md` and present it to the user in
this shape. Don't dump the whole file — surface the load-bearing parts and
point at the file for the rest.

---

## Recommended format

```
Scanned {{repo_name}} → `{{archetype.id}}`, targeting `{{stage.id}}`.

Overall: {{overallScore}}/100

Weakest pillar (where the recommendations cluster):
  {{lowest_pillar_label}} — {{lowest_pillar_score}}/100 ({{lowest_pillar_note}})

What a recruiter sees in 55 seconds:
  Visible:
{{#each recruiterGlance.visible}}    • {{this}}
{{/each}}  Invisible (depth that won't be read):
{{#each recruiterGlance.invisible}}    • {{this}}
{{/each}}

Top suggestions:
{{#each suggestions.slice(0,5)}}  {{@index+1}}. {{title}}  (id: {{id}}, draftable: {{draftAvailable}})
       {{evidence_paths}}
{{/each}}

Full report (stage comparison, all suggestions, interview questions):
  {{report_path}}
```

## Rules

- **Lead with the weakest pillar** — it's where the recommendations
  concentrate. Compute it as the lowest-scoring entry in `pillars[]`.
- **Quote recruiterGlance verbatim.** Don't editorialize. The visible/
  invisible split is the most user-resonant part.
- **Show suggestion ids.** The user needs them for `apply --id=<id>`.
- **Cite evidence paths.** "Add a diagram" is generic; "Add a diagram —
  evidence: infra/cdk.json" is the differentiator.
- **Surface the skill-evidence inventory.** The report has a
  "Skill-evidence inventory" section — the asset-finder lens (what the repo
  already demonstrates, scored skill × recruiter). Call out the top 2-3
  high-priority **undocumented** assets — these are the highest-leverage
  things to write up, the inverse of the gap-finder pillar scores. This is
  the kb-discovery capability merged into scan.
- **Point at the report file**, don't paste the whole thing. The stage
  comparison + full suggestion list + interview questions live there.

## Gate handling

If the scan printed a confidence warning, you are NOT done — go back and
ask the user their target stage, then re-run `scan --stage=<chosen>`
before presenting anything.

## What NOT to do

- Don't invent pillar names (exactly 5: authenticity, readability,
  system_thinking, production_reality, stage_calibration).
- Don't fabricate suggestion ids — they must exist in the report.
- Don't present results from a scan that tripped the confidence gate
  without first resolving the stage with the user.
