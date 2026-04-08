---
title: Why your scaffold should teach AI how to help
description: AI coding assistants produce better code when the project tells them its conventions upfront. Here's how this scaffold does it.
publishDate: 2026-04-08
category: Strategy
featured: true
tags: [ai, scaffolding, conventions]
---

Most project scaffolds ship a tech stack and leave you to figure out the conventions. AI coding assistants inherit that ambiguity — they guess at your formatting, invent arbitrary CSS values, and hardcode strings that should come from config.

This scaffold takes a different approach. It includes two guardrail documents that AI tools read before writing a single line:

- **CLAUDE.md** — loaded automatically by Claude Code, with concise rules and patterns
- **AI.md** — a comprehensive reference that any AI assistant can use

These files describe the code style (Biome, not Prettier), the design token system (no arbitrary bracket values), the guard suite (what will block a commit), and the content schema (what frontmatter fields exist).

The result is that AI-generated code fits the codebase on the first try. No reformatting, no chasing down hardcoded brand strings, no fighting with the linter.

The convention documents are not documentation for humans who already know the project. They are instructions for a collaborator who is seeing the code for the first time, every time.
