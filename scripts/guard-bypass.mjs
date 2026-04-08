#!/usr/bin/env node
/**
 * guard-bypass.mjs — Guard Integrity Monitor
 *
 * @guard       bypass
 * @layer       security
 * @mode        hard-block
 * @scope       package.json, scripts/, .husky/, staged commits
 * @triggers    pre-commit, ci
 *
 * Meta-guard that detects attempts to circumvent mandatory checks:
 *   - Comments suggesting skipping checks
 *   - Guard scripts with hardcoded success exits
 *   - Suspicious commit messages
 *   - Disabled validation code
 *
 * Usage:
 *   node scripts/guard-bypass.mjs
 *
 * Exit codes: 0 = clean, 1 = bypass attempts detected
 * Compatible: Node >=18, Bun >=1
 */
import { execSync } from 'node:child_process';
import fs from 'node:fs/promises';
import path from 'node:path';

const BYPASS_COMMENTS = [
	/\/\/.*skip\s+(build|test|lint|check|guard)/i,
	/\/\/.*disable\s+(for\s+)?speed/i,
	/\/\/.*temporary\s+bypass/i,
	/TODO:?\s+remove\s+this\s+hack/i,
	/\/\/.*quick\s+fix.*skip/i,
	/\/\/.*comment\s+out.*validation/i,
];

const BYPASS_CODE = [
	/process\.exit\(0\).*\/\/.*skip/i,
	/return\s+true\s*;?\s*\/\/.*always\s+pass/i,
	/if\s*\(false\).*validation/i,
];

// Scripts that are excluded from the hardcoded-exit check because they
// legitimately use process.exit(0) at top level (e.g. preinstall guards).
const EXCLUDED_SCRIPTS = new Set(['enforce-pnpm.mjs', 'guard-bypass.mjs']);

async function checkPackageJson() {
	const findings = [];
	const pkg = JSON.parse(await fs.readFile('package.json', 'utf8'));

	// Ensure essential scripts exist
	const required = ['tooling:staged', 'check', 'build'];
	for (const name of required) {
		if (!pkg.scripts?.[name]) {
			findings.push({
				file: 'package.json',
				type: 'missing-script',
				severity: 'error',
				message: `Required script "${name}" is missing`,
			});
		}
	}

	return findings;
}

async function checkGuardScripts() {
	const findings = [];
	const guardDir = 'scripts';

	try {
		const files = await fs.readdir(guardDir);

		for (const file of files) {
			if (!file.endsWith('.mjs') && !file.endsWith('.js')) continue;
			if (EXCLUDED_SCRIPTS.has(file)) continue;

			const filePath = path.join(guardDir, file);
			const content = await fs.readFile(filePath, 'utf8');

			// Check that every process.exit(0) appears INSIDE an if-block.
			// A top-level exit(0) before any condition check is a sabotage vector.
			const guardLines = content.split('\n');
			let braceDepth = 0;
			let insideIf = false;

			for (let i = 0; i < guardLines.length; i++) {
				const line = guardLines[i];

				if (/^\s*if\s*\(/.test(line)) insideIf = true;
				for (const ch of line) {
					if (ch === '{') braceDepth++;
					if (ch === '}') {
						braceDepth--;
						if (braceDepth <= 0) {
							insideIf = false;
							braceDepth = 0;
						}
					}
				}

				if (/process\.exit\(0\)/.test(line) && !insideIf && braceDepth <= 1) {
					if (/\.catch/.test(line)) continue;
					findings.push({
						file: filePath,
						line: i + 1,
						type: 'hardcoded-success',
						severity: 'error',
						message: `process.exit(0) at top level — guard may be bypassed: ${line.trim().slice(0, 60)}`,
					});
				}
			}

			guardLines.forEach((line, idx) => {
				if (/return\s+(true|null);\s*\/\/\s*(skip|bypass|disable)/i.test(line)) {
					findings.push({
						file: filePath,
						line: idx + 1,
						type: 'validation-disabled',
						severity: 'error',
						message: `Validation disabled: ${line.trim()}`,
					});
				}
			});
		}
	} catch {
		// scripts dir missing
	}

	return findings;
}

async function checkRecentCommits() {
	const findings = [];

	try {
		const commits = execSync('git log -5 --format="%s"', {
			encoding: 'utf8',
			stdio: ['pipe', 'pipe', 'ignore'],
		})
			.trim()
			.split('\n');

		const suspicious = [
			/WIP.*skip/i,
			/temp.*disable.*(?:guard|check|lint|test|validation)/i,
			/quick.*fix.*validation/i,
			/remove.*(?:guard|validation|lint|check)\b/i,
			/bypass.*(?:guard|check|lint)/i,
		];

		commits.forEach((msg, i) => {
			if (suspicious.some((p) => p.test(msg))) {
				findings.push({
					file: `commit ${i + 1}`,
					type: 'suspicious-commit-message',
					severity: 'warning',
					message: `"${msg}"`,
				});
			}
		});
	} catch {
		// not in a git repo
	}

	return findings;
}

async function scanSourceCode() {
	const findings = [];

	async function scan(dir, acc = []) {
		try {
			const entries = await fs.readdir(dir, { withFileTypes: true });
			for (const e of entries) {
				const fp = path.join(dir, e.name);
				if (e.isDirectory()) {
					if (['node_modules', '.git', 'dist', '.astro', '.vercel'].includes(e.name)) continue;
					await scan(fp, acc);
				} else if (e.isFile() && /\.(ts|tsx|js|jsx|mjs)$/i.test(fp)) {
					acc.push(fp);
				}
			}
		} catch {
			// ignore
		}
		return acc;
	}

	const files = [];
	await scan('src', files);
	await scan('scripts', files);

	for (const file of files) {
		if (file.includes('guard-bypass.mjs')) continue;

		const content = await fs.readFile(file, 'utf8');
		const lines = content.split('\n');

		lines.forEach((line, i) => {
			const isDoc = /^\s*[/*#]\s*(Red Flags|Purpose|Patterns|Check)/i.test(line);
			if (isDoc) return;

			for (const pattern of BYPASS_COMMENTS) {
				if (pattern.test(line)) {
					findings.push({
						file,
						line: i + 1,
						type: 'bypass-comment',
						severity: 'error',
						message: line.trim(),
					});
				}
			}

			for (const pattern of BYPASS_CODE) {
				if (pattern.test(line)) {
					findings.push({
						file,
						line: i + 1,
						type: 'bypass-code',
						severity: 'error',
						message: line.trim(),
					});
				}
			}
		});
	}

	return findings;
}

async function main() {
	const findings = [
		...(await checkPackageJson()),
		...(await checkGuardScripts()),
		...(await checkRecentCommits()),
		...(await scanSourceCode()),
	];

	if (findings.length === 0) {
		console.log('guard:bypass — no bypass attempts detected.');
		process.exit(0);
	}

	const errors = findings.filter((f) => f.severity === 'error');
	const warnings = findings.filter((f) => f.severity === 'warning');

	console.error(`Found ${findings.length} potential bypass attempt(s):\n`);

	if (errors.length > 0) {
		console.error(`ERRORS (${errors.length}):`);
		errors.forEach((f) => {
			console.error(`  ${f.file}${f.line ? `:${f.line}` : ''} [${f.type}]`);
			console.error(`    ${f.message}`);
		});
	}

	if (warnings.length > 0) {
		console.error(`\nWARNINGS (${warnings.length}):`);
		warnings.forEach((f) => {
			console.error(`  ${f.file}${f.line ? `:${f.line}` : ''} [${f.type}]`);
			console.error(`    ${f.message}`);
		});
	}

	if (errors.length > 0) {
		console.error('\nBYPASS ATTEMPT DETECTED — COMMIT REJECTED');
		process.exit(1);
	}

	process.exit(0);
}

main().catch((e) => {
	console.error('guard-bypass failed:', e.message);
	process.exit(1);
});
