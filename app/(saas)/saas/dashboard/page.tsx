'use client';

import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
	Card,
	CardContent,
	CardHeader,
	CardTitle,
	CardFooter
} from '@/components/ui/card';
import { JSX, useActionState, useEffect, useState } from 'react';
import { removeTeamMember, inviteTeamMember } from '@/lib/actions';
import useSWR, { useSWRConfig } from 'swr';
import { Input } from '@/components/ui/input';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Loader2, PlusCircle } from 'lucide-react';
import { TeamDataWithMembers, User } from '@/lib/db/schema';
import { customerPortalAction } from '@/lib/payments/actions';
import { fetcher } from '@/lib/utils';
import { UserRole } from '@/lib/enums';

interface ActionState {
	error?: string;
	success?: string;
}

function SubscriptionSkeleton(): JSX.Element {
	return (
		<Card className='mb-8 h-[140px]'>
			<CardHeader>
				<CardTitle>Team Subscription</CardTitle>
			</CardHeader>
		</Card>
	);
}

function ManageSubscription({
	team,
	isOwner
}: {
	team: TeamDataWithMembers;
	isOwner: boolean;
}): JSX.Element {
	return (
		<Card className='mb-8'>
			<CardHeader>
				<CardTitle>Team Subscription</CardTitle>
			</CardHeader>
			<CardContent>
				<div className='space-y-4'>
					<div className='flex flex-col sm:flex-row justify-between items-start sm:items-center'>
						<div className='mb-4 sm:mb-0'>
							<p className='font-medium'>
								Current Plan: {team.planName}
							</p>
							<p className='text-sm text-muted-foreground'>
								{team.subscriptionStatus === 'active'
									? 'Billed monthly'
									: team?.subscriptionStatus === 'trialing'
										? 'Trial period'
										: 'No active subscription'}
							</p>
						</div>
						{isOwner && (
							<form action={customerPortalAction}>
								<Button type='submit' variant='outline'>
									Manage Subscription
								</Button>
							</form>
						)}
					</div>
				</div>
			</CardContent>
		</Card>
	);
}

function TeamMembersSkeleton(): JSX.Element {
	return (
		<Card className='mb-8 h-[140px]'>
			<CardHeader>
				<CardTitle>Team Members</CardTitle>
			</CardHeader>
			<CardContent>
				<div className='animate-pulse space-y-4 mt-1'>
					<div className='flex items-center space-x-4'>
						<div className='size-8 rounded-full bg-muted' />
						<div className='space-y-2'>
							<div className='h-4 w-32 bg-muted rounded' />
							<div className='h-3 w-14 bg-muted rounded' />
						</div>
					</div>
				</div>
			</CardContent>
		</Card>
	);
}

function TeamMembers({
	team,
	currentUserId,
	isOwner
}: {
	team: TeamDataWithMembers;
	currentUserId: string;
	isOwner: boolean;
}): JSX.Element {
	const [removeState, removeAction, isRemovePending] = useActionState<
		ActionState,
		FormData
	>(removeTeamMember, {});
	const { mutate } = useSWRConfig();

	useEffect(() => {
		if (removeState.success) {
			mutate('/api/team'); // revalidate SWR cache after successful deletion
		}
	}, [mutate, removeState]);

	const getUserDisplayName = (
		user: Pick<User, 'id' | 'name' | 'email'>
	): string => {
		return user.name || user.email || 'Unknown User';
	};

	if (!team.teamMembers.length) {
		return (
			<Card className='mb-8'>
				<CardHeader>
					<CardTitle>Team Members</CardTitle>
				</CardHeader>
				<CardContent>
					<p className='text-muted-foreground'>
						No team members yet.
					</p>
				</CardContent>
			</Card>
		);
	}

	const ownerIds = team.teamMembers
		.filter((member) => {
			return member.role === UserRole.OWNER;
		})
		.map((owner) => {
			return owner.userId;
		});

	return (
		<Card className='mb-8'>
			<CardHeader>
				<CardTitle>Team Members</CardTitle>
			</CardHeader>
			<CardContent>
				<ul className='space-y-4'>
					{team.teamMembers.map((member) => {
						// current user may only leave if not last owner and not last team member
						const isCurrentMemberUser =
							member.userId === currentUserId;
						const isCurrentMemberOwner = ownerIds.includes(
							member.userId
						);
						const isCurrentMemberLastOwner =
							isCurrentMemberOwner && ownerIds.length === 1;
						const isCurrentMemberAllowedToLeave =
							isCurrentMemberUser &&
							team.teamMembers.length > 1 &&
							!isCurrentMemberLastOwner;

						// only allow removing as owner and only the role member or leave as current user
						const isMemberRemoveable =
							isOwner &&
							member.userId !== currentUserId &&
							member.role === UserRole.MEMBER;
						return (
							<li
								key={member.id}
								className='flex items-center justify-between'
							>
								<div className='flex items-center space-x-4'>
									<Avatar>
										<AvatarFallback>
											{getUserDisplayName(member.user)
												.split(' ')
												.map((n) => {
													return n[0];
												})
												.join('')}
										</AvatarFallback>
									</Avatar>
									<div
										className={
											isCurrentMemberUser
												? 'text-accent'
												: ''
										}
									>
										<p className='font-medium'>
											{getUserDisplayName(member.user)}
										</p>
										<p className='text-sm text-muted-foreground capitalize'>
											{member.role}
										</p>
									</div>
								</div>

								{(isMemberRemoveable ||
									isCurrentMemberAllowedToLeave) && (
									<form action={removeAction}>
										<input
											type='hidden'
											name='memberId'
											value={member.id}
										/>
										<input
											type='hidden'
											name='userId'
											value={member.userId}
										/>
										<Button
											type='submit'
											variant='outline'
											size='sm'
											disabled={isRemovePending}
										>
											{isRemovePending &&
											!isCurrentMemberUser
												? 'Removing...'
												: isRemovePending &&
													  isCurrentMemberUser
													? 'Leaving...'
													: isCurrentMemberUser
														? 'Leave'
														: 'Remove'}
										</Button>
									</form>
								)}
							</li>
						);
					})}
				</ul>
				{removeState.error && (
					<p className='text-red-500 mt-4'>{removeState.error}</p>
				)}
			</CardContent>
		</Card>
	);
}

function InviteTeamMemberSkeleton(): JSX.Element {
	return (
		<Card className='h-[260px]'>
			<CardHeader>
				<CardTitle>Invite Team Member</CardTitle>
			</CardHeader>
		</Card>
	);
}

function InviteTeamMember({ isOwner }: { isOwner: boolean }): JSX.Element {
	const [inviteState, inviteAction, isInvitePending] = useActionState<
		ActionState,
		FormData
	>(inviteTeamMember, {});

	return (
		<Card>
			<CardHeader>
				<CardTitle>Invite Team Member</CardTitle>
			</CardHeader>
			<CardContent>
				<form action={inviteAction} className='space-y-4'>
					<div>
						<Label htmlFor='email' className='mb-2'>
							Email
						</Label>
						<Input
							id='email'
							name='email'
							type='email'
							placeholder='Enter email'
							required
							disabled={!isOwner}
						/>
					</div>
					<div>
						<Label>Role</Label>
						<RadioGroup
							defaultValue='member'
							name='role'
							className='flex space-x-4'
							disabled={!isOwner}
						>
							<div className='flex items-center space-x-2 mt-2'>
								<RadioGroupItem value='member' id='member' />
								<Label htmlFor='member'>
									{UserRole.MEMBER}
								</Label>
							</div>
							<div className='flex items-center space-x-2 mt-2'>
								<RadioGroupItem value='owner' id='owner' />
								<Label htmlFor='owner'>{UserRole.OWNER}</Label>
							</div>
						</RadioGroup>
					</div>
					{inviteState?.error && (
						<p className='text-red-500'>{inviteState.error}</p>
					)}
					{inviteState?.success && (
						<p className='text-green-500'>{inviteState.success}</p>
					)}
					<Button
						type='submit'
						className='bg-accent hover:bg-accent-foreground hover:text-accent'
						disabled={isInvitePending || !isOwner}
					>
						{isInvitePending ? (
							<>
								<Loader2 className='mr-2 h-4 w-4 animate-spin' />
								Inviting...
							</>
						) : (
							<>
								<PlusCircle className='mr-2 h-4 w-4' />
								Invite Member
							</>
						)}
					</Button>
				</form>
			</CardContent>
			{!isOwner && (
				<CardFooter>
					<p className='text-sm text-muted-foreground'>
						You must be a team owner to invite new members.
					</p>
				</CardFooter>
			)}
		</Card>
	);
}

export default function SettingsPage(): JSX.Element {
	const {
		data: team,
		isLoading: isLoadingTeam,
		error: teamLoadingError
	} = useSWR<TeamDataWithMembers>('/api/team', fetcher);
	const {
		data: user,
		isLoading: isLoadingUser,
		error: userLoadingError
	} = useSWR<User>('/api/user', fetcher);
	const [isOwner, setIsOwner] = useState(false);

	useEffect(() => {
		if (team && user) {
			const teamMemberShip = team.teamMembers.find((teamMember) => {
				return teamMember.userId === user.id;
			});
			// eslint-disable-next-line react-hooks/set-state-in-effect
			setIsOwner(teamMemberShip?.role === UserRole.OWNER);
		}
	}, [team, user]);

	useEffect(() => {
		if (teamLoadingError) {
			throw Error(teamLoadingError);
		}
		if (userLoadingError) {
			throw Error(userLoadingError);
		}
	}, [teamLoadingError, userLoadingError]);

	return (
		<section className='flex-1 p-4 lg:p-8'>
			<h1 className='text-lg lg:text-2xl font-medium mb-6'>
				Team Settings
			</h1>
			{(isLoadingTeam || isLoadingUser) && (
				<>
					<SubscriptionSkeleton />
					<TeamMembersSkeleton />
					<InviteTeamMemberSkeleton />
				</>
			)}
			{team && user && (
				<>
					<ManageSubscription team={team} isOwner={isOwner} />
					<TeamMembers
						team={team}
						currentUserId={user.id}
						isOwner={isOwner}
					/>
					<InviteTeamMember isOwner={isOwner} />
				</>
			)}
		</section>
	);
}
