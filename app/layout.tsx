import './globals.css';
import type { Metadata, Viewport } from 'next';
import { Manrope } from 'next/font/google';
import { SWRConfig } from 'swr';
import { JSX } from 'react';
import { ClerkProvider } from '@clerk/nextjs';

export const metadata: Metadata = {
	title: 'Next.js SaaS Starter',
	description:
		'Get started quickly with Next.js, Postgres, Stripe, Clerk and PostHog.'
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
			<html lang='en' className={`${manrope.className}`}>
				<body className='min-h-[100dvh]'>
					{/* <header className='flex justify-end items-center p-4 gap-4 h-16'></header> */}
					<SWRConfig
						value={{
							fallback: {
								// We do NOT await here
								// Only components that read this data will suspend
								// '/api/user': getCurrentAppUser(),
								// '/api/team': getTeamForUser()
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
