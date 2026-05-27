import { readFileSync, readdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { parse } from "yaml";
import type { ArchetypeDef, ArchetypeId, OntologyVersion, StageDef, StageId } from "./types.js";

const here = dirname(fileURLToPath(import.meta.url));
const dataRoot = join(here, "..", "data");

export class Ontology {
  private archetypes = new Map<ArchetypeId, ArchetypeDef>();
  private stages = new Map<string, StageDef>();
  readonly version: OntologyVersion;

  constructor() {
    this.version = parse(readFileSync(join(dataRoot, "version.yaml"), "utf8")) as OntologyVersion;
    for (const f of readdirSync(join(dataRoot, "archetypes"))) {
      if (!f.endsWith(".yaml")) continue;
      const def = parse(readFileSync(join(dataRoot, "archetypes", f), "utf8")) as ArchetypeDef;
      this.archetypes.set(def.id, def);
    }
    for (const f of readdirSync(join(dataRoot, "stages"))) {
      if (!f.endsWith(".yaml")) continue;
      const def = parse(readFileSync(join(dataRoot, "stages", f), "utf8")) as StageDef;
      this.stages.set(stageKey(def.stage, def.archetype), def);
    }
  }

  archetype(id: ArchetypeId): ArchetypeDef | undefined {
    return this.archetypes.get(id);
  }

  stage(stage: StageId, archetype: ArchetypeId): StageDef | undefined {
    return this.stages.get(stageKey(stage, archetype));
  }

  listArchetypes(): ArchetypeDef[] {
    return [...this.archetypes.values()];
  }
}

function stageKey(stage: StageId, archetype: ArchetypeId): string {
  return `${stage}::${archetype}`;
}
