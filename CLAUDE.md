# CLAUDE.md — Vibe Launch (vibelaunch.ai)

## Quick Reference

- **Stack**: Astro 6 + React 19 + TypeScript 5.9 (strict)
- **Styling**: Tailwind CSS 4 + DaisyUI 5, theme: `corporate`
- **Auth**: Clerk (`@clerk/astro`) with middleware-based route protection
- **Data**: Supabase (optional), TanStack Query for client fetching
- **Deploy**: Vercel adapter, static-first with on-demand SSR
- **Package manager**: pnpm (enforced — npm/yarn will fail at install)
- **Formatter/Linter**: Biome (not Prettier, not ESLint)
- **Code highlighting**: Shiki `github-light`

## Commands

```sh
pnpm dev              # Local dev server
pnpm build            # Production build
pnpm check            # Astro type + content check
pnpm format           # Biome auto-format
pnpm tooling:fix      # Biome lint + format fix
pnpm guard:pre-commit # Run pre-commit guard suite
pnpm guard:ci         # Run full CI guard suite
```

## Code Style (Biome enforced)

- **Tabs** for indentation, 100-char line width
- **Single quotes** in source, **double quotes** in JSX attributes
- **Always semicolons**, **always trailing commas**
- Run `pnpm format` before committing if unsure

## Design Tokens

**All CSS must use semantic tokens.** Never use arbitrary bracket values.

- Colors: DaisyUI tokens only (`base-100`, `base-content`, `primary`, etc.)
- Card radius: `rounded-card` (1.75rem) or `rounded-card-lg` (2rem)
- Uppercase labels: `tracking-caps` (0.2em)
- Inner panels: `rounded-box` (DaisyUI)
- Custom tokens defined in `src/styles/global.css` via `@theme`

## Project Structure

```
src/
├── config/site.ts   # Brand, domain, nav, footer, SEO defaults (single source of truth)
├── components/      # Astro + React components (React = client islands)
│   ├── icons/       # Shared flat icon wrapper + curated exports
│   ├── SEO.astro    # OpenGraph, Twitter Cards, JSON-LD
│   ├── PageActions.astro   # Shared site-page action renderer
│   ├── SitePageContent.astro # Shared MDX content wrapper
│   └── PromptWorkflow.tsx  # Interactive playbook step viewer
├── content/         # Markdown/MDX content collections
│   ├── blog/        # Blog posts (Markdown)
│   └── site-pages/  # Site pages (MDX)
├── layouts/         # Page layouts (Layout.astro is the base, mobile-first responsive)
├── lib/             # Utilities, API clients, helpers
│   ├── server/      # Server-only code (never import from client)
│   ├── dates.ts     # Shared date + date-time formatters
│   ├── agentic-scaffold-workflow.ts  # Playbook step data
│   └── superpower-docs.ts           # Superpowers route helpers
├── pages/           # File-based routes + API endpoints
│   ├── how-to-scaffold-an-agentic-coding-project.astro  # Playbook page
│   └── superpowers/[slug].astro  # Superpowers doc renderer
├── styles/          # Global CSS (Tailwind + DaisyUI + code formatting)
├── middleware.ts     # Clerk auth route protection
├── env.d.ts         # Environment variable types
└── content.config.ts # Content collection schemas (blog, sitePages, superpowers)
src/content/superpowers/ # Durable doc template + devlog standard
scripts/             # Guard suite + project tooling (not app code)
```

## Site Config

`src/config/site.ts` is the single source of truth for brand name, domain, tagline, nav links, footer copy, and SEO defaults. Import `site` and `pageTitle()` from there. Never hardcode brand strings in components or pages.

## Icons

Use `src/components/icons/` instead of hand-rolled SVGs in components or pages. The app should depend on the local icon wrapper, not directly on the package, so forks can swap icon packs later without broad UI churn.

## Documentation Superpowers

Use the files in `src/content/superpowers/` intentionally:

- `src/content/superpowers/doc-template.mdx` for durable docs that should remain authoritative
- `src/content/superpowers/dev-log.mdx` for active work history, experiments, and decision trails while implementation is still fresh

The wider AI operating discipline for the repo lives in `AI.md` and this file, not in the public content collection.

Rule of thumb:

- durable docs explain the system
- devlogs explain the journey that got the system there
- trivial changes do not need a devlog
- lasting lessons from a devlog should be promoted into permanent docs

## Rules

### Never do these

1. **Never hardcode secrets** — guard-secrets blocks API keys, DB URLs, private keys in source. Use env vars.
2. **Never skip or bypass guards** — guard-bypass detects `// skip`, `// disable`, `process.exit(0)` hacks. The commit will be rejected.
3. **Never use npm or yarn** — `enforce-pnpm.mjs` blocks install. Only `pnpm`.
4. **Never import server-only code in client components** — `src/lib/server/` is backend-only.
5. **Never put `<ClerkProvider>` in components** — the `@clerk/astro` integration handles it automatically.
6. **Never use `<SignedIn>` / `<SignedOut>`** — use `<Show when="signed-in">` / `<Show when="signed-out">` from `@clerk/astro/react`.
7. **Never commit `.env` files** — they are gitignored. Use `.env.example` for templates.
8. **Never use arbitrary Tailwind bracket values** — No `rounded-[1.75rem]`, `tracking-[0.2em]`, `text-[#hex]`. Use tokens from the `@theme` block or DaisyUI semantic classes.

### Always do these

1. **Type new env vars** in `src/env.d.ts` and add to `.env.example`.
2. **Validate external inputs with Zod** — see `src/lib/supabase.ts` for the pattern.
3. **Use `prerender = false`** on pages that need runtime data (auth, dynamic API). Default is static.
4. **Pass SEO props through Layout** — use the `type`, `publishDate`, `author`, `image`, `tags` props for article pages.
5. **Add new content fields to `src/content.config.ts`** with defaults or as optional so existing files stay valid.
6. **Run `pnpm check`** after modifying Astro components or content schemas.
7. **Use `src/content/superpowers/doc-template.mdx`** when writing durable docs or standards.
8. **Use `src/content/superpowers/dev-log.mdx` selectively** for active work that needs rationale beyond commits.
9. **Prefer `src/components/icons/`** over inline SVG markup in app UI.

## Guard Suite

Pre-commit runs automatically via husky. The guards are defined in `scripts/guard-registry.yml`.

| Guard | What it catches | Blocks commit? |
|-------|----------------|:--------------:|
| bypass | Skip comments, hardcoded exits, bypass code | Yes |
| secrets | Hardcoded API keys, DB URLs, private keys | Yes |
| tooling | Biome lint/format errors, Astro type errors | Yes |
| lockfile | package.json changed without pnpm-lock.yaml | Yes |
| solid | Files >300 lines, god components, fat interfaces | No (warn-only, CI) |
| build | Source maps, leaked secrets in dist/ | Yes (CI only) |

If a guard fails, read the output — it tells you exactly what to fix.

## Content Collections

Three collections defined in `src/content.config.ts`:

- **blog** — `src/content/blog/*.md` (title, description, publishDate, category, featured, author, image, tags)
- **sitePages** — `src/content/site-pages/*.mdx` (eyebrow, title, description, metaTitle, useContentFlow, actions)
- **superpowers** — `src/content/superpowers/*.mdx` (title, author, date, doc_type, scope, version, status, owners, tags, plus a loose schema for extra metadata)

## Auth Pattern

Protected routes are defined in `src/middleware.ts` using `createRouteMatcher`. To protect a new route, add it to the matcher array. Clerk components import from `@clerk/astro/react` with `client:load` directive.

## SEO

The `<SEO>` component in `src/components/SEO.astro` handles OpenGraph, Twitter Cards, canonical URLs, and JSON-LD. It's wired through `Layout.astro` — pass `type="article"` and article metadata for blog posts.

Build-time endpoints generate `/robots.txt`, `/sitemap-index.xml`, `/llms.txt`, and `/llms-full.txt`.

## Layout

The header is responsive: full horizontal nav on desktop (`md:` and up), DaisyUI dropdown hamburger menu on mobile. Brand name hides below `sm:`, showing only the short name icon.
