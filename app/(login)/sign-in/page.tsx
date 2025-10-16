import { JSX, Suspense } from 'react';
import { Login } from '../login';

export default function SignInPage(): JSX.Element {
	return (
		<Suspense>
			<Login mode='signin' />
		</Suspense>
	);
}
