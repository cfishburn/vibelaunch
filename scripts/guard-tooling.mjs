#!/usr/bin/env node
/**
 * guard-tooling.mjs — Scaffold Tooling Guard
 *
 * @guard       tooling
 * @layer       quality
 * @mode        hard-block
 * @triggers    pre-commit, ci
 *
 * Runs the project's lint, format, and type-check tooling as a guard step.
 * Replaces the old profiles.mjs approach with a proper guard that integrates
 * with the registry-based orchestrator.
 *
 * Pre-commit:  biome staged check + astro check
 * CI:          biome full check + astro check + astro build
 *
 * Usage:
 *   node scripts/guard-tooling.mjs                    # pre-commit (default)
 *   node scripts/guard-tooling.mjs --phase ci         # CI mode (includes build)
 *
 * Exit codes: 0 = all steps passed, 1 = a step failed
 * Compatible: Node >=18, Bun >=1
 */
import { spawn } from 'node:child_process';

const args = process.argv.slice(2);

function flagValue(name) {
	const idx = args.indexOf(name);
	return idx !== -1 && idx + 1 < args.length ? args[idx + 1] : null;
}

const phase = flagValue('--phase') || 'pre-commit';

const STEPS = {
	'pre-commit': [
		{ label: 'Biome staged check', command: 'pnpm', args: ['run', 'tooling:staged'] },
		{ label: 'Astro type and content check', command: 'pnpm', args: ['run', 'check'] },
	],
	ci: [
		{ label: 'Biome project check', command: 'pnpm', args: ['run', 'tooling:check'] },
		{ label: 'Astro type and content check', command: 'pnpm', args: ['run', 'check'] },
		{ label: 'Astro production build', command: 'pnpm', args: ['run', 'build'] },
	],
};

const steps = STEPS[phase] || STEPS['pre-commit'];

function runStep(step) {
	return new Promise((resolve, reject) => {
		console.log(`\n  [tooling] ${step.label}`);
		console.log(`  [tooling] ${step.command} ${step.args.join(' ')}`);

		const child = spawn(step.command, step.args, {
			stdio: 'inherit',
			shell: process.platform === 'win32',
		});

		child.on('error', reject);
		child.on('exit', (code) => {
			if (code === 0) {
				resolve();
				return;
			}
			reject(new Error(`${step.label} failed with exit code ${code ?? 1}.`));
		});
	});
}

async function main() {
	for (const step of steps) {
		await runStep(step);
	}
	console.log(`\nguard:tooling — all ${phase} steps passed.`);
}

main().catch((e) => {
	console.error(`\nguard:tooling — ${e.message}`);
	process.exit(1);
});
