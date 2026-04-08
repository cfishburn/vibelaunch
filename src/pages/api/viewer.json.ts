import type { APIRoute } from 'astro';

import { getViewerSummary } from '../../lib/server/clerk-bff';
import { jsonResponse, unauthorizedJson } from '../../lib/server/http';

export const prerender = false;

export const GET: APIRoute = async (context) => {
	const { isAuthenticated, userId } = context.locals.auth();

	if (!isAuthenticated || !userId) {
		return unauthorizedJson();
	}

	const viewer = await getViewerSummary(context, userId);

	return jsonResponse({
		hello: `Hello ${viewer.firstName ?? viewer.emailAddress ?? viewer.userId}!`,
		viewer,
		bff: {
			route: '/api/viewer.json',
			servedAt: new Date().toISOString(),
		},
	});
};
