import type { APIRoute } from 'astro';

import { getAdminUserIds, isAdminUserId } from '../../../lib/auth';
import { getViewerSummary } from '../../../lib/server/clerk-bff';
import { forbiddenJson, jsonResponse, unauthorizedJson } from '../../../lib/server/http';

export const prerender = false;

export const GET: APIRoute = async (context) => {
	const { isAuthenticated, userId } = context.locals.auth();

	if (!isAuthenticated || !userId) {
		return unauthorizedJson();
	}

	if (!isAdminUserId(userId)) {
		return forbiddenJson();
	}

	const viewer = await getViewerSummary(context, userId);

	return jsonResponse({
		hello: `Hello admin ${viewer.firstName ?? viewer.emailAddress ?? viewer.userId}!`,
		viewer,
		admin: {
			allowlistSize: getAdminUserIds().length,
			route: '/api/admin/hello.json',
			servedAt: new Date().toISOString(),
		},
	});
};
