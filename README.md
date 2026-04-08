# Vibe Launch

An opinionated Astro starter that ships with everything an AI coding assistant needs to work effectively on your project from day one.

Most scaffolds give you a tech stack. This one gives you a **workflow** — AI guardrails, guard scripts, documentation standards, design tokens, site config, SEO, and content collections that are structured so AI tools produce code that fits the codebase on the first try.

**Domain:** [vibelaunch.ai](https://vibelaunch.ai)

## Why this exists

AI coding assistants generate better code when they have clear constraints. A `CLAUDE.md` file, a guard suite that rejects bad patterns at commit time, and a design token system that eliminates arbitrary values all reduce the back-and-forth between you and your AI tool.

This scaffold demonstrates how to set that up for a real Astro project with authentication, content collections, and a deployment pipeline — then teaches you the process with a step-by-step playbook.

## What's included

| Layer | What | Why |
|-------|------|-----|
| **AI guardrails** | `CLAUDE.md`, `AI.md` | Tell AI assistants your conventions, rules, and patterns |
| **Guard suite** | 6 registry-driven guards | Catch secrets, bypass attempts, style violations, oversized files at commit time |
| **Documentation standards** | `src/content/superpowers/doc-template.mdx`, `src/content/superpowers/dev-log.mdx` | Durable doc template plus a selective devlog standard |
| **Agentic playbook** | `/how-to-scaffold-an-agentic-coding-project` | Step-by-step prompt workflow for reproducing this scaffold from scratch |
| **Docs library** | `/superpowers` | Public landing page for the documentation standards used by the starter |
| **Design tokens** | `@theme` block + DaisyUI semantic tokens | Eliminate arbitrary CSS values — AI always picks the right class |
| **Icons** | `iconoir-react` + `src/components/icons/` wrapper | One flat icon vocabulary without scattered custom SVGs |
| **Site config** | `src/config/site.ts` | Single source of truth for brand, domain, nav, footer, SEO defaults |
| **SEO** | OG tags, Twitter Cards, JSON-LD, sitemap, robots.txt | Built into the layout, not bolted on |
| **LLM discovery** | `/llms.txt`, `/llms-full.txt` | Help AI search engines find and cite your content |
| **Code formatting** | Shiki `github-light` syntax highlighting | Styled code blocks and inline code in all content |
| **Responsive** | Mobile-first with DaisyUI dropdown nav | Hamburger menu on mobile, full nav on desktop |
| **Auth** | Clerk middleware + protected routes | BFF pattern with Astro API routes between browser and backend |
| **Content** | Markdown blog + MDX site pages + superpowers docs | Typed with Zod schemas, validated at build time |
| **Quality** | Biome (lint + format), TypeScript strict, Astro check | One tool for formatting, one for types, no config drift |

## Quick start

```sh
pnpm install
cp .env.example .env.local
pnpm dev
```

Auth and Supabase are optional — the site boots without any environment variables.

## Commands

```sh
pnpm dev                # Dev server
pnpm build              # Production build
pnpm check              # Astro type + content check
pnpm smoke:public       # Build-output smoke test for key public routes
pnpm format             # Biome auto-format
pnpm guard:pre-commit   # Run pre-commit guard suite
pnpm guard:ci           # Run full CI guard suite
```

## Project shape

```
CLAUDE.md                 AI guardrails for Claude Code
AI.md                     AI guardrails for any assistant
src/
  config/site.ts          Brand, domain, nav, footer, SEO defaults
  components/             Astro + React components
    icons/                Shared flat icon wrapper + curated exports
    PageActions.astro     Shared site-page action renderer
    SitePageContent.astro Shared content-flow wrapper for MDX-backed pages
    PromptWorkflow.tsx    Interactive playbook step viewer
    SEO.astro             OpenGraph, Twitter Cards, JSON-LD
  content/                Markdown/MDX content collections
    blog/                 Blog posts (Markdown)
    site-pages/           Site pages (MDX)
    superpowers/          Doc template + devlog standard
  layouts/Layout.astro    Base layout with responsive nav + SEO
  lib/                    Utilities and API clients
    dates.ts              Shared date and date-time formatters
    server/               Server-only code
    agentic-scaffold-workflow.ts  Playbook step data
    superpower-docs.ts    Superpowers route helpers
  pages/                  File-based routes and API endpoints
    how-to-scaffold-an-agentic-coding-project.astro
    superpowers/index.astro
    superpowers/[slug].astro
    llms.txt.ts, llms-full.txt.ts, robots.txt.ts
  styles/global.css       Tailwind + DaisyUI + design tokens + code formatting
  middleware.ts           Clerk auth route protection
docs/
  developer-setup.md      Editor + CLI recommendations for contributors
scripts/
  guard-registry.yml      Guard suite configuration
  guard-all.mjs           Orchestrator
  guard-*.mjs             Individual guards
```

## Guard suite

Pre-commit hooks run automatically via husky. Guards are defined in `scripts/guard-registry.yml`.

| Guard | Catches | Phase |
|-------|---------|-------|
| **bypass** | Skip comments, hardcoded exits, bypass attempts | Pre-commit + CI |
| **secrets** | API keys, DB URLs, private keys in source | Pre-commit + CI |
| **tooling** | Biome lint/format errors, TypeScript issues | Pre-commit + CI |
| **lockfile** | package.json changed without lockfile update | Pre-commit |
| **solid** | Files >300 lines, god components, fat interfaces | CI (warn-only) |
| **build** | Source maps, leaked secrets in dist/ | CI |

`guard:ci` now includes a build-output smoke pass for the key public routes after the production build completes.

## AI guardrails

The project ships with two guardrail documents:

- **`CLAUDE.md`** — Loaded automatically by Claude Code. Concise rules, commands, and patterns.
- **`AI.md`** — Comprehensive reference for any AI assistant. Architecture, design tokens, guard system, content schemas, documentation standards, common tasks.

These files tell AI tools how to:
- Format code (tabs, single quotes, semicolons — Biome enforced)
- Use design tokens instead of arbitrary values
- Import Clerk components correctly
- Keep files under 300 lines
- Avoid hardcoding secrets or brand strings
- Structure new pages, components, and API endpoints
- Decide when to create durable docs versus ephemeral devlogs

## Design tokens

All CSS uses semantic tokens. No arbitrary bracket values (`rounded-[1.75rem]`). Custom tokens are defined in `src/styles/global.css` via Tailwind v4's `@theme`:

| Class | Value | Use for |
|-------|-------|---------|
| `rounded-card` | 1.75rem | Card containers |
| `rounded-card-lg` | 2rem | Large wrappers |
| `tracking-caps` | 0.2em | Uppercase labels |

Colors always use DaisyUI semantic tokens (`base-100`, `base-content`, `primary`, etc.).

## Icons

Use the shared flat icon layer in `src/components/icons/` instead of dropping raw SVG markup into pages and components. The scaffold uses `iconoir-react`, but the rest of the app should import from the local wrapper so forks can replace the icon pack later without touching the whole UI.

## Documentation standards

The `src/content/superpowers/` collection contains two high-leverage patterns:

- **`doc-template.mdx`** — Durable documentation template for long-lived project, feature, domain, and guideline docs.
- **`dev-log.mdx`** — Ephemeral devlog standard for active work history, experiments, and decision trails.

The wider AI operating guidance for the repo lives in **`AI.md`** and **`CLAUDE.md`**, not in the public content collection.

## Environment

Copy `.env.example` to `.env.local`. All variables are optional for first boot.

```sh
SITE_URL=                           # Set in deployed envs for canonicals, sitemap, llms.txt
PUBLIC_CLERK_PUBLISHABLE_KEY=        # Clerk auth (optional)
CLERK_SECRET_KEY=                    # Clerk server-side (optional)
CLERK_ADMIN_USER_IDS=                # Comma-separated Clerk user IDs for /admin
PUBLIC_SUPABASE_URL=                 # Supabase data (optional, falls back to local)
PUBLIC_SUPABASE_ANON_KEY=            # Supabase anon key
```

`SITE_URL` is intentionally blank in the scaffold so forks do not accidentally ship `localhost` canonicals or sitemap links.

## Developer setup

See [docs/developer-setup.md](./docs/developer-setup.md) for recommended VS Code extensions, CLI tools, and the first-run verification sequence.

## Tech stack

- [Astro 6](https://astro.build) — Static-first with on-demand SSR
- [React 19](https://react.dev) — Client islands
- [TypeScript 5.9](https://www.typescriptlang.org) — Strict mode
- [Tailwind CSS 4](https://tailwindcss.com) + [DaisyUI 5](https://daisyui.com) — Styling
- [Clerk](https://clerk.com) — Authentication
- [TanStack Query](https://tanstack.com/query) — Client data fetching
- [Supabase](https://supabase.com) — Optional backend data
- [Biome](https://biomejs.dev) — Lint + format
- [Zod](https://zod.dev) — Runtime validation
- [Vercel](https://vercel.com) — Deployment

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md) for contribution guidelines, guard expectations, and what kinds of changes fit the scaffold well.

## License

MIT
