'use client';

import Link from 'next/link';
import { JSX } from 'react';
import { CircleIcon } from 'lucide-react';
import { RedirectToSignIn, SignedOut, UserButton } from '@clerk/nextjs';

const Header = (): JSX.Element => {
	return (
		<header className='border-b border-gray-200'>
			<div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center'>
				{/* left items */}
				<Link href='/saas' className='flex items-center'>
					<CircleIcon className='h-6 w-6 text-orange-500' />
					<span className='ml-2 text-xl font-semibold text-gray-900'>
						Application
					</span>
				</Link>
				{/* right items */}
				<div className='flex items-center space-x-4'>
					<Link href='/' className='flex items-center'>
						<span className='ml-2 text-xl font-semibold text-gray-900'>
							Home
						</span>
					</Link>
					<Link href='/saas/dashboard' className='flex items-center'>
						<span className='ml-2 text-xl font-semibold text-gray-900'>
							Dashboard
						</span>
					</Link>
					<UserButton />
				</div>
			</div>
		</header>
	);
};

export default function LandinLayout({
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
