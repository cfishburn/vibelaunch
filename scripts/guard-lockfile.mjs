#!/usr/bin/env node
/**
 * guard-lockfile.mjs — Lockfile Consistency Guard
 *
 * @guard       lockfile
 * @layer       architecture
 * @mode        hard-block
 * @triggers    pre-commit
 *
 * Validates that dependency manifest changes are accompanied by lockfile updates.
 * Ensures pnpm-lock.yaml is committed when package.json dependency sections change.
 *
 * Usage:
 *   node scripts/guard-lockfile.mjs --staged              # Check staged files
 *   node scripts/guard-lockfile.mjs --since-upstream       # Compare against upstream
 *
 * Exit codes: 0 = clean, 1 = lockfile out of sync, 2 = missing mode flag
 * Compatible: Node >=18, Bun >=1
 */
import { execFileSync } from 'node:child_process';
import process from 'node:process';

const MANIFEST_PATTERNS = [/^package\.json$/, /^pnpm-workspace\.yaml$/];
const LOCKFILE = 'pnpm-lock.yaml';
const DEP_KEYS = [
	'dependencies',
	'devDependencies',
	'peerDependencies',
	'optionalDependencies',
	'overrides',
	'resolutions',
	'pnpm',
];

function runGit(args) {
	return execFileSync('git', args, { encoding: 'utf8' }).trim();
}

function readChangedFiles(mode) {
	if (mode === 'staged') {
		return runGit(['diff', '--name-only', '--cached'])
			.split('\n')
			.map((f) => f.trim())
			.filter(Boolean);
	}

	if (mode === 'since-upstream') {
		let upstream = '';
		try {
			upstream = runGit(['rev-parse', '--abbrev-ref', '--symbolic-full-name', '@{upstream}']);
		} catch {
			return [];
		}
		if (!upstream) return [];
		return runGit(['diff', '--name-only', `${upstream}...HEAD`])
			.split('\n')
			.map((f) => f.trim())
			.filter(Boolean);
	}

	return [];
}

function tryReadGitFile(spec) {
	try {
		return execFileSync('git', ['show', spec], { encoding: 'utf8' });
	} catch {
		return null;
	}
}

function parseJson(content) {
	if (!content) return null;
	try {
		return JSON.parse(content);
	} catch {
		return null;
	}
}

function isDependencyManifestChange(filePath, mode) {
	if (!filePath.endsWith('package.json')) {
		return true;
	}

	let oldSpec;
	let newSpec;
	if (mode === 'staged') {
		oldSpec = `HEAD:${filePath}`;
		newSpec = `:${filePath}`;
	} else {
		let upstream = '';
		try {
			upstream = runGit(['rev-parse', '--abbrev-ref', '--symbolic-full-name', '@{upstream}']);
		} catch {
			return true;
		}
		if (!upstream) return true;
		oldSpec = `${upstream}:${filePath}`;
		newSpec = `HEAD:${filePath}`;
	}

	const oldJson = parseJson(tryReadGitFile(oldSpec));
	const newJson = parseJson(tryReadGitFile(newSpec));
	if (!oldJson || !newJson) return true;

	return DEP_KEYS.some(
		(key) => JSON.stringify(oldJson[key] ?? {}) !== JSON.stringify(newJson[key] ?? {}),
	);
}

function isManifestFile(filePath) {
	return MANIFEST_PATTERNS.some((pattern) => pattern.test(filePath));
}

function main() {
	const args = new Set(process.argv.slice(2));
	const mode = args.has('--staged')
		? 'staged'
		: args.has('--since-upstream')
			? 'since-upstream'
			: '';
	if (!mode) {
		console.error('[guard:lockfile] missing mode flag. Use --staged or --since-upstream.');
		process.exit(2);
	}

	const changed = readChangedFiles(mode);
	if (changed.length === 0) {
		console.log(`[guard:lockfile] no ${mode === 'staged' ? 'staged' : 'upstream-diff'} changes.`);
		return;
	}

	const manifests = changed.filter(isManifestFile);
	const dependencyManifestChanges = manifests.filter((file) =>
		isDependencyManifestChange(file, mode),
	);
	const lockfileChanged = changed.includes(LOCKFILE);

	if (dependencyManifestChanges.length > 0 && !lockfileChanged) {
		console.error('[guard:lockfile] dependency manifest changed without pnpm-lock.yaml update.');
		console.error('[guard:lockfile] changed manifests:');
		for (const file of dependencyManifestChanges) {
			console.error(`  - ${file}`);
		}
		console.error('[guard:lockfile] run: pnpm install');
		process.exit(1);
	}

	console.log('[guard:lockfile] ok');
}

main();
