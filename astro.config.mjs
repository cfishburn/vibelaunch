// @ts-check

import mdx from '@astrojs/mdx';
import react from '@astrojs/react';
import sitemap from '@astrojs/sitemap';
import vercel from '@astrojs/vercel';
import clerk from '@clerk/astro';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'astro/config';

const tailwind = /** @type {any} */ (tailwindcss);
const siteUrl = process.env.SITE_URL?.trim() || undefined;

// https://astro.build/config
export default defineConfig({
	site: siteUrl,
	integrations: [
		clerk(),
		mdx(),
		react(),
		...(siteUrl
			? [
					sitemap({
						filter: (page) =>
							!page.includes('/app') &&
							!page.includes('/admin') &&
							!page.includes('/sign-in') &&
							!page.includes('/sign-up') &&
							!page.includes('/api/'),
					}),
				]
			: []),
	],
	adapter: vercel(),
	vite: {
		plugins: [tailwind()],
	},
});
