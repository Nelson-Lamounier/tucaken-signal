import { ConfigStore, isKnownConfigKey, type TucakenConfig } from "../../config/ConfigStore.js";

export function runConfig(args: string[], cfg: ConfigStore): number {
  const sub = args[0];
  if (sub === "get") {
    const key = args[1];
    if (!key) { process.stdout.write(JSON.stringify(cfg.all(), null, 2) + "\n"); return 0; }
    if (!isKnownConfigKey(key)) { process.stderr.write(`Unknown config key: ${key}\n`); return 2; }
    const v = cfg.get(key);
    process.stdout.write(v === undefined ? "" : String(v));
    process.stdout.write("\n");
    return 0;
  }
  if (sub === "set") {
    const key = args[1]; const value = args[2];
    if (!key || value === undefined) { process.stderr.write("usage: tucaken-signal config set <key> <value>\n"); return 2; }
    if (!isKnownConfigKey(key)) { process.stderr.write(`Unknown config key: ${key}\n`); return 2; }
    const coerced = coerce(key, value);
    cfg.set(key, coerced);
    process.stderr.write(`set ${key}\n`);
    return 0;
  }
  if (sub === "unset") {
    const key = args[1];
    if (!key || !isKnownConfigKey(key)) { process.stderr.write(`usage: tucaken-signal config unset <key>\n`); return 2; }
    cfg.unset(key);
    process.stderr.write(`unset ${key}\n`);
    return 0;
  }
  process.stderr.write("usage: tucaken-signal config get|set|unset [key] [value]\n");
  return 2;
}

function coerce<K extends keyof TucakenConfig>(key: K, raw: string): TucakenConfig[K] {
  if (key === "telemetry_opt_in") return (raw === "true") as TucakenConfig[K];
  return raw as TucakenConfig[K];
}
