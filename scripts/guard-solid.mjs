#!/usr/bin/env node
/**
 * guard-solid.mjs — SOLID / DRY Heuristic Guard
 *
 * @guard       solid
 * @layer       quality
 * @mode        warn-only (local), hard-block (CI optional)
 * @scope       src/ (ts, tsx)
 * @triggers    ci
 *
 * Static analysis heuristics that catch common SOLID and DRY violations.
 * Not a substitute for code review, but surfaces the most egregious patterns.
 *
 * What it catches:
 *
 * ── Single Responsibility (S) ──
 *   - Files over N lines (configurable, default 300)
 *   - Files with too many exported symbols (> 7)
 *   - React components that mix data fetching + rendering + state (god components)
 *
 * ── Open/Closed (O) ──
 *   - Switch/case with > 5 branches (brace-depth-aware)
 *
 * ── Interface Segregation (I) ──
 *   - Type/interface definitions with > 10 properties
 *
 * ── DRY ──
 *   - Duplicate string literals (same string > 3 times in one file)
 *   - Copy-paste: consecutive lines repeated elsewhere in the same file
 *
 * Per-file opt-out: `// scaffold-disable-solid-check`
 *
 * Usage:
 *   node scripts/guard-solid.mjs
 *   node scripts/guard-solid.mjs --warn-only
 *   node scripts/guard-solid.mjs --json          (structured output for CI)
 *
 * Exit codes: 0 = clean, 1 = violations found (or 0 if --warn-only)
 * Compatible: Node >=18, Bun >=1
 */
import fs from 'node:fs/promises';
import path from 'node:path';

// ── Configuration ──────────────────────────────────────────────────────────

const CONFIG = {
	roots: ['src'],
	skipDirs: ['node_modules', 'dist', '.astro', 'mocks', 'test', '__tests__', 'content'],
	extensions: /\.(ts|tsx)$/,
	skipPatterns: /\.(test|spec|stories|schema)\./,

	// Single Responsibility
	maxFileLines: 300,
	maxExports: 7,
	godComponentSignals: 4, // file must have >= N of: useQuery, useEffect, useState, fetch(, useMemo, useReducer

	// Open/Closed
	maxSwitchBranches: 5,

	// Interface Segregation
	maxInterfaceProps: 10,

	// DRY
	duplicateStringThreshold: 3, // same string literal > N times
	minDuplicateStringLength: 8, // only flag strings longer than this
	duplicateBlockLines: 4, // consecutive identical line blocks
};

// ── File Collection ────────────────────────────────────────────────────────

async function collectFiles(dir, acc = []) {
	try {
		const entries = await fs.readdir(dir, { withFileTypes: true });
		for (const e of entries) {
			const fp = path.join(dir, e.name);
			if (e.isDirectory()) {
				if (CONFIG.skipDirs.includes(e.name)) continue;
				await collectFiles(fp, acc);
			} else if (
				e.isFile() &&
				CONFIG.extensions.test(e.name) &&
				!CONFIG.skipPatterns.test(e.name)
			) {
				acc.push(fp);
			}
		}
	} catch {
		// dir may not exist
	}
	return acc;
}

// ── Detectors ──────────────────────────────────────────────────────────────

function checkFileLength(lines, filePath) {
	if (lines.length > CONFIG.maxFileLines) {
		return [
			{
				file: filePath,
				line: 1,
				rule: 'SRP:file-too-long',
				message: `${lines.length} lines (max ${CONFIG.maxFileLines}) — consider splitting`,
			},
		];
	}
	return [];
}

function checkExportCount(content, filePath) {
	const exportMatches = content.match(
		/\bexport\s+(default\s+)?(function|const|class|type|interface|enum)\s/g,
	);
	const count = exportMatches ? exportMatches.length : 0;
	if (count > CONFIG.maxExports) {
		return [
			{
				file: filePath,
				line: 1,
				rule: 'SRP:too-many-exports',
				message: `${count} exports (max ${CONFIG.maxExports}) — file does too many things`,
			},
		];
	}
	return [];
}

function checkGodComponent(content, filePath) {
	if (!filePath.endsWith('.tsx')) return [];

	const signals = [
		/\buseQuery\s*[<(]/.test(content),
		/\buseEffect\s*\(/.test(content),
		/\buseState\s*[<(]/.test(content),
		/\bfetch\s*\(/.test(content),
		/\buseMemo\s*\(/.test(content),
		/\buseReducer\s*\(/.test(content),
	];
	const count = signals.filter(Boolean).length;

	if (count >= CONFIG.godComponentSignals) {
		return [
			{
				file: filePath,
				line: 1,
				rule: 'SRP:god-component',
				message: `Component has ${count} concerns (fetch + state + memo + effects) — split into container/presenter`,
			},
		];
	}
	return [];
}

function checkSwitchBranches(content, filePath) {
	const violations = [];
	const lines = content.split('\n');

	let inSwitch = false;
	let caseCount = 0;
	let switchLine = 0;
	let braceDepth = 0;

	for (let i = 0; i < lines.length; i++) {
		const trimmed = lines[i].trim();

		if (!inSwitch && /\bswitch\s*\(/.test(trimmed)) {
			inSwitch = true;
			caseCount = 0;
			switchLine = i + 1;
			braceDepth = 0;
		}

		if (inSwitch) {
			for (const ch of lines[i]) {
				if (ch === '{') braceDepth++;
				if (ch === '}') braceDepth--;
			}

			if (/^\s*case\s+/.test(lines[i])) {
				caseCount++;
			}

			if (braceDepth <= 0 && caseCount > 0) {
				if (caseCount > CONFIG.maxSwitchBranches) {
					violations.push({
						file: filePath,
						line: switchLine,
						rule: 'OCP:switch-on-strings',
						message: `Switch with ${caseCount} cases — use a lookup map or polymorphism`,
					});
				}
				inSwitch = false;
				caseCount = 0;
			}
		}
	}

	return violations;
}

function checkLargeInterface(content, filePath) {
	const violations = [];
	const interfaceRegex = /(?:type\s+(\w+)\s*=\s*\{|interface\s+(\w+)\s*(?:extends\s+[^{]+)?\{)/g;
	let match;

	while (true) {
		match = interfaceRegex.exec(content);
		if (match === null) {
			break;
		}

		const name = match[1] || match[2];
		const startIdx = match.index + match[0].length;

		let depth = 1;
		let propCount = 0;
		let pos = startIdx;

		while (pos < content.length && depth > 0) {
			const char = content[pos];
			if (char === '{') depth++;
			if (char === '}') depth--;
			if (depth === 1 && char === ':') propCount++;
			pos++;
		}

		if (propCount > CONFIG.maxInterfaceProps) {
			const line = content.slice(0, match.index).split('\n').length;
			violations.push({
				file: filePath,
				line,
				rule: 'ISP:fat-interface',
				message: `${name} has ${propCount} properties (max ${CONFIG.maxInterfaceProps}) — consider splitting`,
			});
		}
	}

	return violations;
}

function checkDuplicateStrings(content, filePath) {
	const violations = [];
	const stringRegex = /(?<=['"])([^'"]{8,})(?=['"])/g;
	const counts = new Map();
	let match;

	while (true) {
		match = stringRegex.exec(content);
		if (match === null) {
			break;
		}

		const str = match[1];
		// Skip imports, URLs, CSS values, template expressions
		if (/^(from|import|https?:\/\/|\.\/|\.\.\/|\/)/.test(str)) continue;
		if (/^[0-9.]+[a-z%]*$/.test(str)) continue;
		if (/^#[0-9a-fA-F]+$/.test(str)) continue;

		counts.set(str, (counts.get(str) || 0) + 1);
	}

	for (const [str, count] of counts) {
		if (count > CONFIG.duplicateStringThreshold && str.length >= CONFIG.minDuplicateStringLength) {
			violations.push({
				file: filePath,
				line: 1,
				rule: 'DRY:duplicate-string',
				message: `"${str.slice(0, 40)}" appears ${count} times — extract to a constant`,
			});
		}
	}

	return violations;
}

function checkDuplicateBlocks(lines, filePath) {
	const violations = [];
	const blockSize = CONFIG.duplicateBlockLines;

	if (lines.length < blockSize * 2) return violations;

	const seen = new Map();

	for (let i = 0; i <= lines.length - blockSize; i++) {
		const block = lines
			.slice(i, i + blockSize)
			.map((l) => l.trim())
			.filter((l) => l.length > 0 && !l.startsWith('//') && !l.startsWith('*'));

		if (block.length < blockSize) continue;

		const key = block.join('\n');
		if (key.length < 40) continue;

		if (seen.has(key)) {
			const firstLine = seen.get(key);
			if (
				!violations.some(
					(v) => v.rule === 'DRY:duplicate-block' && v.message.includes(`L${firstLine}`),
				)
			) {
				violations.push({
					file: filePath,
					line: i + 1,
					rule: 'DRY:duplicate-block',
					message: `${blockSize}-line block duplicated from L${firstLine} — extract to shared function`,
				});
			}
		} else {
			seen.set(key, i + 1);
		}
	}

	return violations;
}

// ── Main ────────────────────────────────────────────────────────────────────

async function main() {
	const warnOnly = process.argv.includes('--warn-only');
	const jsonOutput = process.argv.includes('--json');

	const files = [];
	for (const root of CONFIG.roots) {
		await collectFiles(root, files);
	}

	const allViolations = [];

	for (const f of files) {
		const content = await fs.readFile(f, 'utf8');

		// Per-file opt-out
		if (content.includes('// scaffold-disable-solid-check')) continue;

		const lines = content.split('\n');

		allViolations.push(
			...checkFileLength(lines, f),
			...checkExportCount(content, f),
			...checkGodComponent(content, f),
			...checkSwitchBranches(content, f),
			...checkLargeInterface(content, f),
			...checkDuplicateStrings(content, f),
			...checkDuplicateBlocks(lines, f),
		);
	}

	if (allViolations.length === 0) {
		if (jsonOutput) {
			console.log(JSON.stringify({ violations: [], count: 0, files: files.length }));
		} else {
			console.log(`guard:solid — scanned ${files.length} files — SOLID/DRY discipline OK.`);
		}
		process.exit(0);
	}

	if (jsonOutput) {
		console.log(
			JSON.stringify({
				violations: allViolations,
				count: allViolations.length,
				files: files.length,
			}),
		);
		process.exit(warnOnly ? 0 : 1);
	}

	// Group by principle for human-readable output
	const groups = {};
	for (const v of allViolations) {
		const principle = v.rule.split(':')[0];
		groups[principle] = groups[principle] || [];
		groups[principle].push(v);
	}

	const label = warnOnly ? 'SOLID/DRY warnings' : 'SOLID/DRY violations';
	console.error(`${label} (${allViolations.length}):\n`);

	for (const [principle, items] of Object.entries(groups)) {
		const name =
			{
				SRP: 'Single Responsibility',
				OCP: 'Open/Closed',
				ISP: 'Interface Segregation',
				DRY: "Don't Repeat Yourself",
			}[principle] || principle;
		console.error(`  ${name} (${items.length}):`);
		for (const v of items.slice(0, 10)) {
			console.error(`    ${v.file}:${v.line} [${v.rule}] ${v.message}`);
		}
		if (items.length > 10) console.error(`    ... and ${items.length - 10} more`);
		console.error('');
	}

	if (warnOnly) {
		console.error('(--warn-only: not blocking commit)');
		process.exit(0);
	}

	process.exit(1);
}

main().catch((e) => {
	console.error('guard-solid failed:', e.message);
	process.exit(1);
});
