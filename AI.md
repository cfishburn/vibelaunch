# AI.md — Vibe Launch (vibelaunch.ai) Codebase Guardrails

This document describes the conventions, architecture, and constraints for AI assistants working on this codebase. Follow these rules to produce code that passes all automated checks and fits the existing patterns.

---

## Architecture

**Astro 6** static-first site with **React 19** islands. Most pages are prerendered at build time. Pages behind auth (`/app`, `/admin`) use `prerender = false` for on-demand SSR via the **Vercel** adapter.

**Authentication** is handled by **Clerk** (`@clerk/astro`). The integration injects `<ClerkProvider>` automatically — never add it manually. Route protection lives in `src/middleware.ts` using `clerkMiddleware` and `createRouteMatcher`.

**Data** comes from **Supabase** (optional, with graceful fallback) and **Astro Content Collections** (Markdown/MDX in `src/content/`). Client-side fetching uses **TanStack Query** inside React islands.

**Styling** uses **Tailwind CSS 4** with **DaisyUI 5** (theme: `corporate`). No CSS modules, no styled-components, no inline styles in React. All values must use design tokens — see the **Design Tokens & CSS** section below.

---

## Design Tokens & CSS

**All styling MUST use semantic tokens.** Never use arbitrary Tailwind bracket values (`rounded-[1.75rem]`, `tracking-[0.2em]`, `text-[#hex]`). Use DaisyUI semantic tokens, Tailwind's built-in scale, or the project's custom tokens.

### Custom tokens (defined in `src/styles/global.css` via `@theme`)

| Token | Utility class | Value | Use for |
|-------|--------------|-------|---------|
| `--radius-card` | `rounded-card` | 1.75rem | Card containers, panels |
| `--radius-card-lg` | `rounded-card-lg` | 2rem | Large card wrappers (page template, briefs) |
| `--letter-spacing-caps` | `tracking-caps` | 0.2em | Uppercase section labels |

### Color tokens (DaisyUI semantic — always use these)

| Purpose | Token |
|---------|-------|
| Page background | `base-200` |
| Card/panel background | `base-100` |
| Nested surface | `base-200/60` |
| Borders | `base-300`, `base-300/80` |
| Body text | `base-content` |
| Muted text | `base-content/75`, `base-content/70` |
| Primary accent | `primary` |
| Secondary accent | `secondary` |

### Rules

1. **Never use hardcoded hex colors** — No `#fff`, `#000`, `text-[#abc]`. Use DaisyUI tokens.
2. **Never use arbitrary Tailwind bracket values for spacing, radius, or colors** — If a value repeats, define a token in `@theme`.
3. **Use `rounded-card` for cards** — Not `rounded-[1.75rem]` or other arbitrary values.
4. **Use `tracking-caps` for uppercase labels** — Not `tracking-[0.2em]`.
5. **Use `rounded-box` for inner nested elements** — This is DaisyUI's semantic class.
6. **Opacity modifiers are fine** — `text-base-content/75`, `border-base-300/80`, `shadow-base-300/15` are correct usage.
7. **`rounded-3xl` is acceptable** for values matching Tailwind's built-in scale (1.5rem).

### CSS custom classes (defined in `global.css`)

- `.eyebrow` — Uppercase section label (includes font-size, weight, letter-spacing, color)
- `.content-flow` — Article/prose typography grid (includes gap, font-size, line-height)
- `.site-chrome` — Full-height page wrapper

---

## Formatting & Linting

**Biome** is the single tool for formatting and linting. There is no Prettier or ESLint.

| Rule | Value |
|------|-------|
| Indentation | Tabs |
| Line width | 100 characters |
| Quotes (source) | Single |
| Quotes (JSX) | Double |
| Semicolons | Always |
| Trailing commas | Always |
| JSON trailing commas | None |

**Fix command**: `pnpm tooling:fix`

Astro files are linted too, but Biome's `noUnusedImports` and `noUnusedVariables` checks are relaxed for `*.astro` because template usage still produces false positives there. `astro check` remains the backstop for Astro-specific diagnostics.

---

## TypeScript

- Extends `astro/tsconfigs/strict` — strict mode is mandatory.
- JSX uses `react-jsx` transform (no `import React` needed).
- All environment variables must be typed in `src/env.d.ts`.
- Use Zod for runtime validation of external data (env vars, API responses, user input).

---

## File Organization

```
src/config/site.ts    Brand, nav, footer, SEO defaults (single source of truth)
src/components/       Astro components + React islands (.astro, .tsx)
src/components/icons/ Shared flat icon wrapper + curated exports
src/content/          Content collections (Markdown, MDX)
src/layouts/          Page layouts
src/lib/              Shared utilities and API clients
src/lib/server/       Server-only code — never import from React components
src/pages/            File-based routes and API endpoints
src/styles/           Global CSS
src/middleware.ts      Clerk route protection
src/env.d.ts          Environment variable types
src/content.config.ts Content collection schemas (Zod)
scripts/              Guard suite and project tooling
```

## Site Config

`src/config/site.ts` exports `site` (brand, nav, footer, SEO defaults) and `pageTitle()` helper. **Never hardcode the brand name, tagline, nav links, or footer copy** in layouts, pages, or components — import from `site.ts` instead.

```ts
import { pageTitle, site } from '../config/site';

// Use site.name, site.tagline, site.nav, site.footer
// Use pageTitle('Stories') → "Stories | Vibe Launch"
```

## Icons

Use the local icon layer in `src/components/icons/`, not ad hoc SVG markup scattered across the app. The scaffold currently uses `iconoir-react`, but components should import from the wrapper so the icon pack remains swappable.

---

## Documentation Superpowers

The `src/content/superpowers/` collection contains two complementary documentation systems:

- `src/content/superpowers/doc-template.mdx` — Use for durable documentation that should remain authoritative beyond the current task.
- `src/content/superpowers/dev-log.mdx` — Use for timestamped development narratives that capture active decision context, experiments, tradeoffs, and debugging history.

The wider AI operating discipline for this repo lives here in `AI.md` and in `CLAUDE.md`, not in the public content collection.

Treat them differently:

- Use the doc template for project docs, feature docs, runbooks, ADRs, and guidelines.
- Use devlogs only when the work is active and the decision trail would be lost in commits alone.
- Do not create a devlog for trivial edits, formatting changes, or self-explanatory fixes.
- When a devlog reveals lasting insight, promote that insight into a durable doc instead of treating the devlog as permanent documentation.

If you create or edit documentation:

1. Prefer the frontmatter structure and semantic hierarchy from `src/content/superpowers/doc-template.mdx`.
2. Keep required sections populated. Do not leave placeholders.
3. Use short paragraphs, bullet-first structure, and parsing-friendly formatting.
4. Keep docs scoped accurately so future context loading stays precise.

If you create or edit a devlog:

1. Follow the frontmatter contract in `src/content/superpowers/dev-log.mdx`.
2. Verify commit SHAs before writing them down.
3. Include `Motivation` and `Changes Made` at minimum.
4. Keep devlogs under `docs/devlog/` and treat them as operationally useful but temporary.

---

## Package Manager

**pnpm only.** An install-time guard (`enforce-pnpm.mjs`) rejects npm and yarn. Use `pnpm add`, `pnpm install`, `pnpm run`.

---

## Guard Suite

A registry-driven validation system runs at pre-commit (via husky) and CI. The registry is `scripts/guard-registry.yml`. The orchestrator is `scripts/guard-all.mjs`.

### Pre-commit guards (bypass → secrets → tooling → lockfile)

- **bypass** — Detects attempts to circumvent guards: `// skip build`, `// disable`, hardcoded `process.exit(0)`, suspicious commit messages. Hard-block.
- **secrets** — Scans `src/` for hardcoded secrets: API keys, database URLs, private keys, bearer tokens. Hard-block.
- **tooling** — Runs `biome check --staged` + `astro check`. Hard-block.
- **lockfile** — Ensures `pnpm-lock.yaml` is updated when `package.json` deps change. Hard-block.

### CI-only guards (adds solid + build)

- **solid** — SOLID/DRY heuristics: files >300 lines, >7 exports, god components (4+ mixed concerns), switch with >5 cases, interfaces with >10 properties, duplicate strings/blocks. Warn-only.
- **build** — Scans `dist/` and `.vercel/output/` for source maps, leaked secret values, oversized JS chunks. Hard-block.

### What this means for AI-generated code

1. **Do not include skip/bypass comments** — `// skip build`, `// temporary bypass`, `// disable for speed` will be flagged.
2. **Do not hardcode any secret values** — Use environment variables. Even test keys will be caught.
3. **Keep files under 300 lines** — Split if needed. guard-solid warns in CI.
4. **Avoid god components** — If a React component uses useQuery + useEffect + useState + fetch (4+ of these), split into container/presenter.
5. **Keep interfaces under 10 properties** — Split large types.
6. **Do not create duplicate string literals** — Extract repeated strings (>3 occurrences, >8 chars) to constants.
7. **Per-file opt-out** — Add `// scaffold-disable-solid-check` only for reviewed exceptions.
8. **Prefer the shared icon layer** — Do not paste new raw SVG blocks into UI components when `src/components/icons/` already fits the need.

---

## Clerk Authentication

Import Clerk React components from `@clerk/astro/react`, not `@clerk/react`:

```astro
import { Show, UserButton, SignInButton } from '@clerk/astro/react';
```

Use `<Show when="signed-in">` and `<Show when="signed-out">` — not the deprecated `<SignedIn>` / `<SignedOut>`.

All Clerk components in `.astro` files need the `client:load` directive:

```astro
<Show when="signed-in" client:load>
  <UserButton client:load />
</Show>
```

Protected routes are defined in `src/middleware.ts`. To add a new protected route, add it to the `createRouteMatcher` array.

---

## Content Collections

Three collections defined in `src/content.config.ts`:

### Blog (`src/content/blog/*.md`)

```
title: string (required)
description: string (required)
publishDate: date (required)
category: 'Strategy' | 'Design' | 'Operations' (required)
featured: boolean (default: false)
author: string (default: site.defaultAuthor)
image: string (optional, for OG image)
tags: string[] (default: [])
```

### Site pages (`src/content/site-pages/*.mdx`)

```
eyebrow: string (required)
title: string (required)
description: string (required)
metaTitle: string (optional)
useContentFlow: boolean (default: true)
actions: array of { label, href, variant } (default: [])
```

### Superpowers (`src/content/superpowers/*.mdx`)

```
title: string (required)
author: string (optional)
date: date (optional)
doc_type: string (optional)
scope: string or string[] (optional)
version: string (optional)
status: string (optional)
owners: string[] (optional)
tags: string[] (optional)
```

The collection uses a loose schema so these docs can carry extra metadata without breaking the build. Rendered at `/superpowers/[slug]`.

When adding new schema fields to any collection, always use `.default()` or `.optional()` so existing content files remain valid.

---

## SEO

The `<SEO>` component (`src/components/SEO.astro`) is used inside `Layout.astro`. For article pages, pass:

```astro
<Layout
  title={pageTitle('Post Title')}
  description="Post description"
  type="article"
  publishDate={post.data.publishDate}
  author={post.data.author}
  image={post.data.image}
  tags={post.data.tags}
>
```

Build-time endpoints:
- `/robots.txt` — Disallows `/app`, `/admin`, `/sign-in`, `/sign-up`, `/api/`
- `/sitemap-index.xml` — Auto-generated, public pages only
- `/llms.txt` — Curated content index for LLM crawlers
- `/llms-full.txt` — Full post content for LLM consumption

---

## Code Formatting

Shiki (`github-light` theme) provides syntax highlighting for fenced code blocks in Markdown/MDX content. Configured in `astro.config.mjs` under `markdown.shikiConfig`.

CSS for code is defined in `src/styles/global.css`:

- **Inline code** (`code` in prose): monospace font, subtle `base-300` background, 0.875em size
- **Fenced code blocks** (`pre`/`.astro-code`): `rounded-card`, `base-300` border, horizontal scroll on mobile
- **Blockquotes**: left border with `primary` color, italic

Use fenced code blocks in blog posts and superpowers docs to show real examples. Include language hints (```ts, ```css, ```yaml, ```html) for proper highlighting.

---

## Responsive Layout

The layout is mobile-first:

- **Header**: Full horizontal nav on desktop (`md:` and up). DaisyUI `dropdown` hamburger menu on mobile. Brand name hides below `sm:`, showing only the short name icon.
- **Content grids**: Default to single column, expand to multi-column at `md:` or `lg:` breakpoints.
- **Footer**: Stacks vertically on mobile, horizontal at `md:`.

When adding new pages or components, always start with the mobile layout and add responsive breakpoints (`sm:`, `md:`, `lg:`) for wider screens.

---

## Environment Variables

All env vars must be:
1. Typed in `src/env.d.ts`
2. Documented in `.env.example`
3. Never hardcoded in source

Public vars use the `PUBLIC_` prefix. Secret vars (server-only) do not.

---

## Common Tasks

**Add a new page**: Create `src/pages/my-page.astro`. Use `Layout` for the wrapper. Add `prerender = false` if it needs runtime data.

**Add a new API endpoint**: Create `src/pages/api/my-endpoint.json.ts`. Export `GET`/`POST` handlers. Add `prerender = false`.

**Add a new React island**: Create `src/components/MyComponent.tsx`. Use in Astro with `<MyComponent client:load />`.

**Add a blog post**: Create `src/content/blog/my-post.md` with the required frontmatter fields.

**Add durable documentation**: Start from `src/content/superpowers/doc-template.mdx`, keep the frontmatter accurate, and prefer links over duplicated sources of truth.

**Add a devlog**: Only when a task spans multiple sessions or needs non-obvious rationale. Follow `src/content/superpowers/dev-log.mdx` and place entries under `docs/devlog/`.

**Protect a route**: Add the pattern to `createRouteMatcher` in `src/middleware.ts`.

**Add an env var**: Add to `.env.example`, type in `src/env.d.ts`, validate with Zod if needed.
