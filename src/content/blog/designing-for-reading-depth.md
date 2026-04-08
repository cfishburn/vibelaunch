---
title: Design tokens eliminate AI guesswork
description: When every spacing, radius, and color value is a named token, AI assistants stop inventing arbitrary CSS and start using your system.
publishDate: 2026-04-06
category: Design
featured: true
tags: [design-tokens, tailwind, daisyui]
---

AI coding assistants are good at reading Tailwind classes. They are bad at knowing which values your project actually uses. Without constraints, they will generate `rounded-[14px]`, `tracking-[0.18em]`, and `text-[#334155]` — all reasonable, none matching your system.

Design tokens solve this by naming the values that matter:

- `rounded-card` instead of `rounded-[1.75rem]`
- `tracking-caps` instead of `tracking-[0.2em]`
- `base-content/75` instead of a hardcoded gray

This scaffold defines custom tokens in `global.css` via Tailwind v4's `@theme` block and uses DaisyUI semantic tokens for every color. The AI.md file tells assistants to never use arbitrary bracket values.

The guard suite reinforces this at CI time — `guard-solid` catches duplicate strings, and code review catches the rest. But the bigger win is that AI tools simply don't produce arbitrary values when the guardrail document says not to.

Tokens are not just about consistency. They are about making the right thing the easy thing, for humans and machines alike.
