import 'server-only';
import { desc, eq, and, isNull } from 'drizzle-orm';
import { db } from './drizzle';
import {
	activityLogs,
	ActivityType,
	SanitizedActivityLog,
	Team,
	TeamDataWithMembers,
	TeamMember,
	teamMembers,
	teams,
	users,
	UserWithTeamId
} from './schema';
import { getCurrentAppUser } from '../auth/actions';
import { logActivity } from '../serverFunctions';

export const getTeamByStripeCustomerId = async (
	customerId: string
): Promise<Team | null> => {
	const result = await db
		.select()
		.from(teams)
		.where(
			and(eq(teams.stripeCustomerId, customerId), isNull(teams.deletedAt))
		)
		.limit(1);

	return result.length > 0 ? result[0] : null;
};

export const updateTeamSubscription = async (
	teamId: string,
	subscriptionData: {
		stripeSubscriptionId: string | null;
		stripeProductId: string | null;
		planName: string | null;
		subscriptionStatus: string;
	}
): Promise<void> => {
	await db
		.update(teams)
		.set({
			...subscriptionData,
			updatedAt: new Date()
		})
		.where(eq(teams.id, teamId));
};

export const getUserWithTeam = async (
	userId: string
): Promise<UserWithTeamId | null> => {
	const result = await db
		.select({
			user: users,
			teamId: teamMembers.teamId
		})
		.from(users)
		.innerJoin(teamMembers, eq(users.id, teamMembers.userId))
		.where(
			and(
				eq(users.id, userId),
				isNull(users.deletedAt),
				isNull(teamMembers.deletedAt)
			)
		)
		.limit(1);

	return result.length > 0 ? result[0] : null;
};

export const getActivityLogs = async (): Promise<SanitizedActivityLog[]> => {
	const user = await getCurrentAppUser();

	return await db
		.select({
			id: activityLogs.id,
			action: activityLogs.action,
			timestamp: activityLogs.timestamp,
			userName: users.name
		})
		.from(activityLogs)
		.leftJoin(users, eq(activityLogs.userId, users.id))
		.where(eq(activityLogs.userId, user.id))
		.orderBy(desc(activityLogs.timestamp))
		.limit(10);
};

export const getTeamForUser = async (
	userId: string
): Promise<TeamDataWithMembers | null> => {
	const result = await db.query.teamMembers.findFirst({
		where: eq(teamMembers.userId, userId),
		with: {
			team: {
				with: {
					teamMembers: {
						with: {
							user: {
								columns: {
									id: true,
									name: true,
									email: true
								}
							}
						}
					}
				}
			}
		}
	});

	return result?.team || null;
};

export const createUserWithTeam = async (
	clerkId: string,
	email: string,
	name: string
): Promise<TeamMember> => {
	const [user, team] = await Promise.all([
		await db
			.insert(users)
			.values({
				clerkId: clerkId,
				email,
				name
			})
			.returning(),
		await db.insert(teams).values({ name: 'Team' }).returning()
	]);

	// todo: use TServerActionError
	if (user.length < 1 || team.length < 1) {
		throw Error('Failed creating user or team');
	}

	const teamMember = await db
		.insert(teamMembers)
		.values({ userId: user[0].id, teamId: team[0].id, role: 'owner' })
		.returning();

	if (teamMember.length < 1) {
		throw Error('Failed creating team membership for user');
	}

	return teamMember[0];
};

export const deleteUserWithTeamMembership = async (
	clerkId: string
): Promise<void> => {
	const user = await db.query.users.findFirst({
		where: (users, { eq }) => {
			return eq(users.clerkId, clerkId);
		},
		with: {
			teamMembers: true
		}
	});

	if (!user) {
		throw Error('User not found');
	}

	const [deletedTeamMemberships, deletedUsers] = await Promise.all([
		await db
			.update(teamMembers)
			.set({ deletedAt: new Date() })
			.where(eq(teamMembers.userId, user.id))
			.returning(),
		await db
			.update(users)
			.set({ deletedAt: new Date() })
			.where(eq(users.clerkId, clerkId))
			.returning()
	]);

	if (deletedTeamMemberships.length < 1 || deletedUsers.length < 1) {
		throw Error('Error on deleting user or its team membership');
	}

	const deletedTeamMembership = deletedTeamMemberships[0];

	await logActivity(
		deletedTeamMembership.teamId,
		deletedTeamMembership.userId,
		ActivityType.DELETE_ACCOUNT
	);

	const remainingTeamMembers = await db
		.select()
		.from(teamMembers)
		.where(
			and(
				eq(teamMembers.teamId, deletedTeamMembership.teamId),
				isNull(teamMembers.deletedAt)
			)
		);

	if (remainingTeamMembers.length > 0) {
		await db
			.update(teams)
			.set({ deletedAt: new Date() })
			.where(eq(teams.id, remainingTeamMembers[0].teamId));
	}
};
