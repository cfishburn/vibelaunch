export type BriefCategory = 'Editorial' | 'Research' | 'Events';

export interface Brief {
	slug: string;
	title: string;
	summary: string;
	category: BriefCategory;
	publishedAt: string;
	ctaHref: string;
	ctaLabel: string;
}

export interface BriefsResponse {
	source: 'supabase' | 'fallback';
	items: Brief[];
	syncedAt: string;
}

export const fallbackBriefs: Brief[] = [
	{
		slug: 'field-notes-april',
		title: 'Field notes from the April editorial sprint',
		summary: 'A compact snapshot of what shipped, what slipped, and what readers reacted to most.',
		category: 'Editorial',
		publishedAt: '2026-04-08T08:00:00.000Z',
		ctaHref: '/stories/welcome-to-the-foundation/',
		ctaLabel: 'Open note',
	},
	{
		slug: 'reader-patterns',
		title: 'Reader behavior trendline',
		summary:
			'The strongest sessions still begin from search, but return visitors are spending longer in related-story loops.',
		category: 'Research',
		publishedAt: '2026-04-07T18:30:00.000Z',
		ctaHref: '/stories/designing-for-reading-depth/',
		ctaLabel: 'View story',
	},
	{
		slug: 'community-office-hours',
		title: 'Community office hours announced',
		summary:
			'A lightweight recurring session for editorial, product, and design questions as the site evolves.',
		category: 'Events',
		publishedAt: '2026-04-05T16:00:00.000Z',
		ctaHref: '/stories/where-interactivity-actually-helps/',
		ctaLabel: 'See details',
	},
];
