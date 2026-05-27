# Template — Pass 4: Recruiter-glance presentation

Use this structure for the "what a recruiter sees in 55 seconds"
summary. Variables in `{{double-braces}}` are filled from
`report.recruiterGlance`.

---

## Recommended format

```
What a recruiter sees in 55 seconds:

  Visible (the depth that surfaces above the fold):
{{#each recruiterGlance.visible}}
    → {{this}}
{{/each}}

  Invisible (depth that exists in the repo but won't be read):
{{#each recruiterGlance.invisible}}
    → {{this}}
{{/each}}
```

If `recruiterGlance.visible` is empty:
```
What a recruiter sees in 55 seconds:

  ⚠ Nothing surfaces above the fold.
  The README hero is missing a pitch / status / live link.
  Recruiter likely scrolls past in <10 seconds.
```

## Highlight rules

- Quote the visible/invisible items **verbatim**. Don't paraphrase.
- If any of the invisible items mention a count (`"7 architectural
  decisions"`), preserve the count — it's specific and quotable.
- After the visible/invisible block, always suggest running
  `tucaken-signal preview` for the literal 55-second simulation
  if the user hasn't seen it.

## What NOT to do

- Don't editorialize ("this looks bad" / "this is impressive").
  The CLI doesn't editorialize; the agent shouldn't either.
- Don't add items to the lists that aren't in the JSON output.
- Don't drop the count from "N architectural decisions" — the
  specificity is the value.

## Example output

```
What a recruiter sees in 55 seconds:

  Visible (the depth that surfaces above the fold):
    → pitch: "Production multi-service AI/ML platform on AWS Bedrock. Powers the article"
    → live URL in README
    → IaC presence (aws-cdk)

  Invisible (depth that exists in the repo but won't be read):
    → architecture
    → AI usage transparency
    → 1 architectural decisions

Want to see the literal 55-second simulation? Run:
`tucaken-signal preview .` (add `--animate` for paced reveal)
```
