'use client';

import { cn } from '@/lib/utils';
import { Avatar as AvatarPrimitive } from 'radix-ui';
import { JSX } from 'react';

const Avatar = ({
	className,
	...props
}: React.ComponentProps<typeof AvatarPrimitive.Root>): JSX.Element => {
	return (
		<AvatarPrimitive.Root
			data-slot='avatar'
			className={cn(
				'relative flex size-8 shrink-0 overflow-hidden rounded-full',
				className
			)}
			{...props}
		/>
	);
};

const AvatarFallback = ({
	className,
	...props
}: React.ComponentProps<typeof AvatarPrimitive.Fallback>): JSX.Element => {
	return (
		<AvatarPrimitive.Fallback
			data-slot='avatar-fallback'
			className={cn(
				'bg-muted flex size-full items-center justify-center rounded-full',
				className
			)}
			{...props}
		/>
	);
};

export { Avatar, AvatarFallback };
