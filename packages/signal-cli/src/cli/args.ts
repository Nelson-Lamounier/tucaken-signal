import type { ArchetypeId, StageId } from "@tucaken/ontology";

export type Command =
  | "analyze" | "preview" | "compare-stages" | "ontology" | "draft" | "apply"
  | "config" | "telemetry" | "sync" | "help";

export interface ParsedArgs {
  command: Command;
  path: string;
  stage?: StageId;
  archetype?: ArchetypeId;
  format: "terminal" | "json" | "md";
  verbose: boolean;
  yes: boolean;
  animate: boolean;
  withLlm: boolean;
  withGithub: boolean;
  branch?: string;
  noCommit: boolean;
  output?: string;
  positional: string[];
}

const STAGES = new Set<StageId>(["junior", "mid", "senior", "staff"]);
const COMMANDS = /^(analyze|preview|compare-stages|ontology|draft|apply|config|telemetry|sync|help)$/;

export function parseArgs(argv: string[]): ParsedArgs {
  const args = argv.slice(2);
  let command: Command = "analyze";
  if (args[0] && !args[0].startsWith("-") && COMMANDS.test(args[0])) {
    command = args.shift() as Command;
  }
  const out: ParsedArgs = {
    command, path: ".", format: "terminal", verbose: false, yes: false,
    animate: false, withLlm: false, withGithub: false, noCommit: false, positional: [],
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
    else if (a.startsWith("--format=")) out.format = a.split("=")[1] as ParsedArgs["format"];
    else if (a.startsWith("--output=")) out.output = a.split("=")[1];
    else if (a.startsWith("--branch=")) out.branch = a.split("=")[1];
    else if (a === "--no-commit") out.noCommit = true;
    else if (a === "--animate") out.animate = true;
    else if (a === "--with-llm") out.withLlm = true;
    else if (a === "--with-github") out.withGithub = true;
    else if (a === "--verbose") out.verbose = true;
    else if (a === "--yes" || a === "-y") out.yes = true;
    else if (!a.startsWith("-")) out.positional.push(a);
  }
  out.path = out.positional[0] ?? ".";
  return out;
}
