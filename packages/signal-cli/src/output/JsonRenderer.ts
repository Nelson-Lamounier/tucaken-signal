import type { TrustSignalReport } from "../types.js";

export function renderJson(report: TrustSignalReport): string {
  return JSON.stringify(report, null, 2);
}
