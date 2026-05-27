import { ConfigStore } from "../../config/ConfigStore.js";
import { deriveAnonymousUserHash } from "../../telemetry/TelemetryClient.js";

export function runTelemetry(args: string[], cfg: ConfigStore): number {
  const sub = args[0];
  if (sub === "opt-in") {
    cfg.set("telemetry_opt_in", true);
    const hash = deriveAnonymousUserHash(cfg.get("tucaken_token")) ?? randomHash();
    cfg.set("user_id_hash", hash);
    process.stderr.write(`Telemetry opt-in enabled. Anonymous id: ${hash}\n`);
    process.stderr.write(`Events collected: cli_version, ontology_version, archetype, stage, suggestion_count, command_used. No paths, no content.\n`);
    return 0;
  }
  if (sub === "opt-out") {
    cfg.set("telemetry_opt_in", false);
    process.stderr.write(`Telemetry opt-out. No events will be sent.\n`);
    return 0;
  }
  if (sub === "status" || !sub) {
    const on = cfg.get("telemetry_opt_in") === true;
    process.stdout.write(on ? "opt-in\n" : "opt-out (default)\n");
    return 0;
  }
  process.stderr.write("usage: tucaken-signal telemetry opt-in|opt-out|status\n");
  return 2;
}

function randomHash(): string {
  return [...Array(16)].map(() => Math.floor(Math.random() * 16).toString(16)).join("");
}
