import { existsSync } from "node:fs";
import { join } from "node:path";
import { simpleGit } from "simple-git";

export interface CommitFingerprintResult {
  available: boolean;
  totalCommits: number;
  spanDays: number;
  offHoursRatio: number;
  revertCount: number;
  fixCount: number;
  messageVariability: number;
  uniqueAuthors: number;
}

export async function analyzeCommitFingerprint(root: string): Promise<CommitFingerprintResult> {
  const empty: CommitFingerprintResult = {
    available: false, totalCommits: 0, spanDays: 0, offHoursRatio: 0,
    revertCount: 0, fixCount: 0, messageVariability: 0, uniqueAuthors: 0,
  };
  if (!existsSync(join(root, ".git"))) return empty;
  try {
    const git = simpleGit(root);
    const log = await git.log({ maxCount: 500 });
    const commits = log.all;
    if (commits.length === 0) return empty;

    const dates = commits.map((c) => new Date(c.date));
    const earliest = dates.reduce((a, b) => (a < b ? a : b));
    const latest = dates.reduce((a, b) => (a > b ? a : b));
    const spanDays = Math.max(1, Math.round((latest.getTime() - earliest.getTime()) / 86_400_000));

    const offHours = dates.filter((d) => {
      const h = d.getHours();
      return h < 8 || h >= 20;
    }).length;

    const reverts = commits.filter((c) => /\brevert\b/i.test(c.message)).length;
    const fixes = commits.filter((c) => /\b(fix|bug|hotfix|patch)\b/i.test(c.message)).length;

    const uniqueAuthors = new Set(commits.map((c) => c.author_email)).size;
    const variability = uniqueLengthsRatio(commits.map((c) => c.message));

    return {
      available: true,
      totalCommits: commits.length,
      spanDays,
      offHoursRatio: round(offHours / commits.length),
      revertCount: reverts,
      fixCount: fixes,
      messageVariability: round(variability),
      uniqueAuthors,
    };
  } catch {
    return empty;
  }
}

function uniqueLengthsRatio(msgs: string[]): number {
  if (msgs.length === 0) return 0;
  const lens = msgs.map((m) => Math.min(120, m.length));
  return new Set(lens).size / lens.length;
}
function round(n: number): number { return Math.round(n * 100) / 100; }
