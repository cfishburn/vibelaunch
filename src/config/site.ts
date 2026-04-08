/**
 * site.ts — Single source of truth for scaffold identity, navigation, and SEO defaults.
 *
 * Forks should customize this file first instead of editing layouts, metadata helpers,
 * or crawler-facing routes one by one.
 */

export const site = {
	name: 'Vibe Launch',
	shortName: 'VL',
	domain: 'vibelaunch.ai',
	locale: 'en',
	theme: 'corporate',
	tagline: 'Ship AI-friendly projects that your tools already understand.',
	description:
		'Open-source Astro starter with AI guardrails, guard scripts, design tokens, and content collections — so AI coding assistants produce code that fits your codebase on the first try.',
	defaultAuthor: 'Vibe Launch',
	defaultImage: undefined as string | undefined,
	auth: {
		signInLabel: 'Sign in',
		signUpLabel: 'Create account',
	},
	footer: {
		left: 'Ship AI-friendly projects that your tools already understand.',
		right: 'Astro, Clerk, TanStack Query, DaisyUI, Vercel, and Supabase.',
	},
	llms: {
		fullContentLabel: 'Full Content',
		fullContentDescription: 'Complete text of all published stories.',
	},
	stories: {
		indexEyebrow: 'Story index',
		indexTitle: 'How to scaffold a project for reuse with AI.',
		indexDescription:
			'Each post covers a piece of the scaffold: AI guardrails, design tokens, guard scripts, and the patterns that make AI-generated code fit your codebase.',
		backLabel: 'Back to stories',
		openLabel: 'Open',
	},
	nav: [
		{ label: 'Home', href: '/' },
		{ label: 'App', href: '/app' },
		{ label: 'Stories', href: '/stories' },
	],
} as const;

/** Build a page title with the scaffold name suffix. */
export function pageTitle(title?: string): string {
	if (!title) {
		return site.name;
	}

	return title === site.name ? title : `${title} | ${site.name}`;
}

export function toAbsoluteUrl(pathname: string, base?: URL | string | null): string | null {
	if (!base) {
		return null;
	}

	return new URL(pathname, base).href;
}
