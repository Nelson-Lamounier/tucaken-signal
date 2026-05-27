import type { EvidenceMap } from "../../types.js";

export interface AboveFoldResult {
  firstHeadingIsTitle: boolean;
  hasPitchParagraph: boolean;
  pitch?: string;
  hasStatusSignal: boolean;
  hasDemoLink: boolean;
  hasTechBadge: boolean;
  topHeadings: string[];
}

const FOLD_LINES = 50;

export function analyzeAboveFold(evidence: EvidenceMap): AboveFoldResult | null {
  const readme = evidence.files.readme;
  if (!readme) return null;
  const fold = readme.lines.slice(0, FOLD_LINES);
  const text = fold.join("\n");
  const headings = fold.filter((l) => /^#{1,6}\s+/.test(l)).slice(0, 3).map((l) => l.replace(/^#+\s+/, "").trim());

  const firstHeading = fold.find((l) => /^#\s+/.test(l));
  const titleIdx = firstHeading ? fold.indexOf(firstHeading) : -1;
  let pitch: string | undefined;
  if (titleIdx >= 0) {
    for (let i = titleIdx + 1; i < fold.length; i++) {
      const line = fold[i]?.trim() ?? "";
      if (!line) continue;
      if (/^#{1,6}\s+/.test(line) || /^\[!\[/.test(line)) continue;
      pitch = line;
      break;
    }
  }

  return {
    firstHeadingIsTitle: !!firstHeading,
    hasPitchParagraph: !!pitch && pitch.length > 40,
    pitch,
    hasStatusSignal: /\b(deployed|production|live|active|archived|wip|beta)\b/i.test(text),
    hasDemoLink: /\[(demo|live|try it|website)\]/i.test(text),
    hasTechBadge: /img\.shields\.io|badgen\.net/.test(text),
    topHeadings: headings,
  };
}
