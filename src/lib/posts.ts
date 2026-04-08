import { type CollectionEntry, getCollection } from 'astro:content';

export { formatDate } from './dates';

export type BlogEntry = CollectionEntry<'blog'>;

export async function getAllPosts() {
	const posts = await getCollection('blog');

	return posts.sort((left, right) => {
		return right.data.publishDate.getTime() - left.data.publishDate.getTime();
	});
}

export async function getFeaturedPosts() {
	const posts = await getAllPosts();
	return posts.filter((post) => post.data.featured);
}
