import { pgTable, uuid, varchar, text, timestamp } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

export const users = pgTable('users', {
	id: uuid('id').primaryKey().defaultRandom(),
	clerkId: text('clerk_id'),
	name: varchar('name', { length: 100 }),
	email: varchar('email', { length: 255 }).notNull(),
	createdAt: timestamp('created_at').notNull().defaultNow(),
	updatedAt: timestamp('updated_at').notNull().defaultNow(),
	deletedAt: timestamp('deleted_at')
});

export const teams = pgTable('teams', {
	id: uuid('id').primaryKey().defaultRandom(),
	stripeCustomerId: text('stripe_customer_id').unique(),
	stripeSubscriptionId: text('stripe_subscription_id').unique(),
	stripeProductId: text('stripe_product_id'),
	planName: varchar('plan_name', { length: 50 }),
	subscriptionStatus: varchar('subscription_status', { length: 20 }),
	createdAt: timestamp('created_at').notNull().defaultNow(),
	updatedAt: timestamp('updated_at').notNull().defaultNow(),
	deletedAt: timestamp('deleted_at')
});

export const teamMembers = pgTable('team_members', {
	id: uuid('id').primaryKey().defaultRandom(),
	userId: uuid('user_id')
		.notNull()
		.references(() => {
			return users.id;
		}),
	teamId: uuid('team_id')
		.notNull()
		.references(() => {
			return teams.id;
		}),
	role: varchar('role', { length: 50 }).notNull(),
	joinedAt: timestamp('joined_at').notNull().defaultNow(),
	deletedAt: timestamp('deleted_at')
});

export const activityLogs = pgTable('activity_logs', {
	id: uuid('id').primaryKey().defaultRandom(),
	teamId: uuid('team_id')
		.notNull()
		.references(() => {
			return teams.id;
		}),
	userId: uuid('user_id').references(() => {
		return users.id;
	}),
	action: text('action').notNull(),
	timestamp: timestamp('timestamp').notNull().defaultNow()
});

export const teamsRelations = relations(teams, ({ many }) => {
	return {
		teamMembers: many(teamMembers),
		activityLogs: many(activityLogs)
	};
});

export const usersRelations = relations(users, ({ many }) => {
	return {
		teamMembers: many(teamMembers)
	};
});

export const teamMembersRelations = relations(teamMembers, ({ one }) => {
	return {
		user: one(users, {
			fields: [teamMembers.userId],
			references: [users.id]
		}),
		team: one(teams, {
			fields: [teamMembers.teamId],
			references: [teams.id]
		})
	};
});

export const activityLogsRelations = relations(activityLogs, ({ one }) => {
	return {
		team: one(teams, {
			fields: [activityLogs.teamId],
			references: [teams.id]
		}),
		user: one(users, {
			fields: [activityLogs.userId],
			references: [users.id]
		})
	};
});

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Team = typeof teams.$inferSelect;
export type NewTeam = typeof teams.$inferInsert;
export type TeamMember = typeof teamMembers.$inferSelect;
export type NewTeamMember = typeof teamMembers.$inferInsert;
export type ActivityLog = typeof activityLogs.$inferSelect;
export type NewActivityLog = typeof activityLogs.$inferInsert;

export type UserWithTeam = User & { team: TeamDataWithMembers };

export type TeamDataWithMembers = Team & {
	teamMembers: (TeamMember & {
		user: Pick<User, 'id' | 'name' | 'email' | 'clerkId'>;
	})[];
};
export type SanitizedActivityLog = Omit<ActivityLog, 'userId' | 'teamId'>;
export interface UserWithTeamId {
	user: User;
	teamId: string;
}
