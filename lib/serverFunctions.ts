import 'server-only';
import { db } from './db/drizzle';
import { NewActivityLog, activityLogs } from './db/schema';
import { logger } from './logger';
import { ActivityType } from './enums';

const log = logger.child({
	server: 'function'
});

export const logActivity = async (
	teamId: string,
	userId: string,
	type: ActivityType
): Promise<void> => {
	if (teamId === null || teamId === undefined) {
		return;
	}
	const newActivity: NewActivityLog = {
		teamId,
		userId,
		action: type
	};
	log.debug(newActivity);
	await db.insert(activityLogs).values(newActivity);
};
