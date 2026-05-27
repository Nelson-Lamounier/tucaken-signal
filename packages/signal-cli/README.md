# @tucaken/signal-cli

Portfolio trust-signal analyzer for engineering work in the 2026 hiring
market. Classifies repos across 9 archetypes × 4 career stages, scores
5 hiring-signal pillars, and generates evidence-grounded recommendations.

```bash
npm install -g @tucaken/signal-cli
tucaken-signal .                          # analyze current repo
tucaken-signal preview .                  # 55-second recruiter simulation
tucaken-signal compare-stages .           # cross-stage scoring
tucaken-signal draft <id> --output=...    # accept-ready draft for a suggestion
tucaken-signal apply <id> --branch=...    # write draft + commit
```

## Optional GitHub signals (BYOK)

```bash
export GITHUB_TOKEN="$(gh auth token)"
tucaken-signal --with-github .
```

Adds contributor count, stars, release cadence to stage inference.
Lifts stage accuracy ~+22-30pp on OSS. Tucaken never sees the token.

## Privacy

Local-first. Default offline. No telemetry unless explicitly opted in
via `tucaken-signal telemetry opt-in`. Raw code never sent off-machine.

## Library use

```ts
import { analyze } from "@tucaken/signal-cli";

const { report } = await analyze({ root: "/path/to/repo", stage: "senior" });
console.log(report.overallScore);
```

## Links

- Full spec: <https://github.com/tucaken/signal>
- Validation results: <https://github.com/tucaken/signal/blob/main/validation/RESULTS.md>
- MIT licensed
