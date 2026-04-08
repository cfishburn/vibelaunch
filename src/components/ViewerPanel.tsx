import { QueryClient, QueryClientProvider, useQuery } from '@tanstack/react-query';
import { useState } from 'react';

interface ViewerResponse {
	hello: string;
	viewer: {
		userId: string;
		firstName: string | null;
		emailAddress: string | null;
	};
	bff: {
		route: string;
		servedAt: string;
	};
}

async function fetchViewer() {
	const response = await fetch('/api/viewer.json');

	if (!response.ok) {
		throw new Error('Unable to load viewer profile');
	}

	return (await response.json()) as ViewerResponse;
}

function formatTimestamp(value: string) {
	return new Intl.DateTimeFormat('en-US', {
		dateStyle: 'medium',
		timeStyle: 'short',
	}).format(new Date(value));
}

function ViewerPanelBody() {
	const { data, error, isPending } = useQuery({
		queryKey: ['viewer'],
		queryFn: fetchViewer,
		staleTime: 60_000,
	});

	if (isPending) {
		return (
			<div className="flex items-center gap-3 rounded-card border border-base-300 bg-base-100 p-6 shadow-lg shadow-base-300/15">
				<span className="loading loading-spinner loading-md" />
				<p className="text-sm text-base-content/70">Loading your member payload from the BFF...</p>
			</div>
		);
	}

	if (error || !data) {
		return (
			<div role="alert" className="alert alert-warning rounded-card shadow-lg shadow-base-300/15">
				<span>The member payload could not be loaded.</span>
			</div>
		);
	}

	return (
		<div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
			<div className="rounded-card border border-base-300 bg-base-100 p-6 shadow-lg shadow-base-300/15">
				<p className="text-sm font-semibold uppercase tracking-caps text-primary">Viewer payload</p>
				<h2 className="mt-4 text-3xl font-semibold tracking-tight">{data.hello}</h2>
				<p className="mt-3 leading-8 text-base-content/75">
					This data came from an Astro API route, not directly from the browser to Clerk or
					Supabase.
				</p>
				<div className="mt-6 rounded-box border border-base-300 bg-base-200/60 p-4">
					<pre className="overflow-x-auto text-sm leading-7 text-base-content/75">
						{JSON.stringify(data, null, 2)}
					</pre>
				</div>
			</div>
			<div className="space-y-4">
				<div className="rounded-card border border-base-300 bg-base-100 p-6 shadow-lg shadow-base-300/15">
					<p className="text-sm font-semibold uppercase tracking-caps text-primary">Hello world</p>
					<p className="mt-4 text-lg leading-8 text-base-content/80">
						You are signed in as{' '}
						<strong>
							{data.viewer.firstName ?? data.viewer.emailAddress ?? data.viewer.userId}
						</strong>
						.
					</p>
				</div>
				<div className="rounded-card border border-base-300 bg-base-100 p-6 shadow-lg shadow-base-300/15">
					<p className="text-sm font-semibold uppercase tracking-caps text-primary">BFF boundary</p>
					<dl className="mt-4 space-y-3 text-sm text-base-content/75">
						<div className="flex items-center justify-between gap-4">
							<dt>Route</dt>
							<dd>{data.bff.route}</dd>
						</div>
						<div className="flex items-center justify-between gap-4">
							<dt>Served at</dt>
							<dd>{formatTimestamp(data.bff.servedAt)}</dd>
						</div>
						<div className="flex items-center justify-between gap-4">
							<dt>User ID</dt>
							<dd>{data.viewer.userId}</dd>
						</div>
					</dl>
				</div>
			</div>
		</div>
	);
}

export default function ViewerPanel() {
	const [queryClient] = useState(() => new QueryClient());

	return (
		<QueryClientProvider client={queryClient}>
			<ViewerPanelBody />
		</QueryClientProvider>
	);
}
