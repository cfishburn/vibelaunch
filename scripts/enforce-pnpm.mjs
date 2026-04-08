const userAgent = process.env.npm_config_user_agent ?? '';

if (userAgent.includes('pnpm/')) {
	process.exit(0);
}

console.error('\nThis project uses pnpm.');
console.error('Run `pnpm install` instead of npm or yarn.\n');
process.exit(1);
