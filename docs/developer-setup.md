# Developer Setup

This starter is designed to work with a small, explicit toolchain. Keep the editor and CLI setup conservative so the repo stays predictable for both humans and AI assistants.

## Required

- Node.js `22.12.0` or newer
- `pnpm` `10.30.1`
- Git

## Recommended VS Code extensions

- `astro-build.astro-vscode` — Astro language support, diagnostics, and MDX-aware authoring
- `biomejs.biome` — formatting and linting on save
- `bradlc.vscode-tailwindcss` — Tailwind and DaisyUI class autocomplete
- `unifiedjs.vscode-mdx` — MDX editing support

## Optional extensions

- `supabase.vscode-supabase-extension` — useful when you use local Supabase workflows
- `denoland.vscode-deno` — only needed if your fork adds Supabase Edge Functions

## Recommended CLIs

- `vercel` — deploy, inspect environment variables, link projects
- `supabase` — local database workflows, generated types, migrations, Edge Functions
- `gh` — issues, pull requests, release workflows

## First run

```sh
pnpm install
cp .env.example .env.local
pnpm dev
```

No environment variables are required for the public pages. Auth and Supabase features degrade gracefully when the relevant keys are absent.

## Verification commands

```sh
pnpm run tooling:check
pnpm run check
pnpm run build
pnpm run smoke:public
pnpm run guard:ci
```

Run `pnpm run smoke:public` after `pnpm run build`. It verifies the generated public output and the critical docs links before you publish or open a release PR.
