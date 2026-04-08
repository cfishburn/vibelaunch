import { clerkClient, type User } from '@clerk/astro/server';
import type { APIContext } from 'astro';

export interface ViewerSummary {
	userId: string;
	firstName: string | null;
	emailAddress: string | null;
}

export interface ClerkUserSummary {
	userId: string;
	firstName: string | null;
	lastName: string | null;
	emailAddress: string | null;
	username: string | null;
	createdAt: number;
	lastSignInAt: number | null;
	banned: boolean;
	locked: boolean;
}

function getPrimaryEmailAddress(user: User) {
	return (
		user.emailAddresses.find((emailAddress) => emailAddress.id === user.primaryEmailAddressId)
			?.emailAddress ?? null
	);
}

export function summarizeClerkUser(user: User): ClerkUserSummary {
	return {
		userId: user.id,
		firstName: user.firstName,
		lastName: user.lastName,
		emailAddress: getPrimaryEmailAddress(user),
		username: user.username,
		createdAt: user.createdAt,
		lastSignInAt: user.lastSignInAt,
		banned: user.banned,
		locked: user.locked,
	};
}

export async function getViewerSummary(
	context: APIContext,
	userId: string,
): Promise<ViewerSummary> {
	const user = await clerkClient(context).users.getUser(userId);
	const primaryEmail = getPrimaryEmailAddress(user);

	return {
		userId: user.id,
		firstName: user.firstName,
		emailAddress: primaryEmail,
	};
}

interface ListClerkUsersParams {
	limit: number;
	query?: string;
	emailAddress?: string[];
}

export async function listClerkUsers(context: APIContext, params: ListClerkUsersParams) {
	const response = await clerkClient(context).users.getUserList({
		limit: params.limit,
		query: params.query,
		emailAddress: params.emailAddress,
	});

	return {
		totalCount: response.totalCount,
		users: response.data.map(summarizeClerkUser),
	};
}
