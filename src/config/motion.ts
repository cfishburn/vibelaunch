export const motion = {
	fastDuration: '180ms',
	baseDuration: '260ms',
	slowDuration: '420ms',
	pageDuration: '320ms',
	staggerStep: '70ms',
	distanceVertical: '18px',
	distanceHorizontal: '28px',
	easingStandard: 'cubic-bezier(0.22, 1, 0.36, 1)',
	easingEmphasis: 'cubic-bezier(0.16, 1, 0.3, 1)',
} as const;

export const motionCssVariables = Object.entries({
	'--motion-duration-fast': motion.fastDuration,
	'--motion-duration-base': motion.baseDuration,
	'--motion-duration-slow': motion.slowDuration,
	'--motion-duration-page': motion.pageDuration,
	'--motion-stagger-step': motion.staggerStep,
	'--motion-distance-y': motion.distanceVertical,
	'--motion-distance-x': motion.distanceHorizontal,
	'--motion-ease-standard': motion.easingStandard,
	'--motion-ease-emphasis': motion.easingEmphasis,
})
	.map(([property, value]) => `${property}:${value}`)
	.join(';');
