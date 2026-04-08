import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import type { Brief, BriefCategory, BriefsResponse } from '../lib/briefs';
import { formatDateTime } from '../lib/dates';
import { fetchJson, getRequestErrorMessage } from '../lib/fetch-json';
import QueryErrorNotice from './QueryErrorNotice';
import ReactQueryProvider from './ReactQueryProvider';

const categories: Array<'All' | BriefCategory> = ['All', 'Editorial', 'Research', 'Events'];

async function fetchBriefs() {
	return fetchJson<BriefsResponse>('/api/briefs.json');
}

function BriefsPanelBody() {
	const [activeCategory, setActiveCategory] = useState<'All' | BriefCategory>('All');
	const { data, error, isPending, isFetching, refetch } = useQuery({
		queryKey: ['briefs'],
		queryFn: fetchBriefs,
		staleTime: 60_000,
	});

	const items =
		activeCategory === 'All'
			? (data?.items ?? [])
			: (data?.items ?? []).filter((item) => item.category === activeCategory);

	return (
		<div className="rounded-card-lg border border-base-300 bg-base-100 p-6 shadow-xl shadow-base-300/20">
			<div className="flex flex-col gap-4 border-b border-base-300 pb-5 md:flex-row md:items-center md:justify-between">
				<div>
					<div className="flex items-center gap-3">
						<h3 className="text-xl font-semibold tracking-tight">Briefing feed</h3>
						{data ? (
							<span
								className={`badge ${
									data.source === 'supabase' ? 'badge-primary badge-soft' : 'badge-outline'
								}`}
							>
								{data.source === 'supabase' ? 'Supabase live' : 'Local fallback'}
							</span>
						) : null}
					</div>
					<p className="mt-2 text-sm leading-6 text-base-content/70">
						Fresh notes, research, and event snippets surfaced through a small client island.
					</p>
				</div>
				<div className="flex flex-wrap gap-2">
					{categories.map((category) => (
						<button
							key={category}
							type="button"
							className={`btn btn-sm ${activeCategory === category ? 'btn-primary' : 'btn-ghost'}`}
							onClick={() => setActiveCategory(category)}
						>
							{category}
						</button>
					))}
				</div>
			</div>

			{isPending ? (
				<div className="flex items-center gap-3 py-10 text-sm text-base-content/70">
					<span className="loading loading-spinner loading-md" />
					Loading live briefs...
				</div>
			) : null}

			{error ? (
				<div className="mt-5">
					<QueryErrorNotice
						title="The briefing feed could not be loaded."
						message={getRequestErrorMessage(error, 'Try the request again in a moment.')}
						onRetry={() => void refetch()}
					/>
				</div>
			) : null}

			{!isPending && !error ? (
				<div className="mt-5 space-y-4">
					{items.length === 0 ? (
						<div className="rounded-card border border-base-300 bg-base-200/60 p-5 text-sm leading-7 text-base-content/70">
							No briefs are available for this filter yet.
						</div>
					) : null}

					{items.map((item: Brief) => (
						<article
							key={item.slug}
							className="rounded-box border border-base-300 bg-base-200/60 p-4 transition hover:border-primary/30"
						>
							<div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
								<div className="min-w-0 flex-1 space-y-2">
									<div className="flex flex-wrap items-center gap-2 text-sm text-base-content/60">
										<span className="badge badge-outline badge-sm">{item.category}</span>
										<span>{formatDateTime(item.publishedAt)}</span>
									</div>
									<h4 className="text-lg font-semibold wrap-break-word">{item.title}</h4>
									<p className="leading-7 text-base-content/75">{item.summary}</p>
								</div>
								<a className="btn btn-ghost btn-sm shrink-0 md:self-center" href={item.ctaHref}>
									{item.ctaLabel}
								</a>
							</div>
						</article>
					))}

					<div className="flex items-center justify-between pt-2 text-xs uppercase tracking-caps text-base-content/45">
						<span>{isFetching ? 'Refreshing' : 'Synced'}</span>
						<span>{data ? formatDateTime(data.syncedAt) : 'Not available'}</span>
					</div>
				</div>
			) : null}
		</div>
	);
}

export default function BriefsPanel() {
	return (
		<ReactQueryProvider>
			<BriefsPanelBody />
		</ReactQueryProvider>
	);
}
