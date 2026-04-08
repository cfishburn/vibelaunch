import type { APIRoute } from 'astro';
import { z } from 'zod';

import { type BriefsResponse, fallbackBriefs } from '../../lib/briefs';
import { getSupabaseClient } from '../../lib/supabase';

const databaseBriefSchema = z.object({
	slug: z.string(),
	title: z.string(),
	summary: z.string(),
	category: z.enum(['Editorial', 'Research', 'Events']),
	published_at: z.string(),
	cta_href: z.string(),
	cta_label: z.string(),
});

type DatabaseBrief = z.infer<typeof databaseBriefSchema>;

export const prerender = false;

function buildFallbackResponse(syncedAt: string) {
	return response({
		source: 'fallback',
		items: fallbackBriefs,
		syncedAt,
	});
}

function mapDatabaseBrief(item: DatabaseBrief) {
	return {
		slug: item.slug,
		title: item.title,
		summary: item.summary,
		category: item.category,
		publishedAt: item.published_at,
		ctaHref: item.cta_href,
		ctaLabel: item.cta_label,
	};
}

function response(payload: BriefsResponse) {
	return new Response(JSON.stringify(payload), {
		headers: {
			'content-type': 'application/json; charset=utf-8',
			'cache-control': 'public, s-maxage=60, stale-while-revalidate=300',
		},
	});
}

export const GET: APIRoute = async () => {
	try {
		const supabase = getSupabaseClient();
		const syncedAt = new Date().toISOString();

		if (!supabase) {
			return buildFallbackResponse(syncedAt);
		}

		const { data, error } = await supabase
			.from('briefs')
			.select('slug, title, summary, category, published_at, cta_href, cta_label')
			.order('published_at', { ascending: false })
			.limit(6);

		if (error || !data?.length) {
			return buildFallbackResponse(syncedAt);
		}

		const parsed = z.array(databaseBriefSchema).safeParse(data);

		if (!parsed.success) {
			console.error('[briefs.json] Invalid briefs payload from Supabase.', parsed.error.issues);
			return buildFallbackResponse(syncedAt);
		}

		const items = parsed.data.map(mapDatabaseBrief);

		return response({
			source: 'supabase',
			items,
			syncedAt,
		});
	} catch (error) {
		console.error('[briefs.json] Falling back to local briefs.', error);
		return buildFallbackResponse(new Date().toISOString());
	}
};
