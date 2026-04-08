import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';
import { site } from './config/site';

const sitePageAction = z.object({
	label: z.string(),
	href: z.string(),
	variant: z.enum(['primary', 'outline', 'ghost']).default('primary'),
});

const sitePages = defineCollection({
	loader: glob({ pattern: '**/*.mdx', base: './src/content/site-pages' }),
	schema: z.object({
		eyebrow: z.string(),
		title: z.string(),
		description: z.string(),
		metaTitle: z.string().optional(),
		useContentFlow: z.boolean().default(true),
		actions: z.array(sitePageAction).default([]),
	}),
});

const blog = defineCollection({
	loader: glob({ pattern: '**/*.md', base: './src/content/blog' }),
	schema: z.object({
		title: z.string(),
		description: z.string(),
		publishDate: z.coerce.date(),
		category: z.enum(['Strategy', 'Design', 'Operations']),
		featured: z.boolean().default(false),
		author: z.string().default(site.defaultAuthor),
		image: z.string().optional(),
		tags: z.array(z.string()).default([]),
	}),
});

export const collections = { blog, sitePages };
