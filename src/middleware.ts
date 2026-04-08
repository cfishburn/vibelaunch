import { clerkMiddleware, createRouteMatcher } from '@clerk/astro/server';

import { isAdminUserId } from './lib/auth';
import { forbiddenJson, unauthorizedJson } from './lib/server/http';

const isProtectedPageRoute = createRouteMatcher(['/app(.*)', '/admin(.*)']);
const isAdminPageRoute = createRouteMatcher(['/admin(.*)']);
const isProtectedApiRoute = createRouteMatcher(['/api/viewer.json', '/api/admin(.*)']);
const isAdminApiRoute = createRouteMatcher(['/api/admin(.*)']);

export const onRequest = clerkMiddleware((auth, context, next) => {
	const { isAuthenticated, redirectToSignIn, userId } = auth();

	if (isProtectedApiRoute(context.request) && !isAuthenticated) {
		return unauthorizedJson();
	}

	if (isAdminApiRoute(context.request) && !isAdminUserId(userId)) {
		return forbiddenJson();
	}

	if (isProtectedPageRoute(context.request) && !isAuthenticated) {
		return redirectToSignIn();
	}

	if (isAdminPageRoute(context.request) && !isAdminUserId(userId)) {
		return context.redirect('/app');
	}

	return next();
});
