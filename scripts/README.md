# Scripts

Project automation stays in the repo root because these scripts are repository-level tooling, not app runtime code.

## Guard Suite

Registry-driven guard system that runs security, architecture, and quality checks at pre-commit and CI time. Orchestrated by `guard-all.mjs` which reads `guard-registry.yml` to determine what runs and when.

### Running guards

```sh
pnpm run guard:pre-commit    # what husky runs: bypass → secrets → tooling → lockfile
pnpm run guard:ci             # what CI runs: bypass → secrets → tooling → solid → build
pnpm run guard:secrets        # individual guard
pnpm run guard:solid -- --warn-only
pnpm run smoke:public         # build-output public route smoke test (run after build)
```

### Guard inventory

| Guard | Layer | Mode | Pre-commit | CI | What it checks |
|-------|-------|------|:----------:|:--:|----------------|
| bypass | security | hard-block | x | x | Meta-integrity: hardcoded exits, bypass comments, suspicious commits |
| secrets | security | hard-block | x | x | Hardcoded secrets, API keys, private keys in source |
| tooling | quality | hard-block | x | x | Biome lint/format + Astro type check (+ build and public smoke test in CI) |
| lockfile | architecture | hard-block | x | | pnpm-lock.yaml stays in sync with package.json |
| solid | quality | warn-only | | x | SOLID/DRY heuristics: file length, god components, fat interfaces |
| build | security | hard-block | | x | Post-build artifacts: source maps, leaked secrets, oversized chunks |

### Files

- `guard-all.mjs` — orchestrator, reads registry, runs guards in order
- `guard-lib.mjs` — shared library: file collection, CLI parsing, reporting, YAML loader
- `guard-registry.yml` — single source of truth for guard config
- `guard-tooling.mjs` — wraps biome + astro check + build as a guard step
- `guard-bypass.mjs` — meta-guard detecting circumvention attempts
- `guard-secrets.mjs` — secret leak detection in source files
- `guard-build.mjs` — post-build artifact validation
- `guard-lockfile.mjs` — lockfile consistency with package.json
- `guard-solid.mjs` — SOLID/DRY heuristic code quality checks
- `enforce-pnpm.mjs` — preinstall guard ensuring pnpm is used

### Per-file opt-out

Add `// scaffold-disable-solid-check` to a file to skip SOLID/DRY analysis for reviewed exceptions.
