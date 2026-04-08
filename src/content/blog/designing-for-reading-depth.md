---
title: Design tokens eliminate AI guesswork
description: When every spacing, radius, and color value is a named token, AI assistants stop inventing arbitrary CSS and start using your system.
publishDate: 2026-04-06
category: Design
featured: true
tags: [design-tokens, tailwind, daisyui]
---

AI coding assistants are good at reading Tailwind classes. They are bad at knowing which values your project actually uses. Without constraints, they will generate `rounded-[14px]`, `tracking-[0.18em]`, and `text-[#334155]` — all reasonable, none matching your system.

Design tokens solve this by naming the values that matter.

### Custom tokens via `@theme`

The scaffold defines project-specific tokens in `global.css` using Tailwind v4's `@theme` block:

```css
@theme {
  --radius-card: 1.75rem;
  --radius-card-lg: 2rem;
  --letter-spacing-caps: 0.2em;
}
```

This creates utility classes that AI tools can discover and use:

- `rounded-card` instead of `rounded-[1.75rem]`
- `rounded-card-lg` instead of `rounded-[2rem]`
- `tracking-caps` instead of `tracking-[0.2em]`

### DaisyUI semantic colors

Every color in the scaffold uses DaisyUI tokens, never raw hex values:

```html
<!-- Correct: semantic tokens -->
<div class="bg-base-100 text-base-content border-base-300">
  <p class="text-base-content/75">Muted text</p>
  <span class="text-primary">Accent</span>
</div>

<!-- Wrong: hardcoded values -->
<div class="bg-white text-gray-900 border-gray-200">
  <p class="text-gray-500">Muted text</p>
</div>
```

### The AI guardrails enforce this

The `AI.md` file includes a dedicated "Design Tokens & CSS" section with a token table, color reference, and seven explicit rules. When an AI assistant reads it, the first rule it encounters is:

> Never use hardcoded hex colors. No `#fff`, `#000`, `text-[#abc]`. Use DaisyUI tokens.

The guard suite reinforces this at CI time — `guard-solid` catches duplicate strings, and code review catches the rest. But the bigger win is that AI tools simply don't produce arbitrary values when the guardrail document says not to.

Tokens are not just about consistency. They are about making the right thing the easy thing, for humans and machines alike.
