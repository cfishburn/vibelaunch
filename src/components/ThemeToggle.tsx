import { useEffect, useState } from 'react';
import { HalfMoonIcon, Icon, SunIcon } from './icons';

const STORAGE_KEY = 'vl-theme';

type Theme = 'light' | 'dark';

function getSystemTheme(): Theme {
	if (typeof window === 'undefined') return 'light';
	return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function getStoredTheme(): Theme | null {
	if (typeof window === 'undefined') return null;
	const stored = localStorage.getItem(STORAGE_KEY);
	return stored === 'light' || stored === 'dark' ? stored : null;
}

function applyTheme(theme: Theme) {
	document.documentElement.setAttribute('data-theme', theme);
}

export default function ThemeToggle() {
	const [theme, setTheme] = useState<Theme>('light');

	useEffect(() => {
		const initial = getStoredTheme() ?? getSystemTheme();
		setTheme(initial);
		applyTheme(initial);
	}, []);

	function toggle() {
		const next = theme === 'light' ? 'dark' : 'light';
		setTheme(next);
		applyTheme(next);
		localStorage.setItem(STORAGE_KEY, next);
	}

	return (
		<button
			type="button"
			onClick={toggle}
			className="btn btn-outline btn-sm btn-square"
			aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
		>
			{theme === 'light' ? (
				<Icon icon={HalfMoonIcon} className="h-4 w-4" />
			) : (
				<Icon icon={SunIcon} className="h-4 w-4" />
			)}
		</button>
	);
}
