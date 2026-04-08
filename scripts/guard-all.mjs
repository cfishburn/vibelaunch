#!/usr/bin/env node
/**
 * guard-all.mjs — Guard Suite Runner
 *
 * @guard       all
 * @layer       orchestration
 * @mode        runner
 * @scope       all configured guards
 * @triggers    pre-commit, ci, manual
 *
 * Orchestrates all guards defined in guard-registry.yml.
 *
 * Usage:
 *   node scripts/guard-all.mjs                     # Run all pre-commit guards
 *   node scripts/guard-all.mjs --phase ci          # Run all CI guards
 *   node scripts/guard-all.mjs --layer security    # Run only security guards
 *   node scripts/guard-all.mjs --json              # Structured output
 *   node scripts/guard-all.mjs --warn-only         # Override all to warn-only
 *
 * Exit codes: 0 = all passed, 1 = at least one guard failed
 * Compatible: Node >=18, Bun >=1
 */
import { runAll } from './guard-lib.mjs';

const args = process.argv.slice(2);

function flagValue(name) {
	const idx = args.indexOf(name);
	return idx !== -1 && idx + 1 < args.length ? args[idx + 1] : null;
}

const opts = {
	phase: flagValue('--phase') || 'pre-commit',
	layer: flagValue('--layer') || null,
	warnOnly: args.includes('--warn-only'),
	json: args.includes('--json'),
};

const { passed, results } = await runAll(opts);

if (opts.json) {
	console.log(JSON.stringify({ passed, results }, null, 2));
}

console.error(`\n${'═'.repeat(64)}`);
console.error(passed ? 'All guards passed.' : 'One or more guards FAILED.');
console.error(`${'═'.repeat(64)}\n`);

const failed = results.filter((r) => !r.pass);
if (failed.length > 0) {
	console.error('Failed guards:');
	for (const r of failed) {
		console.error(`  - guard:${r.guard}${r.exitCode ? ` (exit ${r.exitCode})` : ''}`);
	}
	console.error('');
}

process.exit(passed ? 0 : 1);
