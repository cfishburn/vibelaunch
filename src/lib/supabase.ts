import { createClient } from '@supabase/supabase-js';
import { z } from 'zod';

const publicSupabaseEnvSchema = z
	.object({
		PUBLIC_SUPABASE_URL: z.url().optional(),
		PUBLIC_SUPABASE_ANON_KEY: z.string().min(1).optional(),
	})
	.refine(
		(values) =>
			(!values.PUBLIC_SUPABASE_URL && !values.PUBLIC_SUPABASE_ANON_KEY) ||
			(Boolean(values.PUBLIC_SUPABASE_URL) && Boolean(values.PUBLIC_SUPABASE_ANON_KEY)),
		{
			message: 'Set both PUBLIC_SUPABASE_URL and PUBLIC_SUPABASE_ANON_KEY, or leave both empty.',
		},
	);

function getPublicSupabaseEnv() {
	const result = publicSupabaseEnvSchema.safeParse(import.meta.env);

	if (!result.success) {
		return null;
	}

	return result.data;
}

export function hasSupabaseEnv() {
	const publicEnv = getPublicSupabaseEnv();
	return Boolean(publicEnv?.PUBLIC_SUPABASE_URL && publicEnv?.PUBLIC_SUPABASE_ANON_KEY);
}

export function getSupabaseClient() {
	const publicEnv = getPublicSupabaseEnv();

	if (!publicEnv?.PUBLIC_SUPABASE_URL || !publicEnv.PUBLIC_SUPABASE_ANON_KEY) {
		return null;
	}

	return createClient(publicEnv.PUBLIC_SUPABASE_URL, publicEnv.PUBLIC_SUPABASE_ANON_KEY, {
		auth: {
			autoRefreshToken: false,
			persistSession: false,
		},
	});
}
