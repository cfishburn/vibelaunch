import { getCollection } from 'astro:content';
import type { APIRoute } from 'astro';
import { site as siteConfig, toAbsoluteUrl } from '../config/site';

export const prerender = true;

export const GET: APIRoute = async ({ site }) => {
	const posts = await getCollection('blog');
	const sorted = posts.sort((a, b) => b.data.publishDate.getTime() - a.data.publishDate.getTime());

	const sections: string[] = [
		`# ${siteConfig.name} — ${siteConfig.llms.fullContentLabel}`,
		'',
		`> ${siteConfig.llms.fullContentDescription}`,
		'',
	];

	for (const post of sorted) {
		const url = toAbsoluteUrl(`/stories/${post.id}/`, site) ?? `/stories/${post.id}/`;
		sections.push(`## ${post.data.title}`);
		sections.push('');
		sections.push(`URL: ${url}`);
		sections.push(`Published: ${post.data.publishDate.toISOString().split('T')[0]}`);
		sections.push(`Category: ${post.data.category}`);
		if (post.data.tags.length > 0) {
			sections.push(`Tags: ${post.data.tags.join(', ')}`);
		}
		sections.push('');
		sections.push(post.body ?? '');
		sections.push('');
		sections.push('---');
		sections.push('');
	}

	return new Response(sections.join('\n'), {
		headers: { 'content-type': 'text/plain; charset=utf-8' },
	});
};
