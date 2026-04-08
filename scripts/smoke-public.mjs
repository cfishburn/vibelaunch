#!/usr/bin/env node
/**
 * smoke-public.mjs — Public Surface Smoke Test
 *
 * Verifies that the key public routes exist in the built output and that
 * critical internal links on those pages still exist.
 *
 * Usage:
 *   pnpm run build
 *   pnpm run smoke:public
 */
import fs from 'node:fs/promises';

const routeChecks = [
	{ path: '/', kind: 'html' },
	{ path: '/stories/', kind: 'html' },
	{ path: '/how-to-scaffold-an-agentic-coding-project/', kind: 'html' },
	{ path: '/superpowers/', kind: 'html' },
	{ path: '/superpowers/doc-template/', kind: 'html' },
	{ path: '/superpowers/dev-log/', kind: 'html' },
	{ path: '/legal/', kind: 'html' },
	{ path: '/llms.txt', kind: 'text' },
	{ path: '/llms-full.txt', kind: 'text' },
	{ path: '/robots.txt', kind: 'text' },
];

const criticalLinks = new Map([
	['/', ['/how-to-scaffold-an-agentic-coding-project', '/superpowers', '/app', '/stories']],
	[
		'/how-to-scaffold-an-agentic-coding-project/',
		['/superpowers', '/superpowers/doc-template', '/superpowers/dev-log'],
	],
	['/superpowers/', ['/superpowers/doc-template', '/superpowers/dev-log']],
]);

async function getStaticRoot() {
	for (const candidate of ['dist/client', 'dist']) {
		try {
			await fs.access(candidate);
			return candidate;
		} catch {
			// Try the next possible static output root.
		}
	}

	throw new Error(
		'No static build output found. Run `pnpm run build` before `pnpm run smoke:public`.',
	);
}

function getBuildFilePath(staticRoot, routePath) {
	if (routePath === '/') {
		return `${staticRoot}/index.html`;
	}

	if (routePath.endsWith('.txt')) {
		return `${staticRoot}${routePath}`;
	}

	return `${staticRoot}${routePath}index.html`;
}

function hasLink(html, href) {
	return html.includes(`href="${href}"`) || html.includes(`href="${href}/"`);
}

async function verifyRoute(staticRoot, route) {
	const filePath = getBuildFilePath(staticRoot, route.path);
	const body = await fs.readFile(filePath, 'utf8');

	if (body.trim().length === 0) {
		throw new Error(`Route ${route.path} generated an empty output file (${filePath}).`);
	}

	if (
		route.kind === 'html' &&
		!body.includes('<!DOCTYPE html>') &&
		!body.includes('<!doctype html>')
	) {
		throw new Error(`Route ${route.path} did not produce an HTML document.`);
	}

	const expectedLinks = criticalLinks.get(route.path) ?? [];

	for (const href of expectedLinks) {
		if (!hasLink(body, href)) {
			throw new Error(`Route ${route.path} is missing the internal link ${href}.`);
		}
	}
}

async function main() {
	const staticRoot = await getStaticRoot();

	for (const route of routeChecks) {
		try {
			await verifyRoute(staticRoot, route);
		} catch (error) {
			if (error && typeof error === 'object' && 'code' in error && error.code === 'ENOENT') {
				throw new Error(`Route ${route.path} is missing from the build output.`);
			}

			throw error;
		}
	}

	console.log(`smoke:public — verified ${routeChecks.length} public routes.`);
}

main().catch((error) => {
	console.error(`smoke:public — ${error instanceof Error ? error.message : 'Unknown error.'}`);
	process.exit(1);
});
