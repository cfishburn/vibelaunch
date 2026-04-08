export interface AgenticWorkflowStep {
	id: string;
	step: string;
	title: string;
	intent: string;
	prompt: string;
	expectedResult: string[];
	verify: string[];
	note?: string;
}

export const agenticScaffoldWorkflowRoute = '/how-to-scaffold-an-agentic-coding-project';

export const agenticScaffoldWorkflow: AgenticWorkflowStep[] = [
	{
		id: 'stack',
		step: 'Step 1',
		title: 'Define the stack and constraints',
		intent:
			'Start with a narrow, conservative brief so the first scaffold matches the actual delivery shape.',
		prompt:
			"Let's scaffold an Astro + tanstack + Daisy UI Kit + Vercel + Supabase project for a content heavy website with some interactivity. Be conservative to start.",
		expectedResult: [
			'A working Astro starter with the right platform choices already wired in.',
			'A bias toward static-first rendering with only a small amount of interactivity.',
			'Enough structure to move forward without prematurely overbuilding the app.',
		],
		verify: [
			'The stack matches the intended hosting, auth, styling, and data-fetching model.',
			'The app boots locally and the initial scaffold stays intentionally simple.',
		],
	},
	{
		id: 'tooling',
		step: 'Step 2',
		title: 'Lock the tooling before the app grows',
		intent:
			'Get formatting, linting, package management, and commit-time guardrails in place before feature work starts.',
		prompt:
			'This is our stack: Framework: Astro. Database/Auth: Supabase. Hosting: Vercel. Styling: Tailwind CSS + DaisyUI. Data Fetching: TanStack Query. Validation: Zod. Pre commit: husky. Guard scripts: /scripts. Tooling: Biome + pnpm. SO TOOLING IS NEXT.',
		expectedResult: [
			'pnpm, Biome, husky, CI, and guard scripts become part of the scaffold baseline.',
			'Future AI-generated code is shaped by repo rules instead of stylistic guesswork.',
			'The scaffold becomes safer to fork because quality checks are part of the default workflow.',
		],
		verify: [
			'`pnpm run tooling:check` passes.',
			'Pre-commit hooks run the expected guard suite.',
			'The README explains the tooling surface accurately.',
		],
	},
	{
		id: 'auth-bff',
		step: 'Step 3',
		title: 'Add a tiny auth flow with a clear BFF boundary',
		intent:
			'Prove the architecture with the smallest meaningful auth example: one public page, one protected page, one admin page, and Astro API routes in the middle.',
		prompt:
			'QA the Clerk implementation. What we want to do is build simple hello world: a landing page, one page behind auth, and a simple admin page. FYI, this app should implement BFF architecture thoughtfully. Astro API Routes: the React island calls an Astro endpoint, and the Astro endpoint talks to backend services.',
		expectedResult: [
			'A public landing page plus `/app` and `/admin` routes protected with Clerk middleware.',
			'Astro API routes that sit between the browser and backend/provider calls.',
			'A small but concrete demonstration of the BFF pattern for future features.',
		],
		verify: [
			'Unauthenticated users are redirected away from protected pages.',
			'The browser talks to Astro endpoints instead of directly to privileged backends.',
			'The admin route has a stricter allowlist than the member route.',
		],
	},
	{
		id: 'content',
		step: 'Step 4',
		title: 'Move user-facing copy into content collections',
		intent:
			'Separate app structure from editorial copy so forks can change messaging without rewriting component logic.',
		prompt: "Let's use MDX.",
		expectedResult: [
			'Landing, auth, and dashboard copy move into MDX-backed content entries.',
			'The scaffold demonstrates a clean split between content, layout, and behavior.',
			'Site messaging becomes easier to audit and easier to replace in downstream forks.',
		],
		verify: [
			'The main user-facing page copy lives in `src/content/` instead of being buried in route files.',
			'Content schema changes are typed and validated through Astro content collections.',
		],
	},
	{
		id: 'fork-safe',
		step: 'Step 5',
		title: 'Make the scaffold safe to fork',
		intent:
			'Centralize identity and remove anything that could leak the wrong brand, URL, or debug surface into a new project.',
		prompt:
			'Fix those issues carefully and a small `src/config/site.ts` would be a better single source of truth for brand, base URL, nav labels, footer copy, and SEO defaults.',
		expectedResult: [
			'Brand and metadata defaults move into one configuration file.',
			'Public machine-readable surfaces stop depending on localhost fallbacks.',
			'Temporary debug/operator endpoints are removed or clearly excluded from the starter.',
		],
		verify: [
			'Brand strings are not duplicated across layout, SEO, and crawler-facing routes.',
			'`SITE_URL` is safe by default and only produces absolute URLs when configured.',
			'The scaffold docs match the real project shape.',
		],
	},
	{
		id: 'docs',
		step: 'Step 6',
		title: 'Teach the method, not just the codebase',
		intent:
			'Turn the scaffold into a reusable process by documenting the prompt flow and the expected checkpoints at each stage.',
		prompt:
			'Create a page on how to scaffold an agentic coding project using our process here as an example. Provide sample prompts in the order we used them, plus expected results and what to verify.',
		expectedResult: [
			'A public-facing workflow page that explains how to reproduce the scaffold process.',
			'Prompt examples paired with intent, expected result, and verification guidance.',
			'A stronger story for why this scaffold exists beyond the code itself.',
		],
		verify: [
			'The page teaches a repeatable method instead of acting like a raw transcript dump.',
			'Each prompt is paired with a concrete outcome and a way to evaluate success.',
		],
	},
	{
		id: 'entropy',
		step: 'Step 7',
		title: 'Use documentation standards to prevent entropy',
		intent:
			'Add a lightweight routine that keeps planning durable and implementation rationale visible while work is active.',
		prompt:
			'Before building a feature, create a planning document using `src/content/superpowers/doc-template.mdx`. During implementation, keep a devlog using `src/content/superpowers/dev-log.mdx` for non-obvious decisions, tradeoffs, and dead ends. Promote any lasting insights into permanent docs.',
		expectedResult: [
			'Feature planning starts from a durable documentation template instead of ad-hoc notes.',
			'Important implementation rationale is captured while the work is still fresh.',
			'Temporary devlogs stay temporary, while lasting lessons graduate into permanent docs.',
		],
		verify: [
			'The team uses the doc template for durable feature docs, runbooks, and guidelines.',
			'Devlogs are created selectively for active, high-context work rather than every trivial edit.',
			'Permanent docs improve over time instead of all context living forever in ephemeral logs.',
		],
		note: 'This is the ongoing anti-entropy loop: plan with durable docs, build with an active devlog when needed, then promote lasting lessons back into the permanent documentation layer.',
	},
];
