import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { simpleGit } from "simple-git";
import type { DraftResult } from "../suggestions/DraftGenerator.js";

export interface ApplyOptions {
  repoRoot: string;
  draft: DraftResult;
  branch?: string;
  commit: boolean;
}

export interface ApplyResult {
  writtenPath: string;
  branchCreated?: string;
  committed?: boolean;
}

export async function applyDraft(opts: ApplyOptions): Promise<ApplyResult> {
  const target = resolve(opts.repoRoot, opts.draft.filename);
  mkdirSync(dirname(target), { recursive: true });
  const isGit = existsSync(join(opts.repoRoot, ".git"));

  let branchCreated: string | undefined;
  if (isGit && opts.branch) {
    const git = simpleGit(opts.repoRoot);
    await git.checkoutLocalBranch(opts.branch);
    branchCreated = opts.branch;
  }

  writeFileSync(target, opts.draft.content, "utf8");

  let committed = false;
  if (isGit && opts.commit) {
    const git = simpleGit(opts.repoRoot);
    await git.add(opts.draft.filename);
    await git.commit(`docs: add ${opts.draft.filename} (tucaken-signal suggestion ${opts.draft.suggestionId})`);
    committed = true;
  }

  return { writtenPath: target, branchCreated, committed };
}
