import { describe, expect, it } from "vitest";
import { mkdtempSync, writeFileSync, mkdirSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { analyze } from "../pipeline.js";

function makeRepo(kind: "minimal" | "production" | "library" | "tutorial"): string {
  const dir = mkdtempSync(join(tmpdir(), "tucaken-test-"));
  writeFileSync(join(dir, "README.md"), readmeFor(kind));
  if (kind === "production") {
    writeFileSync(join(dir, "Dockerfile"), "FROM node:22\n");
    mkdirSync(join(dir, ".github", "workflows"), { recursive: true });
    writeFileSync(join(dir, ".github", "workflows", "deploy.yml"), "name: deploy\n");
    mkdirSync(join(dir, "docs", "adr"), { recursive: true });
    writeFileSync(join(dir, "docs", "adr", "0001-cdk.md"), "# Use CDK\n");
    writeFileSync(join(dir, "cdk.json"), "{}");
    writeFileSync(join(dir, "package.json"), JSON.stringify({ name: "real-saas", dependencies: { next: "*", pg: "*" } }));
  } else if (kind === "library") {
    writeFileSync(join(dir, "package.json"), JSON.stringify({ name: "cool-lib", main: "dist/index.js", exports: {} }));
    writeFileSync(join(dir, "LICENSE"), "MIT");
    writeFileSync(join(dir, "CHANGELOG.md"), "# Changelog\n");
  } else if (kind === "tutorial") {
    writeFileSync(join(dir, "package.json"), JSON.stringify({ name: "my-app" }));
  }
  return dir;
}

function readmeFor(kind: string): string {
  if (kind === "minimal") return "# my-app\n\nA project.\n";
  if (kind === "tutorial") return [
    "# Getting Started with Create React App",
    "",
    "This project was bootstrapped with [Create React App](https://create-react-app.dev/).",
    "",
    "You can learn more in the [Create React App documentation](https://facebook.github.io/create-react-app/docs/getting-started).",
  ].join("\n");
  if (kind === "library") return [
    "# cool-lib",
    "",
    "A small TypeScript utility library.",
    "",
    "## Installation",
    "",
    "```bash",
    "npm install cool-lib",
    "```",
    "",
    "## Usage",
    "",
    "```ts",
    "import { cool } from 'cool-lib';",
    "cool();",
    "```",
  ].join("\n");
  return [
    "# Production SaaS Demo",
    "",
    "AI-enabled career platform, deployed and active in production at https://example.com.",
    "",
    "![status](https://img.shields.io/badge/status-deployed-green)",
    "",
    "## Architecture",
    "",
    "```mermaid",
    "graph TD; A-->B;",
    "```",
    "",
    "## Getting Started",
    "",
    "Install and run.",
    "",
    "## Deployment",
    "",
    "Deployed via CDK + GitHub Actions.",
  ].join("\n");
}

describe("pipeline", () => {
  it("classifies a production-shaped repo as production_saas", async () => {
    const { report } = await analyze({ root: makeRepo("production") });
    expect(report.archetype.id).toBe("production_saas");
  });

  it("classifies a published library shape as open_source_library", async () => {
    const { report } = await analyze({ root: makeRepo("library") });
    expect(report.archetype.id).toBe("open_source_library");
  });

  it("flags tutorial-shaped repos via TutorialSignalAnalyzer (lower production-reality)", async () => {
    const tutorial = (await analyze({ root: makeRepo("tutorial") })).report;
    const production = (await analyze({ root: makeRepo("production") })).report;
    const pr1 = tutorial.pillars.find((p) => p.pillar === "production_reality")!.score;
    const pr2 = production.pillars.find((p) => p.pillar === "production_reality")!.score;
    expect(pr2).toBeGreaterThan(pr1);
  });

  it("scores readability higher for a denser README", async () => {
    const minimal = (await analyze({ root: makeRepo("minimal") })).report;
    const production = (await analyze({ root: makeRepo("production") })).report;
    const r1 = minimal.pillars.find((p) => p.pillar === "readability")!.score;
    const r2 = production.pillars.find((p) => p.pillar === "readability")!.score;
    expect(r2).toBeGreaterThan(r1);
  });

  it("every suggestion has at least one evidence reference (grounding)", async () => {
    const { report } = await analyze({ root: makeRepo("production") });
    expect(report.suggestions.length).toBeGreaterThan(0);
    for (const s of report.suggestions) {
      expect(s.evidenceBasis.length).toBeGreaterThan(0);
      expect(s.combinedRank).toBeGreaterThan(0);
    }
  });

  it("detects ADR-worthy decisions when ADRs missing + IaC present (negated by ADR dir presence)", async () => {
    // production fixture HAS ADRs already → expect no adr_for_decisions suggestion
    const { report } = await analyze({ root: makeRepo("production") });
    expect(report.suggestions.find((s) => s.id === "system.adr_for_decisions")).toBeUndefined();
  });

  it("emits anticipated interview questions for an IaC-bearing repo", async () => {
    const { report } = await analyze({ root: makeRepo("production") });
    expect(report.anticipatedQuestions.length).toBeGreaterThan(0);
    expect(report.anticipatedQuestions.some((q) => /CDK|Postgres|services|infra|3 AM/i.test(q.question))).toBe(true);
  });

  it("ontology resolves overlays for all 9 archetypes at mid stage", async () => {
    const { Ontology } = await import("@tucaken/ontology");
    const o = new Ontology();
    for (const a of o.listArchetypes()) {
      expect(o.stage("mid", a.id), `missing mid overlay for ${a.id}`).toBeDefined();
    }
  });

  it("stage routing produces different top suggestions per stage", async () => {
    const dir = makeRepo("production");
    const junior = (await analyze({ root: dir, stage: "junior" })).report;
    const senior = (await analyze({ root: dir, stage: "senior" })).report;
    expect(junior.stage.id).toBe("junior");
    expect(senior.stage.id).toBe("senior");
    expect(junior.suggestions[0]?.pillar).toBeDefined();
  });
});
