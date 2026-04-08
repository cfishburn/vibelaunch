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

export function unauthorizedJson(message = 'Unauthorized') {
	return jsonResponse({ error: message }, { status: 401 });
}

export function forbiddenJson(message = 'Forbidden') {
	return jsonResponse({ error: message }, { status: 403 });
}

export function badRequestJson(message = 'Bad Request') {
	return jsonResponse({ error: message }, { status: 400 });
}
