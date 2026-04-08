import { useQuery } from '@tanstack/react-query';
import { formatDateTime } from '../lib/dates';
import { fetchJson, getRequestErrorMessage } from '../lib/fetch-json';
import { DatabaseIcon, Icon, TerminalIcon, UserIcon } from './icons';
import QueryErrorNotice from './QueryErrorNotice';
import ReactQueryProvider from './ReactQueryProvider';

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
	return fetchJson<ViewerResponse>('/api/viewer.json');
}

function ViewerPanelBody() {
	const { data, error, isPending, refetch } = useQuery({
		queryKey: ['viewer'],
		queryFn: fetchViewer,
		staleTime: 60_000,
	});

	if (isPending) {
		return (
			<div className="flex items-center gap-3 rounded-card border border-base-300 bg-base-100 p-6 shadow-lg shadow-base-300/15">
				<span className="loading loading-spinner loading-md" />
				<p className="text-sm text-base-content/70">
					Loading the member demo payload from the BFF...
				</p>
			</div>
		);
	}

	if (error || !data) {
		return (
			<QueryErrorNotice
				title="The member demo payload could not be loaded."
				message={getRequestErrorMessage(error, 'Try the request again in a moment.')}
				onRetry={() => void refetch()}
			/>
		);
	}

	return (
		<div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
			<div className="rounded-card border border-base-300 bg-base-100 p-6 shadow-lg shadow-base-300/15">
				<div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-caps text-primary">
					<Icon icon={TerminalIcon} className="h-4 w-4" />
					<p>Member demo payload</p>
				</div>
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
					<div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-caps text-primary">
						<Icon icon={UserIcon} className="h-4 w-4" />
						<p>Hello world</p>
					</div>
					<p className="mt-4 text-lg leading-8 text-base-content/80">
						You are signed in as{' '}
						<strong>
							{data.viewer.firstName ?? data.viewer.emailAddress ?? data.viewer.userId}
						</strong>
						.
					</p>
				</div>
				<div className="rounded-card border border-base-300 bg-base-100 p-6 shadow-lg shadow-base-300/15">
					<div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-caps text-primary">
						<Icon icon={DatabaseIcon} className="h-4 w-4" />
						<p>BFF boundary</p>
					</div>
					<dl className="mt-4 space-y-3 text-sm text-base-content/75">
						<div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
							<dt>Route</dt>
							<dd>{data.bff.route}</dd>
						</div>
						<div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
							<dt>Served at</dt>
							<dd>{formatDateTime(data.bff.servedAt)}</dd>
						</div>
						<div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
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
	return (
		<ReactQueryProvider>
			<ViewerPanelBody />
		</ReactQueryProvider>
	);
}
