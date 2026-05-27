import type { EvidenceMap } from "../../types.js";

export interface AiUsageResult {
  docPresent: boolean;
  docPath?: string;
  fingerprintConfidence: number;
  reasons: string[];
}

export function analyzeAiUsage(evidence: EvidenceMap): AiUsageResult {
  const reasons: string[] = [];
  let conf = 0;

  const readme = evidence.files.readme;
  if (readme) {
    const c = readme.content;
    if (/\bHere'?s? (a|the) (brief|complete|comprehensive|detailed)\b/i.test(c)) {
      conf += 0.2; reasons.push("formulaic README phrasing");
    }
    if ((c.match(/\bsimply\b|\bjust\b/gi) ?? []).length > 4) {
      conf += 0.1; reasons.push("frequent filler adverbs");
    }
    const bulletCount = (c.match(/^\s*-\s/gm) ?? []).length;
    if (bulletCount > 12) {
      conf += 0.1; reasons.push("dense bulleted scaffolding");
    }
  }

  if (evidence.metrics.fileCount && evidence.metrics.fileCount > 30) {
    conf += 0.1;
    reasons.push("substantial codebase (some files likely AI-assisted in 2026)");
  }

  return {
    docPresent: !!evidence.files.aiUsageDoc,
    docPath: evidence.files.aiUsageDoc,
    fingerprintConfidence: round(Math.min(1, conf)),
    reasons,
  };
}

function round(n: number): number { return Math.round(n * 100) / 100; }
