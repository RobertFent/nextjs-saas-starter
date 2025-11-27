import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { JSX } from 'react';

export default function ActivityPageSkeleton(): JSX.Element {
	return (
		<section className='flex-1 p-4 lg:p-8'>
			<h1 className='text-lg lg:text-2xl font-medium mb-6'>
				Activity Log
			</h1>
			<Card>
				<CardHeader>
					<CardTitle>Recent Activity</CardTitle>
				</CardHeader>
				<CardContent>
					<div className='animate-pulse space-y-4 mt-1'>
						<div className='flex items-center space-x-4'>
							<div className='size-8 rounded-full bg-muted'></div>
							<div className='space-y-2'>
								<div className='h-4 w-32 bg-muted rounded'></div>
								<div className='h-3 w-14 bg-muted rounded'></div>
							</div>
						</div>
					</div>
				</CardContent>
			</Card>
		</section>
	);
}
