import { type CollectionEntry, getEntry, render } from 'astro:content';

export type SitePageEntry = CollectionEntry<'sitePages'>;

export async function getSitePage(id: SitePageEntry['id']) {
	const entry = await getEntry('sitePages', id);

	if (!entry) {
		throw new Error(`Missing site page content entry: ${id}`);
	}

	const { Content } = await render(entry);

	return { entry, Content };
}
