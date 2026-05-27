import type { AboveFoldResult } from "./AboveFoldAnalyzer.js";
import type { ReadmeDensityResult } from "./ReadmeDensityAnalyzer.js";

export interface ScanTimingResult {
  thirtySecond: number;
  twoMinute: number;
  deepDive: number;
}

export function estimateScanTiming(
  fold: AboveFoldResult | null,
  density: ReadmeDensityResult | null,
  hasDocsDir: boolean,
  hasAdrs: boolean
): ScanTimingResult {
  let thirty = 0;
  if (fold) {
    if (fold.firstHeadingIsTitle) thirty += 20;
    if (fold.hasPitchParagraph) thirty += 30;
    if (fold.hasStatusSignal) thirty += 15;
    if (fold.hasDemoLink) thirty += 15;
    if (fold.hasTechBadge) thirty += 10;
    if (fold.topHeadings.length >= 3) thirty += 10;
  }
  let two = thirty;
  if (density) {
    if (density.hasImages) two += 10;
    if (density.diagramPresent) two += 20;
    if (density.headingCount >= 5) two += 10;
    if (density.wordsPerHeading > 30 && density.wordsPerHeading < 200) two += 10;
  }
  let deep = two;
  if (hasDocsDir) deep += 15;
  if (hasAdrs) deep += 20;

  return {
    thirtySecond: clamp(thirty),
    twoMinute: clamp(two),
    deepDive: clamp(deep),
  };
}

function clamp(n: number): number { return Math.max(0, Math.min(100, n)); }
