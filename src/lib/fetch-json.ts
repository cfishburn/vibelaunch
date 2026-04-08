export class JsonRequestError extends Error {
	readonly status: number;
	readonly statusText: string;
	readonly url: string;

	constructor(message: string, options: { status: number; statusText: string; url: string }) {
		super(message);
		this.name = 'JsonRequestError';
		this.status = options.status;
		this.statusText = options.statusText;
		this.url = options.url;
	}
}

function getErrorMessage(payload: unknown, response: Response) {
	if (payload && typeof payload === 'object' && 'error' in payload) {
		const error = payload.error;
		if (typeof error === 'string' && error.trim().length > 0) {
			return error;
		}
	}

	return `Request failed with ${response.status} ${response.statusText}.`;
}

export async function fetchJson<T>(input: string, init?: RequestInit): Promise<T> {
	const response = await fetch(input, {
		...init,
		headers: {
			accept: 'application/json',
			...(init?.headers ?? {}),
		},
	});
	const text = await response.text();
	let payload: unknown = null;

	if (text) {
		try {
			payload = JSON.parse(text);
		} catch {
			throw new JsonRequestError('The server returned invalid JSON.', {
				status: response.status,
				statusText: response.statusText,
				url: response.url || input,
			});
		}
	}

	if (!response.ok) {
		throw new JsonRequestError(getErrorMessage(payload, response), {
			status: response.status,
			statusText: response.statusText,
			url: response.url || input,
		});
	}

	if (!text) {
		throw new JsonRequestError('The server returned an empty response.', {
			status: response.status,
			statusText: response.statusText,
			url: response.url || input,
		});
	}

	return payload as T;
}

export function getRequestErrorMessage(error: unknown, fallback: string) {
	if (error instanceof JsonRequestError) {
		return error.message;
	}

	if (error instanceof Error && error.message.trim().length > 0) {
		return error.message;
	}

	return fallback;
}
