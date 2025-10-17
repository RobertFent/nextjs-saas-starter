import { desc, and, eq, isNull } from 'drizzle-orm';
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
import { cookies } from 'next/headers';
import { verifyToken } from '../auth/session';

// todo: put this in server action guard maybe
export const getUser = async (): Promise<User | null> => {
	const sessionCookie = (await cookies()).get('session');
	if (!sessionCookie || !sessionCookie.value) {
		return null;
	}

	const sessionData = await verifyToken(sessionCookie.value);
	if (
		!sessionData ||
		!sessionData.user ||
		typeof sessionData.user.id !== 'number'
	) {
		return null;
	}

	if (new Date(sessionData.expires) < new Date()) {
		return null;
	}

	const user = await db
		.select()
		.from(users)
		.where(and(eq(users.id, sessionData.user.id), isNull(users.deletedAt)))
		.limit(1);

	return user.length > 0 ? user[0] : null;
};

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
	const user = await getUser();
	if (!user) {
		throw new Error('User not authenticated');
	}

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
	const user = await getUser();
	if (!user) {
		return null;
	}

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
