import type { ArchetypeId, StageId } from "@tucaken/ontology";

export type Command =
  | "scan" | "apply" | "config" | "telemetry" | "ontology" | "help";

export interface ParsedArgs {
  command: Command;
  path: string;
  stage?: StageId;
  archetype?: ArchetypeId;
  verbose: boolean;
  yes: boolean;
  withGithub: boolean;
  withLlm: boolean;
  branch?: string;
  noCommit: boolean;
  suggestionId?: string;
  dryRun: boolean;
  positional: string[];
}

const STAGES = new Set<StageId>(["junior", "mid", "senior", "staff"]);
// Bare invocation (no verb) defaults to `scan`.
const COMMANDS = /^(scan|apply|config|telemetry|ontology|help)$/;

export function parseArgs(argv: string[]): ParsedArgs {
  const args = argv.slice(2);
  let command: Command = "scan";
  if (args[0] && !args[0].startsWith("-") && COMMANDS.test(args[0])) {
    command = args.shift() as Command;
  }
  const out: ParsedArgs = {
    command, path: ".", verbose: false, yes: false,
    withGithub: false, withLlm: false, noCommit: false, dryRun: false, positional: [],
  };
  for (let i = 0; i < args.length; i++) {
    const a = args[i]!;
    if (a.startsWith("--stage=")) {
      const v = a.split("=")[1] as StageId;
      if (STAGES.has(v)) out.stage = v;
    } else if (a === "--stage") {
      const v = args[++i] as StageId;
      if (STAGES.has(v)) out.stage = v;
    } else if (a.startsWith("--archetype=")) out.archetype = a.split("=")[1] as ArchetypeId;
    else if (a.startsWith("--id=")) out.suggestionId = a.split("=")[1];
    else if (a.startsWith("--branch=")) out.branch = a.split("=")[1];
    else if (a === "--no-commit") out.noCommit = true;
    else if (a === "--dry-run") out.dryRun = true;
    else if (a === "--with-github") out.withGithub = true;
    else if (a === "--with-llm") out.withLlm = true;
    else if (a === "--verbose") out.verbose = true;
    else if (a === "--yes" || a === "-y") out.yes = true;
    else if (!a.startsWith("-")) out.positional.push(a);
  }
  out.path = out.positional[0] ?? ".";
  return out;
}
