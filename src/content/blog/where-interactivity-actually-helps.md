---
title: Guard scripts that teach, not just block
description: A guard suite that explains what went wrong is more valuable than one that silently rejects. Here's how the scaffold's guards work.
publishDate: 2026-04-03
category: Operations
featured: false
tags: [guards, ci, automation]
---

Most linting setups give you a red squiggle and a rule name. The scaffold's guard suite goes further — it runs six checks at commit time, each with clear output that tells you what to fix.

### Registry-driven orchestration

The guards are defined in `scripts/guard-registry.yml`, the single source of truth for what runs and when:

```yaml
execution_order:
  - bypass
  - secrets
  - tooling
  - lockfile
  - solid
  - build

guards:
  secrets:
    enabled: true
    script: scripts/guard-secrets.mjs
    layer: security
    mode: hard-block
    triggers:
      - pre-commit
      - ci
    timeout: 20
```

The orchestrator (`guard-all.mjs`) reads this registry and runs each guard in order. Pre-commit runs the first four (fast, under 15 seconds). CI runs all six.

### What each guard catches

- **bypass** — attempts to circumvent the suite itself (`// skip build`, hardcoded `process.exit(0)`)
- **secrets** — hardcoded API keys, database URLs, private keys
- **tooling** — Biome formatting errors, Astro type check failures
- **lockfile** — `package.json` changed without updating `pnpm-lock.yaml`
- **solid** — files over 300 lines, god components with 4+ mixed concerns (warn-only)
- **build** — source maps and leaked credentials in the compiled output

### Clear failure output

When a guard fails, it prints exactly what to fix:

```
guard:secrets violations (1):

  hardcoded-secret (1):
    src/lib/supabase.ts [hardcoded-secret] SUPABASE_SERVICE_ROLE_KEY

Secret usage detected in 1 location(s).
```

No cryptic exit codes. No silent failures.

### Why this matters for AI-assisted development

AI tools occasionally generate code that leaks a test key, creates a 400-line file, or adds `// skip build` while debugging. The guard suite catches these at commit time, before they reach the repo.

The `AI.md` guardrails document tells assistants about the guards upfront, so they avoid triggering them in the first place. But when they do, the output is clear enough that the assistant can fix its own mistake in the next turn.
