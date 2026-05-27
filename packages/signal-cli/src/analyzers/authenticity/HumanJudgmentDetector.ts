import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import type { EvidenceMap } from "../../types.js";

export interface HumanJudgmentResult {
  whyNotComments: number;
  todoFixmeWithPersonality: number;
  opinionatedNames: number;
  styleShifts: number;
  examples: { kind: string; path: string; snippet: string }[];
  confidence: number;
}

const IGNORE = new Set(["node_modules", ".git", "dist", "build", ".next", ".yarn", ".venv", "__pycache__"]);
const MAX_FILES = 200;
const SCAN_EXT = /\.(ts|tsx|js|jsx|py|go|rs|rb|java)$/;

export function detectHumanJudgment(root: string, _evidence: EvidenceMap): HumanJudgmentResult {
  const out: HumanJudgmentResult = {
    whyNotComments: 0, todoFixmeWithPersonality: 0, opinionatedNames: 0, styleShifts: 0,
    examples: [], confidence: 0,
  };

  let scanned = 0;
  for (const abs of walk(root, MAX_FILES)) {
    if (!SCAN_EXT.test(abs)) continue;
    if (scanned >= MAX_FILES) break;
    scanned++;
    const rel = relative(root, abs);
    let content = "";
    try { content = readFileSync(abs, "utf8"); } catch { continue; }

    const whyNot = content.match(/\/\/.*\b(why not|instead of|rather than|we chose|we don't use)\b/gi) ?? [];
    if (whyNot.length) {
      out.whyNotComments += whyNot.length;
      if (out.examples.length < 5) out.examples.push({ kind: "why-not comment", path: rel, snippet: whyNot[0]!.slice(0, 120) });
    }

    const personality = content.match(/\/\/.*\b(TODO|FIXME|HACK|XXX)\b[^\n]{30,}/g) ?? [];
    if (personality.length) {
      out.todoFixmeWithPersonality += personality.length;
      if (out.examples.length < 5) out.examples.push({ kind: "TODO with personality", path: rel, snippet: personality[0]!.slice(0, 120) });
    }

    // Idiosyncratic but reasonable: short personal names ("Nelson's") or non-corporate phrasing
    const opinion = content.match(/\b(my|nelson'?s|the team's|legacy)\b[^.\n]{5,40}/gi) ?? [];
    if (opinion.length) out.opinionatedNames += opinion.length;
  }

  // Confidence: any signal at all is a human fingerprint
  const total = out.whyNotComments + out.todoFixmeWithPersonality + out.opinionatedNames;
  out.confidence = total === 0 ? 0 : Math.min(1, total / 10);
  return out;
}

function walk(root: string, max: number): string[] {
  const out: string[] = [];
  const stack: string[] = [root];
  while (stack.length && out.length < max) {
    const cur = stack.pop()!;
    let entries: string[] = [];
    try { entries = readdirSync(cur); } catch { continue; }
    for (const name of entries) {
      if (IGNORE.has(name)) continue;
      const abs = join(cur, name);
      let st;
      try { st = statSync(abs); } catch { continue; }
      if (st.isDirectory()) stack.push(abs);
      else out.push(abs);
      if (out.length >= max) break;
    }
  }
  return out;
}
