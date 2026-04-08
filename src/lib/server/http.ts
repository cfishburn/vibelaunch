export function jsonResponse(body: unknown, init: ResponseInit = {}) {
	const headers = new Headers(init.headers);

	if (!headers.has('content-type')) {
		headers.set('content-type', 'application/json; charset=utf-8');
	}

	if (!headers.has('cache-control')) {
		headers.set('cache-control', 'private, no-store');
	}

	return new Response(JSON.stringify(body), {
		...init,
		headers,
	});
}

export function errorJson(status: number, message: string) {
	return jsonResponse({ error: message, status }, { status });
}

export function unauthorizedJson(message = 'Unauthorized') {
	return errorJson(401, message);
}

export function forbiddenJson(message = 'Forbidden') {
	return errorJson(403, message);
}

export function badRequestJson(message = 'Bad Request') {
	return errorJson(400, message);
}

export function serverErrorJson(message = 'Internal Server Error') {
	return errorJson(500, message);
}
