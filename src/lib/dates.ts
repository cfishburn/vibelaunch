export function formatDate(value: Date | string) {
	return new Intl.DateTimeFormat('en-US', {
		dateStyle: 'medium',
	}).format(new Date(value));
}

export function formatDateTime(value: Date | string) {
	return new Intl.DateTimeFormat('en-US', {
		dateStyle: 'medium',
		timeStyle: 'short',
	}).format(new Date(value));
}
