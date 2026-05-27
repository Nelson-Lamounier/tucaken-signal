#!/usr/bin/env tsx
// Local-fixture stage-inference harness — reads local paths instead of
// cloning. Use after editing fixtures-local.json with your ground-truth
// stage labels.
import { readFileSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { analyze } from "../../packages/signal-cli/src/pipeline.js";

interface Fixture { path: string; expectedStage: string; notes?: string }

const here = dirname(fileURLToPath(import.meta.url));
const fixtures = JSON.parse(readFileSync(join(here, "fixtures-local.json"), "utf8")).fixtures as Fixture[];

async function run(): Promise<void> {
  let correct = 0;
  let total = 0;
  const wrong: string[] = [];

  for (const f of fixtures) {
    if (!existsSync(f.path)) {
      console.error(`SKIP  ${f.path} (does not exist)`);
      continue;
    }
    try {
      const { report } = await analyze({ root: f.path });
      total++;
      if (report.stage.id === f.expectedStage) {
        correct++;
        console.log(`OK    ${f.path}  inferred=${report.stage.id} (conf=${report.stage.confidence})`);
      } else {
        wrong.push(`${f.path}  expected=${f.expectedStage}  got=${report.stage.id} (conf=${report.stage.confidence})`);
        console.log(`WRONG ${f.path}  expected=${f.expectedStage}  got=${report.stage.id}`);
      }
    } catch (e) {
      console.error(`ERROR ${f.path}  ${(e as Error).message.split("\n")[0]}`);
    }
  }

  const acc = total ? correct / total : 0;
  console.log(`\nLocal-fixtures accuracy: ${correct}/${total} = ${(acc * 100).toFixed(1)}%`);
  if (wrong.length) {
    console.log("\nWrong:");
    for (const w of wrong) console.log(`  ${w}`);
  }
  process.exit(0);
}

run().catch((e) => { console.error(e); process.exit(1); });
