export const superpowersRoute = '/superpowers';
export const superpowerOrder = ['doc-template', 'dev-log'] as const;

const superpowerSummaries = {
	'doc-template':
		'A durable documentation template for feature plans, runbooks, guidelines, and other long-lived project context.',
	'dev-log':
		'An operational devlog standard for capturing decisions, tradeoffs, and dead ends while active work is still unfolding.',
} as const;

export function getSuperpowerRoute(slug: string) {
	return `/superpowers/${slug}`;
}

export function getSuperpowerSummary(slug: string): string {
	return (
		superpowerSummaries[slug as keyof typeof superpowerSummaries] ??
		'Structured guidance for running AI-assisted development with less entropy.'
	);
}

export function sortSuperpowers<T extends { id: string }>(docs: T[]): T[] {
	return [...docs].sort((left, right) => {
		const leftIndex = superpowerOrder.indexOf(left.id as (typeof superpowerOrder)[number]);
		const rightIndex = superpowerOrder.indexOf(right.id as (typeof superpowerOrder)[number]);
		const normalizedLeft = leftIndex === -1 ? Number.MAX_SAFE_INTEGER : leftIndex;
		const normalizedRight = rightIndex === -1 ? Number.MAX_SAFE_INTEGER : rightIndex;

		if (normalizedLeft !== normalizedRight) {
			return normalizedLeft - normalizedRight;
		}

		return left.id.localeCompare(right.id);
	});
}
