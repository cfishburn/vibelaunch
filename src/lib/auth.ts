import { z } from 'zod';

const authEnvSchema = z.object({
	CLERK_ADMIN_USER_IDS: z.string().optional(),
});

export function getAdminUserIds() {
	const { CLERK_ADMIN_USER_IDS } = authEnvSchema.parse(import.meta.env);

	if (!CLERK_ADMIN_USER_IDS) {
		return [];
	}

	return CLERK_ADMIN_USER_IDS.split(',')
		.map((value) => value.trim())
		.filter(Boolean);
}

export function isAdminUserId(userId?: string | null) {
	if (!userId) {
		return false;
	}

	return getAdminUserIds().includes(userId);
}
