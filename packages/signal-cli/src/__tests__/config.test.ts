import { describe, expect, it } from "vitest";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { ConfigStore } from "../config/ConfigStore.js";
import { Telemetry, NullTelemetrySink, deriveAnonymousUserHash } from "../telemetry/TelemetryClient.js";

function tmpCfg() {
  return new ConfigStore(join(mkdtempSync(join(tmpdir(), "tucaken-cfg-")), "config.json"));
}

describe("ConfigStore", () => {
  it("round-trips values", () => {
    const c = tmpCfg();
    c.set("tucaken_token", "abc");
    c.set("telemetry_opt_in", true);
    expect(c.get("tucaken_token")).toBe("abc");
    expect(c.get("telemetry_opt_in")).toBe(true);
  });

  it("defaults telemetry to opt-out (undefined)", () => {
    const c = tmpCfg();
    expect(c.get("telemetry_opt_in")).toBeUndefined();
  });
});

describe("Telemetry", () => {
  it("never sends when opted out (default)", async () => {
    const c = tmpCfg();
    let sent = 0;
    const t = new Telemetry(c, { async send() { sent++; } });
    await t.record({ cli_version: "0.1.0", ontology_version: "0.1.0", archetype_detected: "x", stage: "mid", suggestion_count: 0, command_used: "analyze" });
    expect(sent).toBe(0);
  });

  it("sends when opted in", async () => {
    const c = tmpCfg();
    c.set("telemetry_opt_in", true);
    let captured: unknown = null;
    const t = new Telemetry(c, { async send(e) { captured = e; } });
    await t.record({ cli_version: "0.1.0", ontology_version: "0.1.0", archetype_detected: "x", stage: "mid", suggestion_count: 0, command_used: "analyze" });
    expect(captured).toMatchObject({ archetype_detected: "x", command_used: "analyze" });
  });

  it("anonymous user hash is deterministic + redacts the token", () => {
    const h1 = deriveAnonymousUserHash("secret");
    const h2 = deriveAnonymousUserHash("secret");
    expect(h1).toBe(h2);
    expect(h1).not.toContain("secret");
  });

  it("null sink is a no-op", async () => {
    await new NullTelemetrySink().send({ cli_version: "x", ontology_version: "x", archetype_detected: "x", stage: "x", suggestion_count: 0, command_used: "x", ts: "x" });
  });
});
