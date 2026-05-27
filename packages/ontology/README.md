# @tucaken/ontology

Repo-shape ontology used by Tucaken Signal. **MIT — fork and extend.**

- 9 archetypes (`production_saas`, `open_source_library`, `internal_tool`,
  `ml_research`, `devops_infra`, `monorepo`, `cli_tool`, `mobile_app`,
  `static_site`)
- 4 career stages (`junior`, `mid`, `senior`, `staff`)
- 36 stage overlays — one per archetype × stage
- Pillar weights per archetype × stage
- Per-stage suggestion templates with evidence triggers

## Use as a library

```ts
import { Ontology } from "@tucaken/ontology";

const o = new Ontology();
const archetype = o.archetype("production_saas");
const stageOverlay = o.stage("senior", "production_saas");
```

## Use the YAML directly

```ts
import { readFileSync } from "node:fs";
import yaml from "yaml";
const path = require.resolve("@tucaken/ontology/data/archetypes/production-saas.yaml");
const def = yaml.parse(readFileSync(path, "utf8"));
```

## Contributing

PRs welcome for new archetypes, stage definitions, or suggestion
templates. Quality-gated by maintainers — see
<https://github.com/tucaken/signal/blob/main/packages/ontology/CONTRIBUTING.md>.
