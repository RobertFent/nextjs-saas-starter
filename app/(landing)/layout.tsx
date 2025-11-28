'use client';

import Link from 'next/link';
import { JSX } from 'react';
import { CircleIcon } from 'lucide-react';
import {
	ClerkLoaded,
	ClerkLoading,
	SignedIn,
	SignedOut,
	SignInButton
} from '@clerk/nextjs';

const ClerkMenu = (): JSX.Element => {
	return (
		<>
			<ClerkLoading>
				{/* Skeleton or placeholder */}
				<div className='rounded-full bg-accent h-10 sm:h-12 px-4 sm:px-5 sm:w-22 animate-pulse' />
			</ClerkLoading>

			<ClerkLoaded>
				<SignedOut>
					<SignInButton>
						<button className='bg-accent rounded-full font-medium text-sm sm:text-base h-10 sm:h-12 px-4 sm:px-5 cursor-pointer'>
							Sign In
						</button>
					</SignInButton>
				</SignedOut>

				<SignedIn>
					<Link href='/saas' className='flex items-center'>
						<span className='sm:ml-2 sm:text-xl font-semibold'>
							Dashboard
						</span>
					</Link>
				</SignedIn>
			</ClerkLoaded>
		</>
	);
};

const Header = (): JSX.Element => {
	return (
		<header className='border-b'>
			<div className='max-w-7xl mx-auto px-2 sm:px-6 lg:px-8 py-2 sm:py-4 flex justify-between items-center overflow-auto'>
				{/* left items */}
				<Link href='/' className='flex items-center'>
					<CircleIcon className='h-4 sm:h-6 w-4 sm:w-6 text-accent' />
					<span className='ml-2 sm:text-xl font-semibold'>
						Application
					</span>
				</Link>
				{/* right items */}
				<div className='flex items-center space-x-4'>
					<Link href='/'>
						<span className='ml-4 sm:text-xl font-semibold'>
							Home
						</span>
					</Link>
					<Link href='/pricing'>
						<span className='sm:ml-2 sm:text-xl font-semibold'>
							Pricing
						</span>
					</Link>
					<Link href='/blog'>
						<span className='sm:ml-2 sm:text-xl font-semibold'>
							Blog
						</span>
					</Link>
					<ClerkMenu />
				</div>
			</div>
		</header>
	);
};

export default function LandingLayout({
	children
}: {
	children: React.ReactNode;
}): JSX.Element {
	return (
		<section className='flex flex-col min-h-screen'>
			<Header />
			{children}
		</section>
	);
}
