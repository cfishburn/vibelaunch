# Contributing

Thanks for considering a contribution to Vibe Launch. This project is an opinionated Astro starter designed to show how to structure a codebase so AI coding assistants work effectively from the first prompt.

## Getting started

```sh
git clone https://github.com/shfishburn/vibelaunch.git
cd vibelaunch
pnpm install
cp .env.example .env.local
pnpm dev
```

No environment variables are required for first boot. Auth and Supabase features degrade gracefully when keys are missing.

For deployed environments, set `SITE_URL` so canonicals, sitemap output, and crawler-facing endpoints use the correct domain.

## Before you commit

A guard suite runs automatically on every commit via husky. It checks for:

- **Hardcoded secrets** — API keys, DB URLs, private keys
- **Bypass attempts** — skip comments, hardcoded exits
- **Lint and type errors** — Biome formatting, Astro type check
- **Lockfile drift** — package.json changes without pnpm-lock.yaml update

If a guard fails, read the output — it tells you exactly what to fix.

You can run the full suite manually:

```sh
pnpm guard:pre-commit   # What the hook runs
pnpm guard:ci           # Full CI suite (adds SOLID heuristics + build check)
pnpm smoke:public       # Run after pnpm build to verify key public routes
```

## Code style

**Biome** is the single tool for formatting and linting. There is no Prettier or ESLint.

- Tabs, 100-char line width
- Single quotes, double quotes in JSX
- Always semicolons, always trailing commas

Run `pnpm format` or `pnpm tooling:fix` to auto-fix.

## Design tokens

All CSS must use semantic tokens. Never use arbitrary Tailwind bracket values like `rounded-[1.75rem]` or `text-[#hex]`.

- Cards: `rounded-card` or `rounded-card-lg`
- Uppercase labels: `tracking-caps`
- Colors: DaisyUI tokens only (`base-100`, `base-content`, `primary`, etc.)
- Inner panels: `rounded-box` (DaisyUI)

Custom tokens are defined in `src/styles/global.css` via `@theme`.

## Brand and copy

All brand strings, nav links, footer copy, and SEO defaults live in `src/config/site.ts`. Never hardcode these in components, layouts, or pages.

## Adding content

- **Blog posts**: Create `src/content/blog/my-post.md` with the required frontmatter (title, description, publishDate, category).
- **Site pages**: Create `src/content/site-pages/my-page.mdx` with the required frontmatter (eyebrow, title, description).

Both schemas are typed in `src/content.config.ts`. Add new fields as `.optional()` or `.default()` to keep existing content valid.

## Documentation workflow

The repo includes two documentation patterns under `src/content/superpowers/`:

- **`doc-template.mdx`** is for durable documentation that should outlive the current task.
- **`dev-log.mdx`** is for active implementation context that is useful during development, debugging, and short-term post-merge support.

Use `doc-template.mdx` when you are adding or revising lasting docs such as feature docs, guidelines, runbooks, or ADR-style references.

Use `dev-log.mdx` when:

- work spans multiple sessions
- there are meaningful dead ends or tradeoffs worth preserving
- commit history alone would not explain why a technical choice was made

Do not create devlogs for tiny edits, obvious fixes, or changes that are already fully explained by the code and commit history.

## Adding pages and routes

- Static page: `src/pages/my-page.astro` using `Layout` wrapper
- Dynamic page: Add `export const prerender = false` for runtime data
- API endpoint: `src/pages/api/my-endpoint.json.ts` with `GET`/`POST` exports
- Protected route: Add the pattern to `createRouteMatcher` in `src/middleware.ts`

## Pull requests

1. Fork the repo and create a feature branch
2. Make your changes
3. Ensure `pnpm guard:ci` passes (or at minimum `pnpm guard:pre-commit`)
4. Ensure `pnpm build` succeeds
5. Open a PR with a clear description of what changed and why

## What makes a good contribution

This scaffold is opinionated by design. Contributions that work well:

- **Bug fixes** — something broken in the guard suite, SEO output, or build pipeline
- **Guard improvements** — new guards that catch real problems, or fewer false positives
- **AI guardrail refinements** — better instructions in CLAUDE.md or AI.md based on real experience
- **Design token additions** — new semantic tokens that eliminate repeated arbitrary values
- **Content schema improvements** — new optional fields with sensible defaults
- **Documentation** — clearer explanations, missing context, real-world examples

Contributions that may not fit:

- Adding new frameworks or major dependencies
- Replacing Biome with Prettier/ESLint
- Replacing pnpm with npm/yarn
- Removing the guard suite or weakening guard rules
- Adding features that aren't part of the scaffold's teaching purpose

## Questions?

Open an issue. We'd rather help you contribute than have you guess at conventions.
