#!/usr/bin/env tsx
import { readFileSync, mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { execFileSync } from "node:child_process";
import { analyze } from "../../packages/signal-cli/src/pipeline.js";
import { parseGithubUrl } from "../../packages/signal-cli/src/github/GitHubSignalsClient.js";

const WITH_GITHUB = process.argv.includes("--with-github") || !!process.env.GITHUB_TOKEN;

interface Fixture { url: string; expectedStage: string; notes?: string }

const here = dirname(fileURLToPath(import.meta.url));
const fixtures = JSON.parse(readFileSync(join(here, "fixtures.json"), "utf8")).fixtures as Fixture[];

const URL_OK = /^https:\/\/github\.com\/[A-Za-z0-9_.\-]+\/[A-Za-z0-9_.\-]+(\.git)?$/;

async function run(): Promise<void> {
let correct = 0;
let total = 0;
const wrong: string[] = [];

for (const f of fixtures) {
  if (f.url.startsWith("https://github.com/example/")) {
    console.log(`SKIP  ${f.url} (seed placeholder)`);
    continue;
  }
  if (!URL_OK.test(f.url)) {
    console.error(`SKIP  ${f.url} (rejected by URL allowlist)`);
    continue;
  }
  const dir = mkdtempSync(join(tmpdir(), "stage-fixture-"));
  try {
    execFileSync("git", ["clone", "--depth", "50", "--filter=blob:none", f.url, dir], { stdio: "ignore" });
    const ghRepo = WITH_GITHUB ? parseGithubUrl(f.url) ?? undefined : undefined;
    const { report } = await analyze({ root: dir, withGithub: WITH_GITHUB, githubRepo: ghRepo });
    total++;
    if (report.stage.id === f.expectedStage) {
      correct++;
      console.log(`OK    ${f.url}  inferred=${report.stage.id}`);
    } else {
      wrong.push(`${f.url}  expected=${f.expectedStage}  got=${report.stage.id}`);
      console.log(`WRONG ${f.url}  expected=${f.expectedStage}  got=${report.stage.id}`);
    }
  } catch (e) {
    console.error(`ERROR ${f.url}`, (e as Error).message);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

const acc = total ? correct / total : 0;
const mode = WITH_GITHUB ? "+github" : "static-only";
console.log(`\nAccuracy [${mode}]: ${correct}/${total} = ${(acc * 100).toFixed(1)}%`);
console.log(`Gate: ≥70% needed to ship auto-inference as default.\n`);
if (wrong.length) {
  console.log("Wrong:");
  for (const w of wrong) console.log(`  ${w}`);
}
process.exit(acc < 0.7 && total > 0 ? 1 : 0);
}

run().catch((e) => { console.error(e); process.exit(1); });
