import { Icon, TerminalIcon } from './icons';

interface QueryErrorNoticeProps {
	title: string;
	message: string;
	onRetry?: () => void;
}

export default function QueryErrorNotice({ title, message, onRetry }: QueryErrorNoticeProps) {
	return (
		<div
			role="alert"
			className="rounded-card border border-warning/30 bg-warning/10 p-5 shadow-lg shadow-base-300/15"
		>
			<div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
				<div className="min-w-0">
					<div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-caps text-warning">
						<Icon icon={TerminalIcon} className="h-4 w-4" />
						<p>Request error</p>
					</div>
					<p className="mt-3 text-base font-semibold text-base-content">{title}</p>
					<p className="mt-2 text-sm leading-7 text-base-content/75">{message}</p>
				</div>

				{onRetry ? (
					<button type="button" className="btn btn-outline btn-sm" onClick={onRetry}>
						Retry
					</button>
				) : null}
			</div>
		</div>
	);
}
