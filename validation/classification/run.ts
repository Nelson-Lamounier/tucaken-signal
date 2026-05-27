#!/usr/bin/env tsx
import { readFileSync, mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { execFileSync } from "node:child_process";
import { analyze } from "../../packages/signal-cli/src/pipeline.js";
import { parseGithubUrl } from "../../packages/signal-cli/src/github/GitHubSignalsClient.js";

const WITH_GITHUB = process.argv.includes("--with-github") || !!process.env.GITHUB_TOKEN;

interface Fixture { url: string; expectedArchetype: string; expectedStage: string; _note?: string }

const here = dirname(fileURLToPath(import.meta.url));
const fixtures = JSON.parse(readFileSync(join(here, "fixtures.json"), "utf8")).fixtures as Fixture[];

const URL_OK = /^https:\/\/github\.com\/[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+(\.git)?$/;
const ARCH_GATE = 0.90;
const STAGE_GATE = 0.80;
const CLONE_TIMEOUT_MS = 45_000;

// CLI flags: --limit=N (first N), --filter=<substring>, --archetype=<id>
const flags = parseFlags(process.argv.slice(2));

async function run(): Promise<void> {
  const selected = filterFixtures(fixtures, flags);
  console.log(`Running ${selected.length} of ${fixtures.length} fixtures${flags.limit ? ` (--limit=${flags.limit})` : ""}\n`);

  let archCorrect = 0, stageCorrect = 0, total = 0;
  const archWrong: string[] = [];
  const stageWrong: string[] = [];

  for (const f of selected) {
    if (f.url.startsWith("https://github.com/example/")) {
      console.log(`SKIP  ${f.url} (placeholder)`);
      continue;
    }
    if (!URL_OK.test(f.url)) {
      console.error(`SKIP  ${f.url} (rejected by URL allowlist)`);
      continue;
    }
    const dir = mkdtempSync(join(tmpdir(), "classify-fixture-"));
    const t0 = Date.now();
    try {
      execFileSync("git", ["clone", "--depth", "1", "--filter=blob:none", "--no-tags", f.url, dir],
        { stdio: "ignore", timeout: CLONE_TIMEOUT_MS });
      const ghRepo = WITH_GITHUB ? parseGithubUrl(f.url) ?? undefined : undefined;
      const { report } = await analyze({ root: dir, withGithub: WITH_GITHUB, githubRepo: ghRepo });
      total++;
      const archOk = report.archetype.id === f.expectedArchetype;
      const stageOk = report.stage.id === f.expectedStage;
      if (archOk) archCorrect++;
      else archWrong.push(`${pad(f.url)}  expected=${f.expectedArchetype}  got=${report.archetype.id}`);
      if (stageOk) stageCorrect++;
      else stageWrong.push(`${pad(f.url)}  expected=${f.expectedStage}  got=${report.stage.id}  (conf=${report.stage.confidence})`);
      const marks = `${archOk ? "✓" : "✗"}arch ${stageOk ? "✓" : "✗"}stage`;
      const dt = ((Date.now() - t0) / 1000).toFixed(1);
      console.log(`${marks}  ${pad(f.url)}  → ${report.archetype.id} / ${report.stage.id}  (${dt}s)`);
    } catch (e) {
      console.error(`ERROR ${f.url}  ${(e as Error).message.split("\n")[0]}`);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  }

  const archAcc = total ? archCorrect / total : 0;
  const stageAcc = total ? stageCorrect / total : 0;
  console.log(`\nArchetype accuracy: ${archCorrect}/${total} = ${(archAcc * 100).toFixed(1)}%  (gate ${(ARCH_GATE * 100).toFixed(0)}%)`);
  console.log(`Stage accuracy:     ${stageCorrect}/${total} = ${(stageAcc * 100).toFixed(1)}%  (gate ${(STAGE_GATE * 100).toFixed(0)}%)\n`);

  if (archWrong.length) {
    console.log("Archetype misses:");
    for (const w of archWrong) console.log(`  ${w}`);
    console.log("");
  }
  if (stageWrong.length) {
    console.log("Stage misses:");
    for (const w of stageWrong) console.log(`  ${w}`);
    console.log("");
  }

  const archPass = archAcc >= ARCH_GATE || total === 0;
  const stagePass = stageAcc >= STAGE_GATE || total === 0;
  process.exit(archPass && stagePass ? 0 : 1);
}

interface Flags { limit?: number; filter?: string; archetype?: string }

function parseFlags(args: string[]): Flags {
  const f: Flags = {};
  for (const a of args) {
    if (a.startsWith("--limit=")) f.limit = Number(a.split("=")[1]);
    else if (a.startsWith("--filter=")) f.filter = a.split("=")[1];
    else if (a.startsWith("--archetype=")) f.archetype = a.split("=")[1];
  }
  return f;
}

function filterFixtures(all: Fixture[], f: Flags): Fixture[] {
  let out = all;
  if (f.archetype) out = out.filter((x) => x.expectedArchetype === f.archetype);
  if (f.filter) out = out.filter((x) => x.url.includes(f.filter!));
  if (f.limit) out = out.slice(0, f.limit);
  return out;
}

function pad(s: string): string { return s.padEnd(60); }

run().catch((e) => { console.error(e); process.exit(1); });
