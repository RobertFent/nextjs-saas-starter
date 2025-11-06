'use server';

import { z } from 'zod';
import { and, eq, isNull } from 'drizzle-orm';
import { validatedActionWithUserAndTeamId } from '@/lib/auth/middleware';
import { db } from '@/lib/db/drizzle';
import { users, teamMembers } from '@/lib/db/schema';
import { logger } from '@/lib/logger';
import { logActivity } from './serverFunctions';
import { deleteUser, sendInvitation } from './auth/actions';
import { ActivityType, UserRole } from './enums';

const log = logger.child({
	server: 'action'
});

const updateAccountSchema = z.object({
	name: z.string().min(1, 'Name is required').max(100),
	email: z.email('Invalid email address')
});

export const updateAccount = validatedActionWithUserAndTeamId(
	updateAccountSchema,
	async (data, _, userWithTeam) => {
		const { name, email } = data;

		await Promise.all([
			db
				.update(users)
				.set({ name, email })
				.where(eq(users.id, userWithTeam.user.id)),
			logActivity(
				userWithTeam.teamId,
				userWithTeam.user.id,
				ActivityType.UPDATE_ACCOUNT
			)
		]);

		return { name, success: 'Account updated successfully.' };
	}
);

const removeTeamMemberSchema = z.object({
	memberId: z.string(),
	clerkId: z.string()
});

export const removeTeamMember = validatedActionWithUserAndTeamId(
	removeTeamMemberSchema,
	async (data, _, userWithTeam) => {
		const { memberId, clerkId } = data;

		try {
			await db
				.update(teamMembers)
				.set({ deletedAt: new Date() })
				.where(
					and(
						eq(teamMembers.id, memberId),
						eq(teamMembers.teamId, userWithTeam.teamId)
					)
				);

			await logActivity(
				userWithTeam.teamId,
				userWithTeam.user.id,
				ActivityType.REMOVE_TEAM_MEMBER
			);

			await deleteUser(clerkId);
		} catch (error) {
			log.error(error);
			return {
				error: 'Error during removal of team member and deletion of user'
			};
		}

		log.debug(
			`Team member with member id: ${memberId} and user with clerk id${clerkId} removed`
		);

		return { success: 'Team member removed and user deleted successfully' };
	}
);

const inviteTeamMemberSchema = z.object({
	email: z.email('Invalid email address'),
	role: z.enum(UserRole)
});

export const inviteTeamMember = validatedActionWithUserAndTeamId(
	inviteTeamMemberSchema,
	async (data, _, userWithTeam) => {
		const { email, role } = data;

		const existingMember = await db
			.select()
			.from(users)
			.leftJoin(teamMembers, eq(users.id, teamMembers.userId))
			.where(
				and(
					eq(users.email, email),
					eq(teamMembers.teamId, userWithTeam.teamId),
					isNull(users.deletedAt),
					isNull(teamMembers.deletedAt)
				)
			)
			.limit(1);

		if (existingMember.length > 0) {
			return { error: 'User is already a member of this team' };
		}

		// Create a new invitation
		await sendInvitation(email, userWithTeam.teamId, role);

		await logActivity(
			userWithTeam.teamId,
			userWithTeam.user.id,
			ActivityType.INVITE_TEAM_MEMBER
		);

		log.debug(
			`User with id: ${userWithTeam.user.id} invited to team with id: ${userWithTeam.teamId}`
		);

		return { success: 'Invitation sent successfully' };
	}
);
