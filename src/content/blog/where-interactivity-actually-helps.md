---
title: Guard scripts that teach, not just block
description: A guard suite that explains what went wrong is more valuable than one that silently rejects. Here's how the scaffold's guards work.
publishDate: 2026-04-03
category: Operations
featured: false
tags: [guards, ci, automation]
---

Most linting setups give you a red squiggle and a rule name. The scaffold's guard suite goes further — it runs six checks at commit time, each with clear output that tells you what to fix.

The guards are registry-driven. `scripts/guard-registry.yml` is the single source of truth for what runs, when it runs, and whether it blocks or warns. The orchestrator reads it and runs each guard in order:

- **bypass** catches attempts to circumvent the suite itself
- **secrets** scans for hardcoded API keys and database URLs
- **tooling** wraps Biome and Astro type checking
- **lockfile** ensures the pnpm lockfile stays in sync
- **solid** flags files over 300 lines and god components (warn-only in CI)
- **build** validates post-build artifacts for source maps and leaked credentials

When a guard fails, it prints the file, line number, and a description of the problem. No cryptic exit codes. No silent failures.

This matters for AI-assisted development because the guard suite is the last line of defense. AI tools will occasionally generate code that leaks a test key or creates a 400-line component. The guards catch it before it reaches the repo.
