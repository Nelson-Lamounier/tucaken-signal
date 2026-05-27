# Publishing checklist

Three packages to publish, in dependency order. Read top to bottom; do
not skip steps.

## Prerequisites

1. **npm account.** Run `npm whoami`. If not logged in: `npm login`.
2. **@tucaken scope exists** on npm. If not, create at
   <https://www.npmjs.com/org/create>. The scope name must be
   reserved before you can publish under it.
3. **Two-factor on the account.** npm requires 2FA for new scope
   publishes. Have an authenticator ready.
4. **All tests green:** `yarn test` from monorepo root.
5. **Clean working tree:** `git status` must show no uncommitted
   changes. (Tag will point at HEAD.)
6. **README links resolve.** Replace the `https://github.com/Nelson-Lamounier/tucaken-signal`
   URLs in `packages/*/package.json` if the actual repo is at a
   different URL.

## Pack dry-run (already verified)

```bash
cd packages/ontology     && npm pack --dry-run
cd packages/signal-cli   && npm pack --dry-run
cd packages/mcp-server   && npm pack --dry-run
```

Current sizes (2026-05-27):

- `@tucaken/ontology`   — 10.5 kB / 57 files
- `@tucaken/signal-cli` — 58.3 kB / 119 files
- `@tucaken/signal-mcp` — 3.1 kB / 5 files

## Publish order

**Must be ontology → signal-cli → mcp-server.** signal-cli depends on
ontology; mcp-server depends on signal-cli. yarn 4 rewrites `workspace:*`
to the actual published version automatically.

```bash
# 1. Ontology (no dependencies on @tucaken/*)
cd packages/ontology
npm publish --access public

# 2. Signal CLI (depends on @tucaken/ontology)
cd packages/signal-cli
npm publish --access public

# 3. MCP server (depends on @tucaken/signal-cli)
cd packages/mcp-server
npm publish --access public
```

The `--access public` flag is required on first publish under a scope
that doesn't have a default visibility set. It's redundant with the
`publishConfig` field but harmless.

## Post-publish verification

```bash
# Confirm published in registry
npm view @tucaken/ontology version
npm view @tucaken/signal-cli version
npm view @tucaken/signal-mcp version

# Test install from scratch in a temp dir
mkdir /tmp/tucaken-test && cd /tmp/tucaken-test
npm install -g @tucaken/signal-cli
tucaken-signal --help
which tucaken-signal
```

## Versioning

Use semver:

- **0.1.0 → 0.1.1** for bug fixes (no new analyzer / no rule changes)
- **0.1.0 → 0.2.0** for feature additions or rule tightening that
  changes scores
- **0.1.0 → 1.0.0** when validation gates documented in
  `validation/RESULTS.md` are met on a per-fixture-set basis AND the
  AI-transparency engineer interviews land at the "credibility win"
  outcome

For rapid iteration, prefer minor bumps. Avoid 0.x → 1.x without
intentional review — 1.x signals API stability.

## Bumping

```bash
# From monorepo root, bump all three packages together
yarn workspaces foreach -A version patch  # or minor / major
git add packages/*/package.json
git commit -m "chore: bump to vX.Y.Z"
git tag vX.Y.Z
git push --tags
```

## Unpublish (emergency)

```bash
# Within 72 hours of publish only
npm unpublish @tucaken/signal-cli@0.1.0
```

After 72h: the version is permanent. You can `npm deprecate` it but
not remove. **Do not test publish on the canonical scope.** If you
want a sanity-check publish, use a personal scope first
(`@nelsonlamounier/signal-cli-test`) or run a verdaccio local
registry.

## Distribution surfaces (after npm publish)

- **CLI:** users run `npm install -g @tucaken/signal-cli`. The
  `tucaken-signal` binary lands on their PATH automatically.
- **Claude Code skill:** distribute via Anthropic's skill registry
  when it opens, OR document the manual symlink install in the README.
- **MCP server:** users add to their MCP config:
  ```json
  {
    "mcpServers": {
      "tucaken-signal": {
        "command": "npx",
        "args": ["-y", "@tucaken/signal-mcp"]
      }
    }
  }
  ```
- **Cursor extension:** separate publish to Cursor marketplace
  (not npm). The package in `packages/cursor-extension/` needs
  `vsce package` → upload to <https://marketplace.cursor.sh>.

## Pre-publish blockers (current)

- ⚠ `@tucaken` npm scope: not verified to exist
- ⚠ `github.com/Nelson-Lamounier/tucaken-signal` URL: placeholder; replace before publish
- ⚠ AI-transparency engineer interviews: not yet done (validation gate)
- ⚠ Junior/mid private fixtures: labels are tool-inferred, awaiting
  human ground-truth review

The first two are 5-min admin work. The latter two are the real
blockers if you want to ship 1.0 honestly.
