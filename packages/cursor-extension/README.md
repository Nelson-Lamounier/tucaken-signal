# tucaken-signal-cursor

Cursor / VS Code extension wrapping the `tucaken-signal` CLI.

Adds three commands:

- **Tucaken: Analyze Repo Signal** — full markdown report
- **Tucaken: Preview as Recruiter** — 55-second recruiter simulation
- **Tucaken: Compare for Senior Role** — cross-stage scoring

Requires `tucaken-signal` available on `$PATH` (`npm i -g @tucaken/signal-cli`).

Each command opens results in a new editor tab for review.
