# Template — apply confirmation flow

`apply` writes into the user's repo. Always preview, confirm, then write.
Three steps, never collapsed.

---

## Step 1 — list draftable suggestions

```bash
tucaken-signal apply <path>
```

Prints the draftable suggestion ids + titles. Present them to the user and
ask which one they want.

## Step 2 — preview (does NOT write)

```bash
tucaken-signal apply <path> --id=<chosen-id> --dry-run
```

Show the user the full draft content. Then ask explicitly:

> "This is the draft for `<id>`. Want me to write it into the repo?
>  I can write it on a new branch (`--branch=docs/signal-improvements`)
>  or directly. Say the word and I'll apply it."

Do NOT proceed to step 3 without an explicit yes.

## Step 3 — write (only after explicit OK)

```bash
tucaken-signal apply <path> --id=<chosen-id> --branch=docs/signal-improvements
```

Options to offer the user:
- `--branch=<name>` — write on a new branch (recommended; keeps main clean)
- `--no-commit` — write the file but don't commit (user reviews first)
- neither — writes + commits on the current branch

After writing, report exactly what happened: the file path written, the
branch created (if any), whether it committed.

## Critical

- Never run step 3 without step 2 + explicit user OK.
- Never push to a remote. `apply` writes locally only.
- If the user is on a sensitive/work repo, recommend `--branch` +
  `--no-commit` so they review before anything lands.

## What NOT to do

- Don't auto-pick a suggestion id for the user. They choose.
- Don't skip `--dry-run`. The preview is the consent gate.
- Don't claim a suggestion is draftable if `apply <path>` didn't list it.
