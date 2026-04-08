import type { APIRoute } from 'astro';

export const prerender = true;

export const GET: APIRoute = ({ site }) => {
	const body = [
		'User-agent: *',
		'Allow: /',
		'Disallow: /app',
		'Disallow: /app/',
		'Disallow: /admin',
		'Disallow: /admin/',
		'Disallow: /sign-in',
		'Disallow: /sign-in/',
		'Disallow: /sign-up',
		'Disallow: /sign-up/',
		'Disallow: /api/',
	].join('\n');

	const sitemapLine = site ? `\n\nSitemap: ${new URL('/sitemap-index.xml', site).href}\n` : '\n';

	return new Response(`${body}${sitemapLine}`, {
		headers: { 'content-type': 'text/plain; charset=utf-8' },
	});
};
