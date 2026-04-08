import { QueryClient, QueryClientProvider, useQuery } from '@tanstack/react-query';
import { useState } from 'react';

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
	const response = await fetch('/api/admin/hello.json');

	if (!response.ok) {
		throw new Error('Unable to load admin payload');
	}

	return (await response.json()) as AdminResponse;
}

function formatTimestamp(value: string) {
	return new Intl.DateTimeFormat('en-US', {
		dateStyle: 'medium',
		timeStyle: 'short',
	}).format(new Date(value));
}

function AdminPanelBody() {
	const { data, error, isPending } = useQuery({
		queryKey: ['admin-hello'],
		queryFn: fetchAdminPayload,
		staleTime: 60_000,
	});

	if (isPending) {
		return (
			<div className="flex items-center gap-3 rounded-card border border-base-300 bg-base-100 p-6 shadow-lg shadow-base-300/15">
				<span className="loading loading-spinner loading-md" />
				<p className="text-sm text-base-content/70">Loading admin payload from the BFF...</p>
			</div>
		);
	}

	if (error || !data) {
		return (
			<div role="alert" className="alert alert-warning rounded-card shadow-lg shadow-base-300/15">
				<span>The admin payload could not be loaded.</span>
			</div>
		);
	}

	return (
		<div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
			<div className="rounded-card border border-base-300 bg-base-100 p-6 shadow-lg shadow-base-300/15">
				<p className="text-sm font-semibold uppercase tracking-caps text-primary">Admin payload</p>
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
					<p className="text-sm font-semibold uppercase tracking-caps text-primary">Admin hello</p>
					<p className="mt-4 text-lg leading-8 text-base-content/80">
						Admin access is being granted to{' '}
						<strong>
							{data.viewer.firstName ?? data.viewer.emailAddress ?? data.viewer.userId}
						</strong>
						.
					</p>
				</div>
				<div className="rounded-card border border-base-300 bg-base-100 p-6 shadow-lg shadow-base-300/15">
					<p className="text-sm font-semibold uppercase tracking-caps text-primary">Guardrails</p>
					<dl className="mt-4 space-y-3 text-sm text-base-content/75">
						<div className="flex items-center justify-between gap-4">
							<dt>Allowlist size</dt>
							<dd>{data.admin.allowlistSize}</dd>
						</div>
						<div className="flex items-center justify-between gap-4">
							<dt>Route</dt>
							<dd>{data.admin.route}</dd>
						</div>
						<div className="flex items-center justify-between gap-4">
							<dt>Served at</dt>
							<dd>{formatTimestamp(data.admin.servedAt)}</dd>
						</div>
					</dl>
				</div>
			</div>
		</div>
	);
}

export default function AdminPanel() {
	const [queryClient] = useState(() => new QueryClient());

	return (
		<QueryClientProvider client={queryClient}>
			<AdminPanelBody />
		</QueryClientProvider>
	);
}
