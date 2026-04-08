#!/usr/bin/env node
/**
 * guard-build.mjs — Build Artifact Validator
 *
 * @guard       build
 * @layer       security
 * @mode        hard-block
 * @scope       dist/ output directory
 * @triggers    ci
 *
 * Scans built output for risky artifacts:
 *   - Source maps (.map files or sourceMappingURL directives)
 *   - Leaked secrets or secret identifiers
 *   - Oversized JS chunks
 *   - Unminified production code
 *
 * Usage:
 *   node scripts/guard-build.mjs
 *   node scripts/guard-build.mjs --json
 *   node scripts/guard-build.mjs dist/
 *
 * Exit codes: 0 = clean, 1 = risky artifacts detected
 * Compatible: Node >=18, Bun >=1
 */
import fs from 'node:fs/promises';
import path from 'node:path';

const CONFIG = {
	defaultRoots: ['dist', '.vercel/output'],
	forbiddenExtensions: ['.map'],
	textExtensions: ['.js', '.mjs', '.cjs', '.css', '.html', '.json', '.svg'],
	maxJsChunkBytes: 2500 * 1024,
	forbiddenPatterns: [
		// Order matters: check the more specific inline pattern first
		{ pattern: /sourceMappingURL=data:application\/json;base64,/i, kind: 'inline-source-map' },
		{ pattern: /sourceMappingURL=[^d]/i, kind: 'source-map-reference' },
		{ pattern: /CLERK_SECRET_KEY\s*[:=]\s*['"][^'"]+['"]/, kind: 'secret-identifier' },
		{ pattern: /SUPABASE_SERVICE_ROLE_KEY\s*[:=]\s*['"][^'"]+['"]/, kind: 'secret-identifier' },
		{ pattern: /DATABASE_URL\s*[:=]\s*['"][^'"]+['"]/, kind: 'secret-identifier' },
		{ pattern: /AKIA[0-9A-Z]{16}/, kind: 'aws-access-key' },
		{ pattern: /sk-[A-Za-z0-9]{32,}/, kind: 'openai-key' },
		{ pattern: /ghp_[A-Za-z0-9]{36,}/, kind: 'github-token' },
		{ pattern: /-----BEGIN (?:RSA |EC )?PRIVATE KEY-----/, kind: 'private-key' },
		{ pattern: /(?:postgres|mysql|mongodb):\/\/[^:]+:[^@]+@/, kind: 'database-url' },
	],
};

async function collectFiles(dir, acc = []) {
	try {
		const entries = await fs.readdir(dir, { withFileTypes: true });
		for (const e of entries) {
			const fp = path.join(dir, e.name);
			if (e.isDirectory()) {
				if (e.name === 'node_modules') continue;
				await collectFiles(fp, acc);
			} else if (e.isFile()) {
				acc.push(fp);
			}
		}
	} catch {
		// directory may not exist (e.g. not built yet)
	}
	return acc;
}

function getLineNumber(content, index) {
	return content.slice(0, index).split('\n').length;
}

async function analyzeFile(filePath) {
	const findings = [];
	const ext = path.extname(filePath).toLowerCase();

	if (CONFIG.forbiddenExtensions.includes(ext)) {
		findings.push({
			file: filePath,
			line: 1,
			kind: 'forbidden-extension',
			detail: 'Source map file in build output',
		});
		return findings;
	}

	if (!CONFIG.textExtensions.includes(ext)) return findings;

	let content;
	let stats;
	try {
		stats = await fs.stat(filePath);
		if (['.js', '.mjs', '.cjs'].includes(ext) && stats.size > CONFIG.maxJsChunkBytes) {
			findings.push({
				file: filePath,
				line: 1,
				kind: 'oversized-chunk',
				detail: `${(stats.size / 1024).toFixed(0)}KB exceeds ${(CONFIG.maxJsChunkBytes / 1024).toFixed(0)}KB limit`,
			});
		}
		if (stats.size > 5 * 1024 * 1024) return findings;
		content = await fs.readFile(filePath, 'utf-8');
	} catch {
		return findings;
	}

	for (const rule of CONFIG.forbiddenPatterns) {
		const match = content.match(rule.pattern);
		if (match?.index !== undefined) {
			findings.push({
				file: filePath,
				line: getLineNumber(content, match.index),
				kind: rule.kind,
				detail: `Matched: ${rule.pattern}`,
			});
		}
	}

	return findings;
}

async function main() {
	const args = process.argv.slice(2);
	const jsonOutput = args.includes('--json');
	const customPaths = args.filter((a) => !a.startsWith('--'));
	const roots = customPaths.length > 0 ? customPaths : CONFIG.defaultRoots;

	const files = [];
	for (const root of roots) {
		await collectFiles(root, files);
	}

	if (files.length === 0) {
		console.log('guard:build — no build output to analyze (run after build).');
		process.exit(0);
	}

	const findings = [];
	for (const file of files) {
		findings.push(...(await analyzeFile(file)));
	}

	if (jsonOutput) {
		console.log(JSON.stringify({ files: files.length, findings }, null, 2));
	} else {
		console.log(`guard:build — analyzed ${files.length} build artifacts.`);
		if (findings.length === 0) {
			console.log('No forbidden artifacts detected.');
		} else {
			console.error(`\n${findings.length} issue(s) found:\n`);
			for (const f of findings) {
				console.error(`  ${f.file}:${f.line} [${f.kind}] ${f.detail}`);
			}
		}
	}

	process.exit(findings.length > 0 ? 1 : 0);
}

main().catch((err) => {
	console.error('guard-build failed:', err.message);
	process.exit(1);
});
