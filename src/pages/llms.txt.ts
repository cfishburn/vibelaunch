import { getCollection } from 'astro:content';
import type { APIRoute } from 'astro';
import { site as siteConfig, toAbsoluteUrl } from '../config/site';

export const prerender = true;

export const GET: APIRoute = async ({ site }) => {
	const posts = await getCollection('blog');
	const sorted = posts.sort((a, b) => b.data.publishDate.getTime() - a.data.publishDate.getTime());

	const lines: string[] = [
		`# ${siteConfig.name}`,
		'',
		`> ${siteConfig.description}`,
		'',
		'## Stories',
		'',
	];

	for (const post of sorted) {
		const url = toAbsoluteUrl(`/stories/${post.id}/`, site) ?? `/stories/${post.id}/`;
		lines.push(`- [${post.data.title}](${url}): ${post.data.description}`);
	}

	lines.push('');
	lines.push('## Optional');
	lines.push('');
	lines.push(
		`- [${siteConfig.llms.fullContentLabel}](${toAbsoluteUrl('/llms-full.txt', site) ?? '/llms-full.txt'}): ${siteConfig.llms.fullContentDescription}`,
	);
	lines.push('');

	return new Response(lines.join('\n'), {
		headers: { 'content-type': 'text/plain; charset=utf-8' },
	});
};
