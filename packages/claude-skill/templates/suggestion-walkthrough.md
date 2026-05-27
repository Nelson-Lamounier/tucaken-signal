# Template — Pass 5: Top suggestions walkthrough

Use this structure when presenting the top 5 suggestions from
`report.suggestions[]` (already sorted by `combinedRank` desc). Variables
in `{{double-braces}}` are filled from each suggestion object.

---

## Recommended format

```
Top {{N}} suggestions ({{N}} of {{suggestions.length}} total):

{{#each suggestions.slice(0, 5)}}
  {{@index + 1}}. [{{pillar.toUpperCase()}}]  {{title}}
     {{description.split('\n')[0]}}
     Evidence: {{evidenceBasis.map(e => e.path || e.kind).join(", ")}}
     {{#if draftAvailable}}→ I can generate a draft for this. Say "draft #{{@index + 1}}" or use the ID: `{{id}}`{{/if}}

{{/each}}

To see all {{suggestions.length}} (not just top 5), say "show all
suggestions" or run `tucaken-signal --verbose .` directly.
```

## Highlight rules

- Always show **5** by default. Show more only if user asks for "all"
  or "more."
- Show the **pillar tag in brackets** so the user sees which pillar
  each suggestion lifts.
- Show the **evidence paths** — this is the differentiator from
  generic advice. "Add a diagram" is generic. "Add a diagram —
  evidence: infra/cdk.json shows your CDK work" is specific.
- If `draftAvailable: true`, surface that explicitly with both a
  conversational way to invoke ("draft #2") and the canonical ID for
  CLI use.
- If `evidenceBasis.length === 0` (rare — most suggestions have
  evidence), drop the Evidence line for that suggestion.

## When fewer than 5 suggestions exist

If `report.suggestions.length < 5`, show all of them. Don't pad with
filler. A short list of well-grounded suggestions beats a padded list
of weak ones.

## What NOT to do

- Don't hallucinate suggestion IDs. Cross-check against
  `report.suggestions[].id` before quoting.
- Don't fabricate descriptions. Use the `description` field verbatim.
- Don't claim `draftAvailable: true` for a suggestion where it's
  false — running `draft <id>` on a non-draftable suggestion errors
  out.
- Don't reorder. The CLI's ranking
  (`pillarWeight × impact / max(effort, 0.1)`) is intentional;
  the top is the top.

## Example output

```
Top 5 suggestions (5 of 11 total):

  1. [SYSTEM_THINKING]  No architecture diagram
     Score 10/100 on system_thinking. Addressing this gap would lift the pillar.
     Evidence: pillar_score
     → I can generate a Mermaid diagram draft. Say "draft #1".

  2. [SYSTEM_THINKING]  No ADRs
     Score 10/100 on system_thinking. Addressing this gap would lift the pillar.
     Evidence: pillar_score

  3. [SYSTEM_THINKING]  Document 1 undocumented architectural decisions as ADRs
     Detected: AWS CDK (over Terraform, Pulumi, CloudFormation). Each is interview-question fuel.
     Evidence: infra/cdk.json
     → I can generate ADR drafts for this. Say "draft #3" or use ID: `system.adr_for_decisions`

  4. [SYSTEM_THINKING]  Document build/CI perf story (cache hit rate, cold vs warm, hermeticity)
     Staff monorepo signal: you've measured and optimized the dev-loop tax this shape imposes.
     Evidence: README.md

  5. [READABILITY]  No demo link above the fold
     Score 85/100 on readability. Addressing this gap would lift the pillar.
     Evidence: pillar_score

To see all 11 (not just top 5), say "show all suggestions" or run
`tucaken-signal --verbose .` directly.
```
