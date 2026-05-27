import type { EvidenceMap } from "../../types.js";

export interface ReadmeDensityResult {
  headingCount: number;
  hasCodeBlocks: boolean;
  hasImages: boolean;
  hasBadges: boolean;
  wordsPerHeading: number;
  diagramPresent: boolean;
}

export function analyzeReadmeDensity(evidence: EvidenceMap): ReadmeDensityResult | null {
  const readme = evidence.files.readme;
  if (!readme) return null;
  const c = readme.content;
  const headings = (c.match(/^#{1,6}\s+/gm) ?? []).length;
  const words = evidence.metrics.readmeWords ?? 0;
  return {
    headingCount: headings,
    hasCodeBlocks: /```/.test(c),
    hasImages: /!\[[^\]]*\]\([^)]+\)/.test(c),
    hasBadges: /img\.shields\.io|badgen\.net/.test(c),
    wordsPerHeading: headings ? Math.round(words / headings) : words,
    diagramPresent: !!evidence.signals.has_architecture_diagram,
  };
}
