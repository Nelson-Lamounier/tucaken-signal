import { ConfigStore } from "../config/ConfigStore.js";
import type { Suggestion } from "../types.js";

export interface TucakenProject {
  id: string;
  name: string;
  technologies?: string[];
}

export class TucakenSyncClient {
  constructor(private readonly cfg: ConfigStore) {}

  private headers(): HeadersInit {
    const token = this.cfg.get("tucaken_token");
    if (!token) throw new Error("Not authenticated. Run `tucaken-signal config set tucaken_token <token>`.");
    return { authorization: `Bearer ${token}`, "content-type": "application/json" };
  }

  async listProjects(): Promise<TucakenProject[]> {
    const res = await fetch(`${this.cfg.apiBase()}/projects`, { headers: this.headers() });
    if (!res.ok) throw new Error(`Tucaken API ${res.status}: ${await res.text()}`);
    return (await res.json()) as TucakenProject[];
  }

  async saveAcceptedSuggestions(projectId: string | null, suggestions: Suggestion[]): Promise<void> {
    const body = {
      project_id: projectId,
      suggestions: suggestions.map((s) => ({
        id: s.id, pillar: s.pillar, title: s.title, stage_target: s.stageTarget,
        evidence_paths: s.evidenceBasis.map((e) => e.path).filter(Boolean),
      })),
    };
    const res = await fetch(`${this.cfg.apiBase()}/signal/suggestions`, {
      method: "POST",
      headers: this.headers(),
      body: JSON.stringify(body),
    });
    if (!res.ok) throw new Error(`Tucaken API ${res.status}: ${await res.text()}`);
  }
}
