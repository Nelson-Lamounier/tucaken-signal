# Template — Confirm-before-apply flow

The two-step pattern for any user request to apply a suggestion to
their repo. NEVER run `tucaken-signal apply <id>` without showing the
draft first and getting explicit user OK.

---

## Step A — Show the draft (read-only)

```bash
tucaken-signal draft <suggestion-id>
```

Capture the output. It's a markdown blob the CLI generated based on
the suggestion's template + repo evidence.

Present to the user:

```
Here's the proposed content for {{suggestion.title}} — this will be
written to `{{draft.filename}}`. Review before I write it:

------------------------------------------------------------------
{{draft.content}}
------------------------------------------------------------------

Want me to:
  (a) Write it to the repo as-is (`apply` it)
  (b) Write it to a new branch first (`apply --branch=<name>`)
  (c) Save to a side path you'll review out-of-tree (`draft --output=<path>`)
  (d) Skip — you'll customize before applying

Reply with a/b/c/d. If (b), also tell me the branch name.
```

## Step B — Apply only on explicit confirmation

The user must say something equivalent to "yes apply" or "(a)" or
"go ahead" or "do it." Vague language like "looks ok" or "sure" is
NOT confirmation — ask again with the explicit options.

When confirmed:

```bash
# Option (a) — apply to current branch
tucaken-signal apply <suggestion-id>

# Option (b) — apply on a new branch
tucaken-signal apply <suggestion-id> --branch=<name>

# Option (c) — write to a side path
tucaken-signal draft <suggestion-id> --output=<path>
```

After apply, confirm to user:

```
Wrote {{draft.filename}} to {{branch ? "branch " + branch : "current branch"}}.
{{if committed}}Committed locally.{{/if}}

You should:
1. Review the diff (`git diff` or open in your editor)
2. Customize the {{count}} placeholder sections ({{<!-- ... --> markers}})
3. If happy, push: `git push`{{if branch}} -u origin {{branch}}{{/if}}

Tucaken Signal did NOT push to remote — that's your call.
```

## Refusal patterns

If the user asks to apply without seeing the draft:

```
I'll show you the draft first — `apply` is irreversible (well, it writes
files; recoverable with git but worth being explicit). 30 seconds to read
the proposed content, then we apply or revise.
```

If the user is on a sensitive repo (production code, employer repo,
client work):

```
Before I apply this to a repo that looks like {{employer/client/prod
context}}, I want to flag: tucaken-signal apply writes a real file. For
sensitive repos, the safer flow is:

  tucaken-signal draft {{suggestion-id}} --output=/tmp/tucaken-draft.md

Then you review out-of-tree and copy in manually if it lands. Want to
do it that way instead?
```

## What NOT to do

- **Never combine show + apply in one step.** Always two-step.
- **Never auto-commit + push.** Apply writes locally; user pushes.
- **Never apply to a repo without a clean working tree.** If
  `git status --short` shows unstaged changes, warn the user first.
- **Never apply on `main` / `master` without offering `--branch`.**
  Even if user said "apply," remind them of the branch option for
  main branches.

## Example interaction

User: "Apply suggestion #3"

Agent: Runs Step A (`tucaken-signal draft system.adr_for_decisions`),
shows the draft, asks for a/b/c/d.

User: "b — branch name docs/adr-backfill"

Agent: Runs `tucaken-signal apply system.adr_for_decisions
--branch=docs/adr-backfill`, confirms with the post-apply block.
