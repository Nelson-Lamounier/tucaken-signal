import { createHash } from "node:crypto";
import { ConfigStore } from "../config/ConfigStore.js";

export interface TelemetryEvent {
  cli_version: string;
  ontology_version: string;
  archetype_detected: string;
  stage: string;
  suggestion_count: number;
  command_used: string;
  user_id_hash?: string;
  ts: string;
}

export interface TelemetrySink {
  send(e: TelemetryEvent): Promise<void>;
}

export class NullTelemetrySink implements TelemetrySink {
  async send(_: TelemetryEvent): Promise<void> {/* no-op */}
}

export class HttpTelemetrySink implements TelemetrySink {
  constructor(private readonly endpoint: string) {}
  async send(e: TelemetryEvent): Promise<void> {
    try {
      await fetch(`${this.endpoint}/telemetry`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(e),
      });
    } catch {/* best-effort */}
  }
}

export class Telemetry {
  constructor(private readonly cfg: ConfigStore, private readonly sink: TelemetrySink) {}

  enabled(): boolean {
    return this.cfg.get("telemetry_opt_in") === true;
  }

  async record(partial: Omit<TelemetryEvent, "ts" | "user_id_hash">): Promise<void> {
    if (!this.enabled()) return;
    const ev: TelemetryEvent = {
      ...partial,
      ts: new Date().toISOString(),
      user_id_hash: this.cfg.get("user_id_hash"),
    };
    await this.sink.send(ev);
  }
}

export function pickTelemetrySink(cfg: ConfigStore): TelemetrySink {
  if (cfg.get("telemetry_opt_in")) return new HttpTelemetrySink(cfg.apiBase());
  return new NullTelemetrySink();
}

export function deriveAnonymousUserHash(token: string | undefined): string | undefined {
  if (!token) return undefined;
  return createHash("sha256").update(token).digest("hex").slice(0, 16);
}
