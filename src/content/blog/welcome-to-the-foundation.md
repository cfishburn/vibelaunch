---
title: The day after vibe coding
description: AI can get you moving fast. It can also leave you with a repo that feels like a prank. This is about what happens next.
publishDate: 2026-04-08
category: Strategy
featured: true
tags: [ai, scaffolding, conventions]
---

Most project scaffolds ship a tech stack and leave you to figure out the conventions. AI coding assistants inherit that ambiguity — they guess at your formatting, invent arbitrary CSS values, and hardcode strings that should come from config.

That is fun for about six minutes. Then you have to live in the repo.

This scaffold takes a different approach. It includes two guardrail documents that AI tools read before writing a single line:

- **CLAUDE.md** — loaded automatically by Claude Code, with concise rules and patterns
- **AI.md** — a comprehensive reference that any AI assistant can use

These files describe the code style, the design token system, the guard suite, and the content schema. For example, CLAUDE.md tells assistants about the site config:

```ts
import { pageTitle, site } from '../config/site';

// site.name, site.tagline, site.nav, site.footer
// pageTitle('Stories') → "Stories | Vibe Launch"
```

And the "never do" list prevents the most common AI mistakes:

```md
1. Never hardcode secrets — guard-secrets blocks them at commit time
2. Never use arbitrary Tailwind bracket values — use design tokens
3. Never hardcode brand strings — import from site.ts
4. Never use npm or yarn — enforce-pnpm.mjs rejects them
```

The result is that AI-generated code fits the codebase on the first try. No reformatting, no chasing down hardcoded brand strings, no fighting with the linter.

### The convention documents are not documentation for humans

They are instructions for a collaborator who is seeing the code for the first time, every time. That changes what you include and how you phrase it. Instead of "our preferred style is single quotes," you write:

```md
**Single quotes** in source, **double quotes** in JSX attributes
```

Direct. No reasoning needed. The AI follows it.
