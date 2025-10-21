import './globals.css';
import type { Metadata, Viewport } from 'next';
import { Manrope } from 'next/font/google';
import { SWRConfig } from 'swr';
import { JSX } from 'react';
import { getTeamForUser } from '@/lib/db/queries';
import { ClerkProvider } from '@clerk/nextjs';
// import { getCurrentAppUser } from '@/lib/auth/actions';

export const metadata: Metadata = {
	title: 'Next.js SaaS Starter',
	description: 'Get started quickly with Next.js, Postgres, and Stripe.'
};

export const viewport: Viewport = {
	maximumScale: 1
};

const manrope = Manrope({ subsets: ['latin'] });

export default function RootLayout({
	children
}: {
	children: React.ReactNode;
}): JSX.Element {
	return (
		<ClerkProvider>
			<html
				lang='en'
				className={`bg-white dark:bg-gray-950 text-black dark:text-white ${manrope.className}`}
			>
				<body className='min-h-[100dvh] bg-gray-50'>
					{/* <header className='flex justify-end items-center p-4 gap-4 h-16'></header> */}
					<SWRConfig
						value={{
							fallback: {
								// We do NOT await here
								// Only components that read this data will suspend
								// '/api/user': getCurrentAppUser(),
								'/api/team': getTeamForUser()
							}
						}}
					>
						{children}
					</SWRConfig>
				</body>
			</html>
		</ClerkProvider>
	);
}
