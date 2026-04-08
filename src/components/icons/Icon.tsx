import type { ComponentType, SVGProps } from 'react';

export type FlatIconComponent = ComponentType<SVGProps<SVGSVGElement>>;

interface IconProps extends Omit<SVGProps<SVGSVGElement>, 'height' | 'ref' | 'width'> {
	icon: FlatIconComponent;
	size?: number;
	strokeWidth?: number;
	title?: string;
}

export default function Icon({
	icon: Glyph,
	size = 18,
	strokeWidth = 1.8,
	title,
	className,
	...props
}: IconProps) {
	return (
		<Glyph
			width={size}
			height={size}
			strokeWidth={strokeWidth}
			className={className}
			aria-hidden={title ? undefined : 'true'}
			role={title ? 'img' : undefined}
			focusable="false"
			{...props}
		>
			{title ? <title>{title}</title> : null}
		</Glyph>
	);
}
