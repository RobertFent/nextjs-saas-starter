'use server';

import { z } from 'zod';
import { and, eq } from 'drizzle-orm';
import { validatedActionWithUser } from '@/lib/auth/middleware';
import { db } from '@/lib/db/drizzle';
import { getUserWithTeam } from '@/lib/db/queries';
import {
	ActivityType,
	NewActivityLog,
	activityLogs,
	users,
	teamMembers,
	invitations
} from '@/lib/db/schema';
import { logger } from '@/lib/logger';

const log = logger.child({
	login: 'action'
});

const logActivity = async (
	teamId: number | null | undefined,
	userId: number,
	type: ActivityType,
	ipAddress?: string
): Promise<void> => {
	if (teamId === null || teamId === undefined) {
		return;
	}
	const newActivity: NewActivityLog = {
		teamId,
		userId,
		action: type,
		ipAddress: ipAddress || ''
	};
	log.debug(newActivity);
	await db.insert(activityLogs).values(newActivity);
};

const updateAccountSchema = z.object({
	name: z.string().min(1, 'Name is required').max(100),
	email: z.string().email('Invalid email address')
});

export const updateAccount = validatedActionWithUser(
	updateAccountSchema,
	async (data, _, user) => {
		const { name, email } = data;
		const userWithTeam = await getUserWithTeam(user.id);

		await Promise.all([
			db.update(users).set({ name, email }).where(eq(users.id, user.id)),
			logActivity(
				userWithTeam?.teamId,
				user.id,
				ActivityType.UPDATE_ACCOUNT
			)
		]);

		return { name, success: 'Account updated successfully.' };
	}
);

const removeTeamMemberSchema = z.object({
	memberId: z.number()
});

export const removeTeamMember = validatedActionWithUser(
	removeTeamMemberSchema,
	async (data, _, user) => {
		const { memberId } = data;
		const userWithTeam = await getUserWithTeam(user.id);

		if (!userWithTeam?.teamId) {
			return { error: 'User is not part of a team' };
		}

		await db
			.delete(teamMembers)
			.where(
				and(
					eq(teamMembers.id, memberId),
					eq(teamMembers.teamId, userWithTeam.teamId)
				)
			);

		await logActivity(
			userWithTeam.teamId,
			user.id,
			ActivityType.REMOVE_TEAM_MEMBER
		);

		return { success: 'Team member removed successfully' };
	}
);

const inviteTeamMemberSchema = z.object({
	email: z.string().email('Invalid email address'),
	role: z.enum(['member', 'owner'])
});

export const inviteTeamMember = validatedActionWithUser(
	inviteTeamMemberSchema,
	async (data, _, user) => {
		const { email, role } = data;
		const userWithTeam = await getUserWithTeam(user.id);

		if (!userWithTeam?.teamId) {
			return { error: 'User is not part of a team' };
		}

		const existingMember = await db
			.select()
			.from(users)
			.leftJoin(teamMembers, eq(users.id, teamMembers.userId))
			.where(
				and(
					eq(users.email, email),
					eq(teamMembers.teamId, userWithTeam.teamId)
				)
			)
			.limit(1);

		if (existingMember.length > 0) {
			return { error: 'User is already a member of this team' };
		}

		// Check if there's an existing invitation
		const existingInvitation = await db
			.select()
			.from(invitations)
			.where(
				and(
					eq(invitations.email, email),
					eq(invitations.teamId, userWithTeam.teamId),
					eq(invitations.status, 'pending')
				)
			)
			.limit(1);

		if (existingInvitation.length > 0) {
			return {
				error: 'An invitation has already been sent to this email'
			};
		}

		// Create a new invitation
		await db.insert(invitations).values({
			teamId: userWithTeam.teamId,
			email,
			role,
			invitedBy: user.id,
			status: 'pending'
		});

		await logActivity(
			userWithTeam.teamId,
			user.id,
			ActivityType.INVITE_TEAM_MEMBER
		);

		// TODO: Send invitation email and include ?inviteId={id} to sign-up URL
		// await sendInvitationEmail(email, userWithTeam.team.name, role)

		return { success: 'Invitation sent successfully' };
	}
);
