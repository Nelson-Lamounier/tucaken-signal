#!/usr/bin/env tsx
// Scans ~/Desktop/portfolio/ for local repos, runs analyze() on each,
// surfaces an inferred-stage report so the user can mark which ones are
// junior/mid-shaped and pull them into the fixture set.
import { readdirSync, statSync, existsSync } from "node:fs";
import { join } from "node:path";
import { homedir } from "node:os";
import { analyze } from "../packages/signal-cli/src/pipeline.js";

const ROOT = join(homedir(), "Desktop", "portfolio");
const SKIP = new Set(["tucaken-skill", "general-docs", "blogs", "portfolio-doc", "test-repo"]);

interface Row {
  repo: string;
  archetype: string;
  stage: string;
  confidence: number;
  overall: number;
  fileCount: number;
}

async function main(): Promise<void> {
  const repos = readdirSync(ROOT).filter((name) => {
    if (SKIP.has(name) || name.startsWith(".")) return false;
    try { return statSync(join(ROOT, name)).isDirectory(); } catch { return false; }
  });

  console.log(`Scanning ${repos.length} repos under ${ROOT}\n`);
  const rows: Row[] = [];
  for (const name of repos) {
    const root = join(ROOT, name);
    if (!existsSync(join(root, ".git")) && !existsSync(join(root, "package.json")) && !existsSync(join(root, "pyproject.toml"))) {
      console.log(`SKIP  ${name}  (no obvious project markers)`);
      continue;
    }
    try {
      const { report } = await analyze({ root });
      rows.push({
        repo: name,
        archetype: report.archetype.id,
        stage: report.stage.id,
        confidence: report.stage.confidence,
        overall: report.overallScore,
        fileCount: 0,
      });
      console.log(`OK    ${name.padEnd(28)}  → ${report.archetype.id.padEnd(20)} / ${report.stage.id.padEnd(8)} conf=${report.stage.confidence}  overall=${report.overallScore}`);
    } catch (e) {
      console.error(`ERROR ${name}  ${(e as Error).message.split("\n")[0]}`);
    }
  }

  console.log("\n=== Candidates for fixtures (sorted by stage, then overall) ===");
  rows.sort((a, b) => {
    const stageOrder = ["junior", "mid", "senior", "staff"];
    const c = stageOrder.indexOf(a.stage) - stageOrder.indexOf(b.stage);
    return c !== 0 ? c : a.overall - b.overall;
  });
  console.log("");
  for (const r of rows) {
    console.log(`  ${r.stage.padEnd(7)} ${r.archetype.padEnd(20)} overall=${String(r.overall).padStart(3)}  → ${r.repo}`);
  }

  console.log("\n=== Suggested fixture additions ===");
  console.log("Junior candidates (stage=junior or confidence < 0.6):");
  for (const r of rows.filter((x) => x.stage === "junior" || x.confidence < 0.6)) {
    console.log(`  - "$HOME/Desktop/portfolio/${r.repo}"  // inferred: ${r.stage}, conf ${r.confidence}`);
  }
  console.log("\nMid candidates (stage=mid):");
  for (const r of rows.filter((x) => x.stage === "mid")) {
    console.log(`  - "$HOME/Desktop/portfolio/${r.repo}"  // inferred: ${r.stage}, conf ${r.confidence}`);
  }
}

main().catch((e) => { console.error(e); process.exit(1); });
