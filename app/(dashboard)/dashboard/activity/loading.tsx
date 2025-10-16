import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { JSX } from 'react';

export default function ActivityPageSkeleton(): JSX.Element {
	return (
		<section className='flex-1 p-4 lg:p-8'>
			<h1 className='text-lg lg:text-2xl font-medium text-gray-900 mb-6'>
				Activity Log
			</h1>
			<Card>
				<CardHeader>
					<CardTitle>Recent Activity</CardTitle>
				</CardHeader>
				<CardContent className='min-h-[88px]' />
			</Card>
		</section>
	);
}
