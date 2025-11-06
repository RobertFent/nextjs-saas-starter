'use client';

import { Button } from '@/components/ui/button';
import { formatError } from '@/lib/formatters';
import { logger } from '@/lib/logger';
import { JSX, useEffect } from 'react';

const log = logger.child({ side: 'server', module: 'global-error' });

const Error = ({
	error,
	reset
}: {
	error: Error & { digest?: string };
	reset: () => void;
}): JSX.Element => {
	useEffect(() => {
		log.error(error);
	}, [error]);

	return (
		<div className='flex flex-col items-center justify-center text-center py-12'>
			<h5>Something went wrong!</h5>
			<p>{formatError(error)}</p>
			<Button
				size='lg'
				variant='outline'
				className='text-lg rounded-full'
				onClick={reset}
			>
				Try again
			</Button>
		</div>
	);
};

export default Error;
