import 'server-only';
import { db } from '@/lib/db/drizzle';
import { User, users } from '@/lib/db/schema';
import { auth, clerkClient } from '@clerk/nextjs/server';
import { ClerkAPIResponseError } from '@clerk/types';
import { eq, isNull, and } from 'drizzle-orm';
import { logger } from '../logger';
import { formatError } from '../formatters';

const log = logger.child({
	action: 'auth'
});

export const getCurrentAppUser = async (): Promise<User> => {
	try {
		const session = await auth();
		const userId = session.userId;

		if (!userId) {
			return session.redirectToSignIn();
		}

		const user = await db
			.select()
			.from(users)
			.where(and(eq(users.clerkId, userId), isNull(users.deletedAt)));
		if (user.length === 0) {
			session.redirectToSignUp();
		}

		return user[0];
	} catch (e) {
		throw Error(`Error getting current app user: ${formatError(e)}`);
	}
};

export const sendInvitation = async (
	email: string,
	teamId: string,
	role: string
): Promise<void> => {
	try {
		const client = await clerkClient();
		await client.invitations.createInvitation({
			emailAddress: email,
			redirectUrl: `${process.env.BASE_URL}/dashboard`, // todo: check how to login with new user on correct page and wait in webhook for creation
			publicMetadata: {
				teamId: teamId,
				role: role
			}
		});
		log.debug(`Invitation sent to: ${email}`);
	} catch (e) {
		const message =
			(e as ClerkAPIResponseError)?.errors?.[0]?.longMessage ??
			formatError(e);
		throw Error(`Error sending clerk invitation: ${message}`);
	}
};
