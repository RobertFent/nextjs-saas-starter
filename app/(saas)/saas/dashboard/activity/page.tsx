import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { getActivityLogs } from '@/lib/db/queries';
import { ActivityType } from '@/lib/enums';
import {
	Settings,
	LogOut,
	UserPlus,
	UserCog,
	AlertCircle,
	UserMinus,
	Mail,
	CheckCircle,
	type LucideIcon
} from 'lucide-react';
import { JSX } from 'react';

const iconMap: Record<ActivityType, LucideIcon> = {
	[ActivityType.SIGN_UP]: UserPlus,
	[ActivityType.SIGN_IN]: UserCog,
	[ActivityType.SIGN_OUT]: LogOut,
	[ActivityType.UPDATE_ACCOUNT]: Settings,
	[ActivityType.CREATE_TEAM]: UserPlus,
	[ActivityType.REMOVE_TEAM_MEMBER]: UserMinus,
	[ActivityType.INVITE_TEAM_MEMBER]: Mail,
	[ActivityType.ACCEPT_INVITATION]: CheckCircle
};

const getRelativeTime = (date: Date): string => {
	const now = new Date();
	const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

	if (diffInSeconds < 60) {
		return 'just now';
	}
	if (diffInSeconds < 3600) {
		return `${Math.floor(diffInSeconds / 60)} minutes ago`;
	}
	if (diffInSeconds < 86400) {
		return `${Math.floor(diffInSeconds / 3600)} hours ago`;
	}
	if (diffInSeconds < 604800) {
		return `${Math.floor(diffInSeconds / 86400)} days ago`;
	}
	return date.toLocaleDateString();
};

function formatAction(action: ActivityType): string {
	switch (action) {
		case ActivityType.SIGN_UP:
			return 'You signed up';
		case ActivityType.SIGN_IN:
			return 'You signed in';
		case ActivityType.SIGN_OUT:
			return 'You signed out';
		case ActivityType.UPDATE_ACCOUNT:
			return 'You updated your account';
		case ActivityType.CREATE_TEAM:
			return 'You created a new team';
		case ActivityType.REMOVE_TEAM_MEMBER:
			return 'You removed a team member';
		case ActivityType.INVITE_TEAM_MEMBER:
			return 'You invited a team member';
		case ActivityType.ACCEPT_INVITATION:
			return 'You accepted an invitation';
		default:
			return 'Unknown action occurred';
	}
}

export default async function ActivityPage(): Promise<JSX.Element> {
	const logs = await getActivityLogs();

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
					{logs.length > 0 ? (
						<ul className='space-y-4'>
							{logs.map((log) => {
								const Icon =
									iconMap[log.action as ActivityType] ||
									Settings;
								const formattedAction = formatAction(
									log.action as ActivityType
								);

								return (
									<li
										key={log.id}
										className='flex items-center space-x-4'
									>
										<div className='bg-accent rounded-full p-2'>
											<Icon className='w-5 h-5 text-accent-foreground' />
										</div>
										<div className='flex-1'>
											<p className='text-sm font-medium'>
												{formattedAction}
											</p>
											<p className='text-xs text-foreground/80'>
												{getRelativeTime(
													new Date(log.timestamp)
												)}
											</p>
										</div>
									</li>
								);
							})}
						</ul>
					) : (
						<div className='flex flex-col items-center justify-center text-center py-12'>
							<AlertCircle className='h-12 w-12 text-accent mb-4' />
							<h3 className='text-lg font-semibold mb-2'>
								No activity yet
							</h3>
							<p className='text-sm text-foreground/80 max-w-sm'>
								When you perform actions like signing in,
								they&apos;ll appear here.
							</p>
						</div>
					)}
				</CardContent>
			</Card>
		</section>
	);
}
