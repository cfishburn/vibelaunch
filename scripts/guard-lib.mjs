#!/usr/bin/env node
/**
 * guard-lib.mjs — Shared Guard Library
 *
 * @guard       lib
 * @layer       shared
 * @mode        internal
 * @scope       imported by guard scripts
 * @triggers    n/a
 *
 * Extracted utilities shared across all guard scripts. Eliminates duplicate
 * collectFiles implementations, normalises path handling, provides consistent
 * CLI parsing, structured output, and a unified reporter.
 *
 * Usage:
 *   import { createGuard } from "./guard-lib.mjs";
 *
 *   const guard = createGuard("secrets", {
 *     roots:      ["src"],
 *     extensions: /\.(ts|tsx|js|jsx|mjs)$/i,
 *     skipDirs:   ["node_modules", ".git", "dist"],
 *   });
 *
 *   const files = await guard.collectFiles();
 *   // ... run detectors ...
 *   guard.report(violations);
 *
 * Compatible: Node >=18, Bun >=1
 */
import fs from 'node:fs/promises';
import path from 'node:path';

// ── Shared Constants ───────────────────────────────────────────────────────

/**
 * Directories that should virtually always be skipped.
 * Guards can extend this with domain-specific additions.
 */
export const ALWAYS_SKIP_DIRS = new Set(['node_modules', '.git', 'dist', '.astro', '.turbo']);

/**
 * File patterns that are typically test/story infrastructure.
 */
export const TEST_PATTERNS = /\.(test|spec|stories)\./;

// ── Path Utilities ─────────────────────────────────────────────────────────

/**
 * Normalise a file path for consistent comparisons.
 * Strips leading "./" and normalises separators to forward slashes.
 */
export function normalisePath(p) {
	return path.normalize(p).replace(/\\/g, '/').replace(/^\.\//, '');
}

/**
 * Check whether a normalised path starts with a given prefix.
 *   pathStartsWith("src/lib/foo.ts", "src")  → true
 *   pathStartsWith("scripts/guard.mjs", "src") → false
 */
export function pathStartsWith(filePath, prefix) {
	const normFile = normalisePath(filePath);
	const normPrefix = normalisePath(prefix);
	return normFile === normPrefix || normFile.startsWith(`${normPrefix}/`);
}

/**
 * Check whether a normalised path matches a regex.
 * Always tests forward-slash-normalised paths so regexes don't need [\\/].
 */
export function pathMatches(filePath, pattern) {
	return pattern.test(normalisePath(filePath));
}

// ── File Collection ────────────────────────────────────────────────────────

/**
 * Recursively collect files from a directory tree.
 *
 * @param {string}   dir        Root directory to scan
 * @param {Object}   opts
 * @param {Set}      opts.skipDirs      Directory names to skip (merged with ALWAYS_SKIP_DIRS)
 * @param {RegExp}   opts.extensions    File extensions to include (tested against basename)
 * @param {RegExp}   [opts.skipFiles]   Basename patterns to exclude (e.g. test files)
 * @param {string[]} [opts.acc]         Accumulator (internal)
 * @returns {Promise<string[]>}         Normalised file paths
 */
export async function collectFiles(dir, opts) {
	const {
		skipDirs = new Set(),
		extensions = /\.(ts|tsx|js|jsx|mjs)$/i,
		skipFiles = null,
		acc = [],
	} = opts;

	// Merge caller's skip dirs with the universal set
	const skip = new Set([...ALWAYS_SKIP_DIRS, ...skipDirs]);

	async function walk(d) {
		let entries;
		try {
			entries = await fs.readdir(d, { withFileTypes: true });
		} catch {
			// Directory may not exist (workspace not yet scaffolded, etc.)
			return;
		}

		for (const e of entries) {
			const fp = path.join(d, e.name);
			if (e.isDirectory()) {
				if (skip.has(e.name)) continue;
				await walk(fp);
			} else if (e.isFile()) {
				if (!extensions.test(e.name)) continue;
				if (skipFiles?.test(e.name)) continue;
				acc.push(normalisePath(fp));
			}
		}
	}

	await walk(dir);
	return acc;
}

/**
 * Collect files from multiple root directories.
 */
export async function collectFilesFromRoots(roots, opts) {
	const acc = [];
	for (const root of roots) {
		await collectFiles(root, { ...opts, acc });
	}
	return acc;
}

// ── CLI Parsing ────────────────────────────────────────────────────────────

/**
 * Parse common guard CLI arguments into a structured object.
 *
 *   node scripts/guard-foo.mjs                        → { mode: "scan" }
 *   node scripts/guard-foo.mjs --warn-only            → { warnOnly: true }
 *   node scripts/guard-foo.mjs --json                 → { json: true }
 *   node scripts/guard-foo.mjs file1.ts file2.ts      → { mode: "files", files: [...] }
 *   node scripts/guard-foo.mjs src                    → { mode: "scan", roots: [...] }
 *
 * @param {Object}   opts
 * @param {string[]} [opts.defaultRoots]     Roots if none provided
 * @param {RegExp}   [opts.fileExtensions]   What counts as a "file arg" vs a "root arg"
 */
export function parseArgs(opts = {}) {
	const { defaultRoots = ['src'], fileExtensions = /\.(ts|tsx|js|jsx|mjs)$/i } = opts;

	const raw = process.argv.slice(2);
	const flags = new Set(raw.filter((a) => a.startsWith('--')));
	const positional = raw.filter((a) => !a.startsWith('--'));

	const isFileMode = positional.length > 0 && positional.some((a) => fileExtensions.test(a));

	let mode, files, roots;
	if (isFileMode) {
		mode = 'files';
		files = positional.filter((a) => fileExtensions.test(a)).map(normalisePath);
		roots = [];
	} else {
		mode = 'scan';
		files = [];
		roots = positional.length > 0 ? positional : defaultRoots;
	}

	return {
		mode,
		files,
		roots,
		warnOnly: flags.has('--warn-only'),
		json: flags.has('--json'),
		fixHint: flags.has('--fix-hint'),
		flags,
		raw,
	};
}

// ── Violation / Finding Primitives ─────────────────────────────────────────

/**
 * Create a violation object with consistent shape.
 */
export function violation({
	file,
	line = null,
	rule,
	message,
	severity = 'error',
	detail = null,
	confidence = null,
}) {
	const v = { file: normalisePath(file), rule, message, severity };
	if (line !== null) v.line = line;
	if (detail !== null) v.detail = detail;
	if (confidence !== null) v.confidence = confidence;
	return v;
}

// ── Reporting ──────────────────────────────────────────────────────────────

/**
 * Format and print results, then exit.
 *
 * Handles --json, --warn-only, grouping, truncation, and exit codes
 * so individual guards don't have to reimplement this.
 *
 * @param {Object}   opts
 * @param {string}   opts.guard         Guard name (e.g. "secrets")
 * @param {number}   opts.filesScanned  How many files were analysed
 * @param {Object[]} opts.violations    Array of violation objects
 * @param {boolean}  [opts.warnOnly]    If true, always exit 0
 * @param {boolean}  [opts.json]        Emit JSON to stdout instead of text to stderr
 * @param {string}   [opts.okMessage]   Custom "all clear" message
 * @param {string}   [opts.failMessage] Custom "blocked" message
 * @param {string}   [opts.fixAdvice]   Printed after violations to help the developer
 * @param {number}   [opts.maxPerGroup] Max violations shown per group (default 15)
 * @param {string}   [opts.groupBy]     Violation key to group by (default "rule")
 * @param {Function} [opts.formatLine]  Custom single-violation formatter
 * @param {number}   [opts.exitCode]    Override exit code on failure (default 1)
 */
export function report(opts) {
	const {
		guard,
		filesScanned,
		violations,
		warnOnly = false,
		json = false,
		okMessage = null,
		failMessage = null,
		fixAdvice = null,
		maxPerGroup = 15,
		groupBy = 'rule',
		formatLine = null,
		exitCode = 1,
	} = opts;

	// ── JSON mode ──
	if (json) {
		const output = {
			guard,
			timestamp: new Date().toISOString(),
			filesScanned,
			violationCount: violations.length,
			pass: violations.length === 0 || warnOnly,
			violations,
		};
		console.log(JSON.stringify(output, null, 2));
		process.exit(violations.length > 0 && !warnOnly ? exitCode : 0);
	}

	// ── Clean ──
	if (violations.length === 0) {
		console.log(okMessage || `guard:${guard} — scanned ${filesScanned} files — OK.`);
		process.exit(0);
	}

	// ── Violations ──
	const prefix = warnOnly ? `guard:${guard} warnings` : `guard:${guard} violations`;
	console.error(`${prefix} (${violations.length}):\n`);

	// Group
	const groups = {};
	for (const v of violations) {
		const key = v[groupBy] || 'other';
		if (!groups[key]) {
			groups[key] = [];
		}
		groups[key].push(v);
	}

	const fmt =
		formatLine ||
		((v) => {
			const loc = v.line ? `${v.file}:${v.line}` : v.file;
			const tag = v.rule ? ` [${v.rule}]` : '';
			const conf = v.confidence !== null && v.confidence !== undefined ? ` (${v.confidence}%)` : '';
			return `${loc}${tag} ${v.message}${conf}`;
		});

	for (const [group, items] of Object.entries(groups)) {
		console.error(`  ${group} (${items.length}):`);
		for (const v of items.slice(0, maxPerGroup)) {
			console.error(`    ${fmt(v)}`);
		}
		if (items.length > maxPerGroup) {
			console.error(`    ... and ${items.length - maxPerGroup} more`);
		}
		console.error('');
	}

	if (fixAdvice) {
		console.error(fixAdvice);
		console.error('');
	}

	if (warnOnly) {
		console.error('(--warn-only: not blocking commit)');
		process.exit(0);
	}

	if (failMessage) {
		console.error(failMessage);
	}

	process.exit(exitCode);
}

// ── Guard Runner ───────────────────────────────────────────────────────────

/**
 * Create a guard context that bundles config, CLI args, and helpers.
 *
 * Usage:
 *   const guard = createGuard("secrets", {
 *     roots:      ["src"],
 *     extensions: /\.(ts|tsx|js|jsx|mjs)$/i,
 *     skipDirs:   ["mocks", "__tests__"],
 *     skipFiles:  /\.(test|spec)\./,
 *   });
 *
 *   guard.run(async ({ files, args }) => {
 *     const violations = [];
 *     for (const f of files) { ... }
 *     return violations;
 *   });
 */
export function createGuard(name, config = {}) {
	const {
		roots: defaultRoots = ['src'],
		extensions = /\.(ts|tsx|js|jsx|mjs)$/i,
		skipDirs = [],
		skipFiles = null,
		fileExtensions,
		exitCode = 1,
	} = config;

	const args = parseArgs({
		defaultRoots,
		fileExtensions: fileExtensions || extensions,
	});

	return {
		name,
		args,

		/** Collect files respecting CLI args and guard config. */
		async collectFiles(overrideRoots) {
			if (args.mode === 'files') {
				// lint-staged mode — filter to matching extensions
				return args.files.filter((f) => extensions.test(f) && !skipFiles?.test(f));
			}
			const roots = overrideRoots || args.roots;
			return collectFilesFromRoots(roots, {
				skipDirs: new Set(skipDirs),
				extensions,
				skipFiles,
			});
		},

		/**
		 * Run the guard's detector function, then report and exit.
		 *
		 * @param {Function} detector  async ({ files, args, guard }) => violation[]
		 * @param {Object}   [reportOpts]  Extra options forwarded to report()
		 */
		async run(detector, reportOpts = {}) {
			try {
				const files = await this.collectFiles();
				const violations = await detector({ files, args, guard: this });

				report({
					guard: name,
					filesScanned: files.length,
					violations,
					warnOnly: args.warnOnly,
					json: args.json,
					exitCode,
					...reportOpts,
				});
			} catch (e) {
				console.error(`guard:${name} failed: ${e.message}`);
				if (args.json) {
					console.log(JSON.stringify({ guard: name, error: e.message, pass: false }));
				}
				process.exit(exitCode);
			}
		},
	};
}

// ── Registry Loader ────────────────────────────────────────────────────────

/**
 * Load the guard registry YAML and return it as a parsed object.
 * Falls back gracefully if the file doesn't exist or can't be parsed.
 *
 * Since we avoid external deps, this is a minimal YAML subset parser
 * sufficient for the registry format. For anything complex, swap in
 * `js-yaml` when available.
 */
export async function loadRegistry(registryPath) {
	const resolved = registryPath || path.join(findScriptsDir(), 'guard-registry.yml');
	let text;
	try {
		text = await fs.readFile(resolved, 'utf8');
	} catch {
		return null;
	}
	return parseSimpleYaml(text);
}

/**
 * Locate the scripts/ directory relative to the calling guard.
 */
function findScriptsDir() {
	// Try common locations
	for (const candidate of ['scripts', '.', path.dirname(process.argv[1] || '.')]) {
		return candidate;
	}
	return '.';
}

/**
 * Minimal YAML-subset parser for the guard registry.
 *
 * Handles:
 *   - Top-level keys
 *   - Nested objects (2-space indent)
 *   - Simple arrays (- item)
 *   - String, number, boolean values
 *   - Comments (#)
 *
 * Does NOT handle: multi-line strings, anchors, tags, flow style.
 * If the registry grows complex, replace with `js-yaml`.
 */
export function parseSimpleYaml(text) {
	const result = {};
	const lines = text.split('\n');
	let currentTopKey = null;
	let currentSecondKey = null;
	let currentArrayKey = null;

	for (const raw of lines) {
		const line = raw.replace(/#.*$/, ''); // strip comments
		if (line.trim() === '') continue;

		const leadingSpaces = line.match(/^(\s*)/)[1].length;

		// Top-level key (no indent)
		if (leadingSpaces === 0 && line.includes(':')) {
			const [key, ...rest] = line.split(':');
			const value = rest.join(':').trim();
			currentTopKey = key.trim();
			currentSecondKey = null;
			currentArrayKey = null;

			if (value) {
				result[currentTopKey] = parseYamlValue(value);
			} else {
				result[currentTopKey] = {};
			}
			continue;
		}

		// Second-level key (2-space indent)
		if (leadingSpaces === 2 && line.includes(':') && !line.trim().startsWith('-')) {
			const [key, ...rest] = line.trim().split(':');
			const value = rest.join(':').trim();
			currentSecondKey = key.trim();
			currentArrayKey = null;

			if (!currentTopKey) continue;
			if (typeof result[currentTopKey] !== 'object' || Array.isArray(result[currentTopKey])) {
				result[currentTopKey] = {};
			}

			if (value) {
				result[currentTopKey][currentSecondKey] = parseYamlValue(value);
			} else {
				result[currentTopKey][currentSecondKey] = {};
			}
			continue;
		}

		// Third-level key or value (4-space indent)
		if (leadingSpaces === 4 && currentTopKey && currentSecondKey) {
			const trimmed = line.trim();

			// Array item
			if (trimmed.startsWith('- ')) {
				const item = trimmed.slice(2).trim();
				const target = result[currentTopKey][currentSecondKey];

				if (
					currentArrayKey &&
					typeof target === 'object' &&
					!Array.isArray(target) &&
					Array.isArray(target[currentArrayKey])
				) {
					target[currentArrayKey].push(parseYamlValue(item));
				} else if (Array.isArray(target)) {
					target.push(parseYamlValue(item));
				} else {
					result[currentTopKey][currentSecondKey] = [parseYamlValue(item)];
				}
				continue;
			}

			// Key-value
			if (trimmed.includes(':')) {
				const [key, ...rest] = trimmed.split(':');
				const value = rest.join(':').trim();
				const k = key.trim();

				if (typeof result[currentTopKey][currentSecondKey] !== 'object') {
					result[currentTopKey][currentSecondKey] = {};
				}
				if (value) {
					result[currentTopKey][currentSecondKey][k] = parseYamlValue(value);
				} else {
					result[currentTopKey][currentSecondKey][k] = [];
					currentArrayKey = k;
				}
			}
			continue;
		}

		// Deeper array items (6-space indent)
		if (leadingSpaces === 6 && line.trim().startsWith('- ')) {
			const item = line.trim().slice(2).trim();
			if (currentTopKey && currentSecondKey && currentArrayKey) {
				const target = result[currentTopKey]?.[currentSecondKey]?.[currentArrayKey];
				if (Array.isArray(target)) {
					target.push(parseYamlValue(item));
				}
			}
		}
	}

	return result;
}

function parseYamlValue(str) {
	if (str === 'true') return true;
	if (str === 'false') return false;
	if (str === 'null') return null;
	if (/^-?\d+$/.test(str)) return parseInt(str, 10);
	if (/^-?\d+\.\d+$/.test(str)) return parseFloat(str);
	// Strip surrounding quotes
	if ((str.startsWith('"') && str.endsWith('"')) || (str.startsWith("'") && str.endsWith("'"))) {
		return str.slice(1, -1);
	}
	return str;
}

// ── Guard-All Runner ───────────────────────────────────────────────────────

/**
 * Run all guards defined in the registry. Intended for use by a top-level
 * `guard-all.mjs` runner or CI pipeline.
 *
 * @param {Object}   opts
 * @param {string}   [opts.registryPath]  Path to guard-registry.yml
 * @param {string}   [opts.phase]         Only run guards matching this trigger phase
 * @param {string}   [opts.layer]         Only run guards in this layer
 * @param {boolean}  [opts.warnOnly]      Override all guards to warn-only
 * @param {boolean}  [opts.json]          Collect JSON output from all guards
 * @returns {Promise<{ passed: boolean, results: Object[] }>}
 */
export async function runAll(opts = {}) {
	const { execSync } = await import('node:child_process');
	const registry = await loadRegistry(opts.registryPath);

	if (!registry?.guards) {
		console.error('No guard registry found or no guards defined.');
		return { passed: false, results: [] };
	}

	const results = [];
	let allPassed = true;

	const guards = Object.entries(registry.guards);

	for (const [name, config] of guards) {
		if (!config.enabled) continue;
		if (opts.phase && !(config.triggers || []).includes(opts.phase)) continue;
		if (opts.layer && config.layer !== opts.layer) continue;

		const script = config.script || `scripts/guard-${name}.mjs`;
		const flags = [];
		if (opts.warnOnly || config.mode === 'warn-only') flags.push('--warn-only');
		if (opts.json) flags.push('--json');
		if (opts.phase) flags.push('--phase', opts.phase);

		const cmd = `node ${script} ${flags.join(' ')}`;

		console.error(`\n── guard:${name} ${'─'.repeat(Math.max(0, 58 - name.length))}`);

		try {
			const stdout = execSync(cmd, {
				encoding: 'utf8',
				stdio: ['pipe', 'pipe', 'inherit'],
				timeout: (config.timeout || 30) * 1000,
			});

			if (opts.json && stdout.trim()) {
				try {
					results.push(JSON.parse(stdout.trim()));
				} catch {
					results.push({ guard: name, pass: true, raw: stdout.trim() });
				}
			} else {
				if (stdout.trim()) console.log(stdout.trim());
				results.push({ guard: name, pass: true });
			}
		} catch (e) {
			allPassed = false;
			const exitCode = e.status || 1;
			const stdout = e.stdout || '';

			if (opts.json && stdout.trim()) {
				try {
					results.push(JSON.parse(stdout.trim()));
				} catch {
					results.push({ guard: name, pass: false, exitCode, raw: stdout.trim() });
				}
			} else {
				if (stdout.trim()) console.log(stdout.trim());
				results.push({ guard: name, pass: false, exitCode });
			}
		}
	}

	return { passed: allPassed, results };
}
