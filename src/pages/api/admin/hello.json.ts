import type { APIRoute } from 'astro';

import { getAdminUserIds, isAdminUserId } from '../../../lib/auth';
import { getViewerSummary } from '../../../lib/server/clerk-bff';
import {
	forbiddenJson,
	jsonResponse,
	serverErrorJson,
	unauthorizedJson,
} from '../../../lib/server/http';

export const prerender = false;

export const GET: APIRoute = async (context) => {
	try {
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
	} catch (error) {
		console.error('[admin/hello.json] Unable to build admin payload.', error);
		return serverErrorJson('Unable to load the admin demo payload.');
	}
};
