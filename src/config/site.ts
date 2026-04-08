/**
 * site.ts — Single source of truth for scaffold identity, navigation, and SEO defaults.
 *
 * Forks should customize this file first instead of editing layouts, metadata helpers,
 * or crawler-facing routes one by one.
 */

import { agenticScaffoldWorkflowRoute } from '../lib/agentic-scaffold-workflow';

export const site = {
	name: 'Vibe Launch',
	shortName: 'VL',
	domain: 'vibelaunch.ai',
	locale: 'en',
	theme: 'light',
	darkTheme: 'dark',
	tagline: 'Keep the speed. Lose the vibe-coding entropy.',
	description:
		'Open-source Astro starter and playbook for teams escaping Lovable, Bolt, Replit, or prompt-sprawl before the repo turns feral. Guardrails, docs, motion tokens, design tokens, and a small auth/BFF reference implementation included.',
	defaultAuthor: 'Vibe Launch',
	defaultImage: undefined as string | undefined,
	seo: {
		robots: 'index, follow, max-image-preview:large',
		ogLocale: 'en_US',
		themeColorLight: '#f5f5f7',
		themeColorDark: '#23242b',
		llmsIndexPath: '/llms.txt',
	},
	auth: {
		signInLabel: 'Sign in',
		signUpLabel: 'Create account',
	},
	footer: {
		left: 'A way out of vibe-coding chaos that does not require starting over from scratch.',
		right: 'Astro, Clerk, TanStack Query, DaisyUI, Vercel, Supabase.',
	},
	llms: {
		fullContentLabel: 'Full Content',
		fullContentDescription: 'Complete text of all published stories.',
	},
	stories: {
		indexEyebrow: 'Field notes',
		indexTitle: 'What you learn after the vibes stop being fun.',
		indexDescription:
			'Notes from the part nobody advertises: taking an AI-assisted prototype and turning it into a codebase that does not punish the next person who touches it.',
		backLabel: 'Back to stories',
		openLabel: 'Read note',
	},
	nav: [
		{ label: 'Home', href: '/', icon: 'home' },
		{ label: 'Exit plan', href: agenticScaffoldWorkflowRoute, icon: 'playbook' },
		{ label: 'Standards', href: '/superpowers', icon: 'docs' },
		{ label: 'Demo app', href: '/app', icon: 'app' },
		{ label: 'Field notes', href: '/stories', icon: 'stories' },
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
