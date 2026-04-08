#!/usr/bin/env node
/**
 * guard-secrets.mjs — Secret Leak Guard
 *
 * @guard       secrets
 * @layer       security
 * @mode        hard-block
 * @scope       src/ (ts, tsx, js, mjs, json, yaml, env)
 * @triggers    pre-commit, ci
 *
 * Scans source files for hardcoded secret values that should only live in
 * environment variables. Blocks commit if any are found.
 *
 * Usage:
 *   node scripts/guard-secrets.mjs                       # Directory scan
 *   node scripts/guard-secrets.mjs file1.ts file2.ts     # lint-staged file mode
 *   node scripts/guard-secrets.mjs --paths "src scripts"  # Custom roots
 *
 * Exit codes: 0 = clean, 1 = secrets detected
 * Compatible: Node >=18, Bun >=1
 */
import fs from 'node:fs/promises';
import path from 'node:path';

const args = process.argv.slice(2);

// Parse flags first, then determine mode
const pathsIdx = args.indexOf('--paths');
const flagArgs = new Set(['--paths']);
if (pathsIdx !== -1) flagArgs.add(args[pathsIdx + 1]);

const fileArgs = args.filter((a, i) => !flagArgs.has(a) && i !== pathsIdx + 1);
const isFileMode = fileArgs.length > 0 && fileArgs.some((a) => /\.\w+$/.test(a));
const pathList = pathsIdx !== -1 ? args[pathsIdx + 1].split(' ') : ['src'];

const SECRET_NAMES = ['CLERK_SECRET_KEY', 'SUPABASE_SERVICE_ROLE_KEY', 'DATABASE_URL'];

const SECRET_VALUE_PATTERNS = [
	/-----BEGIN (?:RSA |EC )?PRIVATE KEY-----/,
	/(?:postgres|mysql|mongodb):\/\/[^:]+:[^@]+@/,
	/AKIA[0-9A-Z]{16}/,
	/sk-[A-Za-z0-9]{32,}/,
	/ghp_[A-Za-z0-9]{36,}/,
	/AIza[0-9A-Za-z\-_]{35}/,
	/bearer\s+eyJ[a-zA-Z0-9_-]{20,}/i,
	/sk_test_[A-Za-z0-9]{20,}/,
	/sk_live_[A-Za-z0-9]{20,}/,
];

// Match standard extensions and also .env variants (.env, .env.local, .env.production, etc.)
const SCAN_EXTENSIONS = /(\.(ts|tsx|js|mjs|jsx|yml|yaml|json)$|\.env(\.\w+)?$)/i;
const SKIP_PATTERNS = /\.test\.|\.spec\.|node_modules|dist|\.astro|\.turbo|\.vercel/;

async function collectFiles(dir, acc = []) {
	try {
		const entries = await fs.readdir(dir, { withFileTypes: true });
		for (const e of entries) {
			const fp = path.join(dir, e.name);
			if (e.isDirectory()) {
				if (['node_modules', '.git', 'dist', '.astro', '.turbo', '.vercel'].includes(e.name))
					continue;
				await collectFiles(fp, acc);
			} else if (e.isFile() && SCAN_EXTENSIONS.test(fp) && !SKIP_PATTERNS.test(fp)) {
				acc.push(fp);
			}
		}
	} catch {
		// directory may not exist
	}
	return acc;
}

async function main() {
	const files = [];
	if (isFileMode) {
		// lint-staged mode: scan only the staged files that match our extensions
		for (const f of fileArgs) {
			if (SCAN_EXTENSIONS.test(f) && !SKIP_PATTERNS.test(f)) files.push(f);
		}
	} else {
		// Manual/CI mode: recursive directory scan
		for (const root of pathList) {
			await collectFiles(root, files);
		}
	}

	const hits = [];

	for (const f of files) {
		const content = await fs.readFile(f, 'utf8').catch(() => '');

		// Check for hardcoded secret assignments (SECRET_NAME = "value")
		for (const name of SECRET_NAMES) {
			const pattern = new RegExp(`${name}\\s*[:=]\\s*['"][^'"]+['"]`, 'i');
			if (pattern.test(content)) {
				hits.push({ file: f, kind: 'hardcoded-secret', detail: name });
			}
		}

		// Check for secret value patterns
		for (const pattern of SECRET_VALUE_PATTERNS) {
			if (pattern.test(content)) {
				hits.push({ file: f, kind: 'secret-value', detail: pattern.source.slice(0, 40) });
			}
		}
	}

	if (hits.length > 0) {
		console.error(`Secret usage detected in ${hits.length} location(s):\n`);
		for (const h of hits) {
			console.error(`  ${h.file} [${h.kind}] ${h.detail}`);
		}
		process.exit(1);
	}

	console.log(`guard:secrets — scanned ${files.length} files — no secret leaks detected.`);
}

main().catch((e) => {
	console.error('guard-secrets failed:', e.message);
	process.exit(1);
});
