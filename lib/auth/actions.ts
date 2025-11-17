import 'server-only';
import { User } from '@/lib/db/schema';
import { auth, clerkClient } from '@clerk/nextjs/server';
import { ClerkAPIResponseError } from '@clerk/types';
import { logger } from '../logger';
import { formatError } from '../formatters';
import { getUserByClerkId } from '../db/queries';

const log = logger.child({
	action: 'auth'
});

export const getCurrentAppUser = async (): Promise<User> => {
	const session = await auth();
	const userId = session.userId;
	if (!userId) {
		return session.redirectToSignIn();
	}

	let user: User | null;
	try {
		user = await getUserByClerkId(userId);
	} catch (e) {
		throw Error(`Error getting current app user: ${formatError(e)}`);
	}
	if (!user) {
		return session.redirectToSignUp();
	}

	return user;
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
