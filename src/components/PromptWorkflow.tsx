import { useState } from 'react';
import type { AgenticWorkflowStep } from '../lib/agentic-scaffold-workflow';
import { CheckCircleIcon, CopyIcon, Icon, TerminalIcon } from './icons';

interface PromptWorkflowProps {
	steps: AgenticWorkflowStep[];
}

export default function PromptWorkflow({ steps }: PromptWorkflowProps) {
	const [copiedStepId, setCopiedStepId] = useState<string | null>(null);

	async function handleCopy(step: AgenticWorkflowStep) {
		try {
			await navigator.clipboard.writeText(step.prompt);
			setCopiedStepId(step.id);
			window.setTimeout(() => {
				setCopiedStepId((current) => (current === step.id ? null : current));
			}, 1800);
		} catch {
			setCopiedStepId(null);
		}
	}

	return (
		<div className="space-y-6">
			{steps.map((step, index) => {
				const copied = copiedStepId === step.id;

				return (
					<section
						key={step.id}
						className="motion-lift rounded-card-lg border border-base-300 bg-base-100 p-6 shadow-xl shadow-base-300/15"
						data-reveal="vertical"
					>
						<div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
							<div className="space-y-3">
								<div className="flex flex-wrap items-center gap-3">
									<span className="badge badge-outline">{step.step}</span>
									<span className="text-sm text-base-content/60">Prompt workflow #{index + 1}</span>
								</div>
								<h2 className="text-3xl font-semibold tracking-tight">{step.title}</h2>
								<p className="max-w-3xl leading-8 text-base-content/75">{step.intent}</p>
							</div>

							<button
								type="button"
								className="btn btn-outline btn-sm gap-2 self-start"
								onClick={() => void handleCopy(step)}
								aria-label={`Copy prompt for ${step.title}`}
							>
								<Icon icon={copied ? CheckCircleIcon : CopyIcon} className="h-4 w-4" />
								{copied ? 'Copied' : 'Copy prompt'}
							</button>
						</div>

						<div className="mt-6 grid gap-6 lg:grid-cols-[1fr_0.7fr] xl:grid-cols-[1.2fr_0.8fr]">
							<div className="space-y-4">
								<div className="rounded-card border border-base-300 bg-base-200/60 p-5">
									<div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-caps text-primary">
										<Icon icon={TerminalIcon} className="h-4 w-4" />
										<p>Prompt</p>
									</div>
									<pre className="mt-4 overflow-x-auto whitespace-pre-wrap text-sm leading-7 text-base-content/80">
										<code>{step.prompt}</code>
									</pre>
								</div>
								{step.note ? (
									<div className="rounded-card border border-primary/20 bg-primary/5 p-5">
										<p className="text-sm font-semibold uppercase tracking-caps text-primary">
											Why this matters
										</p>
										<p className="mt-4 leading-8 text-base-content/75">{step.note}</p>
									</div>
								) : null}
							</div>

							<div className="grid gap-4">
								<div className="rounded-card border border-base-300 bg-base-100 p-5">
									<p className="text-sm font-semibold uppercase tracking-caps text-primary">
										Expected result
									</p>
									<ul className="mt-4 space-y-3 text-sm leading-7 text-base-content/75">
										{step.expectedResult.map((item) => (
											<li key={item} className="flex gap-3">
												<span aria-hidden="true" className="mt-2 h-2 w-2 rounded-full bg-primary" />
												<span>{item}</span>
											</li>
										))}
									</ul>
								</div>

								<div className="rounded-card border border-base-300 bg-base-100 p-5">
									<p className="text-sm font-semibold uppercase tracking-caps text-primary">
										What to verify
									</p>
									<ul className="mt-4 space-y-3 text-sm leading-7 text-base-content/75">
										{step.verify.map((item) => (
											<li key={item} className="flex gap-3">
												<span
													aria-hidden="true"
													className="mt-1 inline-flex h-6 w-6 items-center justify-center rounded-full border border-base-300 text-xs font-semibold text-base-content/70"
												>
													✓
												</span>
												<span>{item}</span>
											</li>
										))}
									</ul>
								</div>
							</div>
						</div>
					</section>
				);
			})}
		</div>
	);
}
