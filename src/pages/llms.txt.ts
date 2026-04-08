import { getCollection } from 'astro:content';
import type { APIRoute } from 'astro';
import { site as siteConfig, toAbsoluteUrl } from '../config/site';
import { agenticScaffoldWorkflowRoute } from '../lib/agentic-scaffold-workflow';

export const prerender = true;

export const GET: APIRoute = async ({ site }) => {
	const posts = await getCollection('blog');
	const sorted = posts.sort((a, b) => b.data.publishDate.getTime() - a.data.publishDate.getTime());

	const superpowers = await getCollection('superpowers');

	const lines: string[] = [
		`# ${siteConfig.name}`,
		'',
		`> ${siteConfig.description}`,
		'',
		'## Playbook',
		'',
		`- [How to get out of vibe coding without throwing away the useful parts](${toAbsoluteUrl(agenticScaffoldWorkflowRoute, site) ?? agenticScaffoldWorkflowRoute}): A prompt-by-prompt workflow for turning an AI-assisted prototype into a reusable, maintainable starter.`,
		'',
		'## Stories',
		'',
	];

	for (const post of sorted) {
		const url = toAbsoluteUrl(`/stories/${post.id}/`, site) ?? `/stories/${post.id}/`;
		lines.push(`- [${post.data.title}](${url}): ${post.data.description}`);
	}

	lines.push('');
	lines.push('## Documentation standards');
	lines.push('');

	for (const doc of superpowers) {
		const url = toAbsoluteUrl(`/superpowers/${doc.id}/`, site) ?? `/superpowers/${doc.id}/`;
		lines.push(`- [${doc.data.title}](${url}): ${doc.data.description}`);
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
