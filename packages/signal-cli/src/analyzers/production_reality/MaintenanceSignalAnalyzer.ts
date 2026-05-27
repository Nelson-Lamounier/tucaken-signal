import type { CommitFingerprintResult } from "../authenticity/CommitFingerprintAnalyzer.js";

export interface MaintenanceResult {
  sustainedActivity: boolean;
  burstThenDormant: boolean;
  staleDays: number | null;
  fixRatio: number;
}

export function analyzeMaintenance(c: CommitFingerprintResult, latestCommitDate?: Date): MaintenanceResult {
  if (!c.available) return { sustainedActivity: false, burstThenDormant: false, staleDays: null, fixRatio: 0 };
  const commitsPerDay = c.totalCommits / Math.max(1, c.spanDays);
  const sustainedActivity = c.spanDays > 30 && commitsPerDay > 0.05;
  const burstThenDormant = c.spanDays < 14 && c.totalCommits > 20;
  const fixRatio = c.totalCommits ? c.fixCount / c.totalCommits : 0;
  const staleDays = latestCommitDate ? Math.round((Date.now() - latestCommitDate.getTime()) / 86_400_000) : null;
  return { sustainedActivity, burstThenDormant, staleDays, fixRatio: round(fixRatio) };
}
function round(n: number): number { return Math.round(n * 100) / 100; }
