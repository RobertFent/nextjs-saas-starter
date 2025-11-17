import 'server-only';
import { desc, eq, and, isNull } from 'drizzle-orm';
import { db } from './drizzle';
import {
	activityLogs,
	SanitizedActivityLog,
	Team,
	TeamDataWithMembers,
	teamMembers,
	teams,
	User,
	users,
	UserWithTeamId
} from './schema';
import { getCurrentAppUser } from '../auth/actions';
import { logActivity } from '../serverFunctions';
import { ActivityType, UserRole } from '../enums';

export const getUserByClerkId = async (
	clerkId: string
): Promise<User | null> => {
	const result = await db
		.select()
		.from(users)
		.where(and(eq(users.clerkId, clerkId), isNull(users.deletedAt)))
		.limit(1);

	// todo: could be more generic
	return result.length > 0 ? result[0] : null;
};

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
		where: and(
			eq(teamMembers.userId, userId),
			isNull(teamMembers.deletedAt) // get team by team membership of current user
		),
		with: {
			team: {
				with: {
					teamMembers: {
						where: isNull(teamMembers.deletedAt), // filter out all deleted other team memberships of current team
						with: {
							user: {
								columns: {
									id: true,
									name: true,
									email: true,
									clerkId: true
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

export const createUser = async (
	clerkId: string,
	email: string,
	name: string
): Promise<User> => {
	const user = await db
		.insert(users)
		.values({
			clerkId: clerkId,
			email,
			name
		})
		.returning();

	if (user.length < 1) {
		throw Error('Failed creating user');
	}

	return user[0];
};

export const createTeam = async (userId: string): Promise<Team> => {
	const team = await db.insert(teams).values({}).returning();

	if (team.length < 1) {
		throw Error('Failed creating team');
	}

	const newTeam = team[0];

	await logActivity(newTeam.id, userId, ActivityType.CREATE_TEAM);

	return newTeam;
};

export const addUserToTeam = async (
	userId: string,
	teamId: string,
	role: UserRole
): Promise<void> => {
	const newTeamMember = await db
		.insert(teamMembers)
		.values({
			userId: userId,
			teamId: teamId,
			role: role
		})
		.returning();

	if (newTeamMember.length < 1) {
		throw Error('Failed creating team membership for user');
	}

	await logActivity(
		newTeamMember[0].teamId,
		newTeamMember[0].userId,
		ActivityType.SIGN_UP
	);
};

export const deleteTeamMember = async (teamMemberId: string): Promise<void> => {
	await db
		.update(teamMembers)
		.set({ deletedAt: new Date() })
		.where(and(eq(teamMembers.id, teamMemberId)));
};

export const deleteUserWithTeamMembership = async (
	clerkId: string
): Promise<void> => {
	const user = await db.query.users.findFirst({
		where: and(eq(users.clerkId, clerkId), isNull(users.deletedAt))
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
			.where(eq(users.id, user.id))
			.returning()
	]);

	if (deletedTeamMemberships.length < 1 || deletedUsers.length < 1) {
		throw Error('Error on deleting user or its team membership');
	}

	const deletedTeamMembership = deletedTeamMemberships[0];

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
