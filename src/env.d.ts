/// <reference types="astro/client" />

interface ImportMetaEnv {
	readonly SITE_URL?: string;
	readonly PUBLIC_SUPABASE_URL?: string;
	readonly PUBLIC_SUPABASE_ANON_KEY?: string;
	readonly PUBLIC_CLERK_PUBLISHABLE_KEY?: string;
	readonly CLERK_SECRET_KEY?: string;
	readonly CLERK_ADMIN_USER_IDS?: string;
	readonly CLERK_SIGN_IN_URL?: string;
	readonly CLERK_SIGN_UP_URL?: string;
	readonly CLERK_SIGN_IN_FORCE_REDIRECT_URL?: string;
	readonly CLERK_SIGN_UP_FORCE_REDIRECT_URL?: string;
}

interface ImportMeta {
	readonly env: ImportMetaEnv;
}
