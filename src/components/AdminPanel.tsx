import { useQuery } from '@tanstack/react-query';
import { formatDateTime } from '../lib/dates';
import { fetchJson, getRequestErrorMessage } from '../lib/fetch-json';
import { DatabaseIcon, Icon, ShieldCheckIcon, TerminalIcon } from './icons';
import QueryErrorNotice from './QueryErrorNotice';
import ReactQueryProvider from './ReactQueryProvider';

interface AdminResponse {
	hello: string;
	viewer: {
		userId: string;
		firstName: string | null;
		emailAddress: string | null;
	};
	admin: {
		allowlistSize: number;
		route: string;
		servedAt: string;
	};
}

async function fetchAdminPayload() {
	return fetchJson<AdminResponse>('/api/admin/hello.json');
}

function AdminPanelBody() {
	const { data, error, isPending, refetch } = useQuery({
		queryKey: ['admin-hello'],
		queryFn: fetchAdminPayload,
		staleTime: 60_000,
	});

	if (isPending) {
		return (
			<div className="flex items-center gap-3 rounded-card border border-base-300 bg-base-100 p-6 shadow-lg shadow-base-300/15">
				<span className="loading loading-spinner loading-md" />
				<p className="text-sm text-base-content/70">
					Loading the admin demo payload from the BFF...
				</p>
			</div>
		);
	}

	if (error || !data) {
		return (
			<QueryErrorNotice
				title="The admin demo payload could not be loaded."
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
					<p>Admin demo payload</p>
				</div>
				<h2 className="mt-4 text-3xl font-semibold tracking-tight">{data.hello}</h2>
				<p className="mt-3 leading-8 text-base-content/75">
					The route and the API are both protected before any privileged logic runs.
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
						<Icon icon={ShieldCheckIcon} className="h-4 w-4" />
						<p>Admin hello</p>
					</div>
					<p className="mt-4 text-lg leading-8 text-base-content/80">
						Admin access is being granted to{' '}
						<strong>
							{data.viewer.firstName ?? data.viewer.emailAddress ?? data.viewer.userId}
						</strong>
						.
					</p>
				</div>
				<div className="rounded-card border border-base-300 bg-base-100 p-6 shadow-lg shadow-base-300/15">
					<div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-caps text-primary">
						<Icon icon={DatabaseIcon} className="h-4 w-4" />
						<p>Guardrails</p>
					</div>
					<dl className="mt-4 space-y-3 text-sm text-base-content/75">
						<div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
							<dt>Allowlist size</dt>
							<dd>{data.admin.allowlistSize}</dd>
						</div>
						<div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
							<dt>Route</dt>
							<dd>{data.admin.route}</dd>
						</div>
						<div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
							<dt>Served at</dt>
							<dd>{formatDateTime(data.admin.servedAt)}</dd>
						</div>
					</dl>
				</div>
			</div>
		</div>
	);
}

export default function AdminPanel() {
	return (
		<ReactQueryProvider>
			<AdminPanelBody />
		</ReactQueryProvider>
	);
}
