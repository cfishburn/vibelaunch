import type { APIRoute } from 'astro';

import { type BriefsResponse, fallbackBriefs } from '../../lib/briefs';
import { getSupabaseClient } from '../../lib/supabase';

interface DatabaseBrief {
	slug: string;
	title: string;
	summary: string;
	category: 'Editorial' | 'Research' | 'Events';
	published_at: string;
	cta_href: string;
	cta_label: string;
}

export const prerender = false;

function response(payload: BriefsResponse) {
	return new Response(JSON.stringify(payload), {
		headers: {
			'content-type': 'application/json; charset=utf-8',
			'cache-control': 'public, s-maxage=60, stale-while-revalidate=300',
		},
	});
}

export const GET: APIRoute = async () => {
	const supabase = getSupabaseClient();

	if (!supabase) {
		return response({
			source: 'fallback',
			items: fallbackBriefs,
			syncedAt: new Date().toISOString(),
		});
	}

	const { data, error } = await supabase
		.from('briefs')
		.select('slug, title, summary, category, published_at, cta_href, cta_label')
		.order('published_at', { ascending: false })
		.limit(6);

	if (error || !data?.length) {
		return response({
			source: 'fallback',
			items: fallbackBriefs,
			syncedAt: new Date().toISOString(),
		});
	}

	const items = (data as DatabaseBrief[]).map((item) => ({
		slug: item.slug,
		title: item.title,
		summary: item.summary,
		category: item.category,
		publishedAt: item.published_at,
		ctaHref: item.cta_href,
		ctaLabel: item.cta_label,
	}));

	return response({
		source: 'supabase',
		items,
		syncedAt: new Date().toISOString(),
	});
};
