'use client';

import Link from 'next/link';
import { JSX } from 'react';
import { CircleIcon } from 'lucide-react';
import {
	ClerkLoaded,
	ClerkLoading,
	SignedIn,
	SignedOut,
	SignInButton,
	SignUpButton,
	UserButton
} from '@clerk/nextjs';

const UserMenu = (): JSX.Element => {
	return (
		<>
			<ClerkLoading>
				{/* Skeleton or placeholder */}
				<div className='w-7 h-7 rounded-full bg-gray-200 animate-pulse' />
			</ClerkLoading>

			<ClerkLoaded>
				<SignedOut>
					<SignUpButton>
						<button className='bg-[#6c47ff] text-white rounded-full font-medium text-sm sm:text-base h-10 sm:h-12 px-4 sm:px-5 cursor-pointer'>
							Sign Up
						</button>
					</SignUpButton>
					<SignInButton />
				</SignedOut>

				<SignedIn>
					<UserButton />
				</SignedIn>
			</ClerkLoaded>
		</>
	);
};

const Header = (): JSX.Element => {
	return (
		<header className='border-b border-gray-200'>
			<div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center'>
				{/* left items */}
				<Link href='/' className='flex items-center'>
					<CircleIcon className='h-6 w-6 text-orange-500' />
					<span className='ml-2 text-xl font-semibold text-gray-900'>
						ACME
					</span>
				</Link>
				{/* right items */}
				<div className='flex items-center space-x-4'>
					<Link href='/' className='flex items-center'>
						<span className='ml-2 text-xl font-semibold text-gray-900'>
							Home
						</span>
					</Link>
					<Link href='/pricing' className='flex items-center'>
						<span className='ml-2 text-xl font-semibold text-gray-900'>
							Pricing
						</span>
					</Link>
					<Link href='/dashboard' className='flex items-center'>
						<span className='ml-2 text-xl font-semibold text-gray-900'>
							Dashboard
						</span>
					</Link>
					<UserMenu />
				</div>
			</div>
		</header>
	);
};

export default function Layout({
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
