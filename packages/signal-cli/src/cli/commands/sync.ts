import { ConfigStore } from "../../config/ConfigStore.js";
import { TucakenSyncClient } from "../../sync/TucakenSyncClient.js";
import type { TrustSignalReport } from "../../types.js";

export async function runSync(args: string[], cfg: ConfigStore, report: TrustSignalReport): Promise<number> {
  const sub = args[0] ?? "push";
  const client = new TucakenSyncClient(cfg);

  if (sub === "projects") {
    try {
      const projects = await client.listProjects();
      process.stdout.write(JSON.stringify(projects, null, 2) + "\n");
      return 0;
    } catch (e) {
      process.stderr.write(`sync error: ${(e as Error).message}\n`);
      return 1;
    }
  }
  if (sub === "push") {
    const projectId = args[1] ?? null;
    try {
      await client.saveAcceptedSuggestions(projectId, report.suggestions);
      process.stderr.write(`pushed ${report.suggestions.length} suggestions${projectId ? ` to project ${projectId}` : ""}\n`);
      return 0;
    } catch (e) {
      process.stderr.write(`sync error: ${(e as Error).message}\n`);
      return 1;
    }
  }
  process.stderr.write("usage: tucaken-signal sync projects | push [projectId]\n");
  return 2;
}
