import { existsSync, mkdirSync, readFileSync, writeFileSync, chmodSync } from "node:fs";
import { homedir } from "node:os";
import { dirname, join } from "node:path";

export interface TucakenConfig {
  tucaken_token?: string;
  tucaken_api_base?: string;
  telemetry_opt_in?: boolean;
  user_id_hash?: string;
}

const DEFAULT_API_BASE = "https://api.tucaken.dev";

export class ConfigStore {
  readonly path: string;
  private cache: TucakenConfig;

  constructor(path?: string) {
    this.path = path ?? join(homedir(), ".tucaken", "config.json");
    this.cache = this.read();
  }

  get<K extends keyof TucakenConfig>(key: K): TucakenConfig[K] {
    return this.cache[key];
  }

  set<K extends keyof TucakenConfig>(key: K, value: TucakenConfig[K]): void {
    this.cache[key] = value;
    this.write();
  }

  unset<K extends keyof TucakenConfig>(key: K): void {
    delete this.cache[key];
    this.write();
  }

  all(): Readonly<TucakenConfig> {
    return { ...this.cache };
  }

  apiBase(): string {
    return this.cache.tucaken_api_base ?? DEFAULT_API_BASE;
  }

  private read(): TucakenConfig {
    if (!existsSync(this.path)) return {};
    try {
      return JSON.parse(readFileSync(this.path, "utf8")) as TucakenConfig;
    } catch {
      return {};
    }
  }

  private write(): void {
    mkdirSync(dirname(this.path), { recursive: true });
    writeFileSync(this.path, JSON.stringify(this.cache, null, 2), "utf8");
    try { chmodSync(this.path, 0o600); } catch {/* best-effort */}
  }
}

const SAFE_KEYS = new Set<keyof TucakenConfig>(["tucaken_token", "tucaken_api_base", "telemetry_opt_in", "user_id_hash"]);

export function isKnownConfigKey(k: string): k is keyof TucakenConfig {
  return (SAFE_KEYS as Set<string>).has(k);
}
