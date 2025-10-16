import { JSX, Suspense } from 'react';
import { Login } from '../login';

export default function SignUpPage(): JSX.Element {
	return (
		<Suspense>
			<Login mode='signup' />
		</Suspense>
	);
}
