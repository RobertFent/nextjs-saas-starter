import 'server-only';
import { desc, eq } from 'drizzle-orm';
import { db } from './drizzle';
import {
	activityLogs,
	SanitizedActivityLog,
	Team,
	TeamDataWithMembers,
	teamMembers,
	teams,
	users,
	UserWithTeamId
} from './schema';
import { getCurrentAppUser } from '../auth/actions';

export const getTeamByStripeCustomerId = async (
	customerId: string
): Promise<Team | null> => {
	const result = await db
		.select()
		.from(teams)
		.where(eq(teams.stripeCustomerId, customerId))
		.limit(1);

	return result.length > 0 ? result[0] : null;
};

export const updateTeamSubscription = async (
	teamId: number,
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
	userId: number
): Promise<UserWithTeamId | null> => {
	const result = await db
		.select({
			user: users,
			teamId: teamMembers.teamId
		})
		.from(users)
		.leftJoin(teamMembers, eq(users.id, teamMembers.userId))
		.where(eq(users.id, userId))
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
			ipAddress: activityLogs.ipAddress,
			userName: users.name
		})
		.from(activityLogs)
		.leftJoin(users, eq(activityLogs.userId, users.id))
		.where(eq(activityLogs.userId, user.id))
		.orderBy(desc(activityLogs.timestamp))
		.limit(10);
};

export const getTeamForUser = async (): Promise<TeamDataWithMembers | null> => {
	const user = await getCurrentAppUser();

	const result = await db.query.teamMembers.findFirst({
		where: eq(teamMembers.userId, user.id),
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
): Promise<void> => {
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
};

export const deleteUserWithTeam = async (clerkId: string): Promise<void> => {
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

	// this deletes sequential -> maybe use cascade in sql
	await db.delete(teamMembers).where(eq(teamMembers.userId, user.id));
	await db.delete(teams).where(eq(teams.id, user.teamMembers[0]?.teamId));
	await db.delete(users).where(eq(users.clerkId, clerkId));
};
