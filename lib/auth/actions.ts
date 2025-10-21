import { db } from '@/lib/db/drizzle';
import { User, users } from '@/lib/db/schema';
import { auth } from '@clerk/nextjs/server';
import { eq } from 'drizzle-orm';
import { logger } from '../logger';

const log = logger.child({
	action: 'auth'
});

export const getCurrentAppUser = async (): Promise<User> => {
	const session = await auth();
	const userId = session.userId;

	log.debug(session);
	log.debug(userId);

	if (!userId) {
		return session.redirectToSignIn();
	}

	const user = await db.select().from(users).where(eq(users.clerkId, userId));
	if (user.length === 0) {
		session.redirectToSignUp();
	}

	return user[0];
};
