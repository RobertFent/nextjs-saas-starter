'use client';

import Link from 'next/link';
import { JSX } from 'react';
import { CircleIcon } from 'lucide-react';
import { RedirectToSignIn, SignedOut, UserButton } from '@clerk/nextjs';

const Header = (): JSX.Element => {
	return (
		<header className='border-b'>
			<div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center overflow-auto'>
				{/* left items */}
				<Link href='/saas' className='flex items-center'>
					<CircleIcon className='h-4 sm:h-6 w-4 sm:w-6 text-accent' />
					<span className='ml-2 sm:text-xl font-semibold'>
						Application
					</span>
				</Link>
				{/* right items */}
				<div className='flex items-center space-x-4'>
					<Link href='/saas/dashboard' className='flex items-center'>
						<span className='ml-4 sm:text-xl font-semibold'>
							Dashboard
						</span>
					</Link>
					<UserButton />
				</div>
			</div>
		</header>
	);
};

export default function SaaSLayout({
	children
}: {
	children: React.ReactNode;
}): JSX.Element {
	return (
		<>
			<SignedOut>
				<RedirectToSignIn />
			</SignedOut>
			<section className='flex flex-col min-h-screen'>
				<Header />
				{children}
			</section>
		</>
	);
}
