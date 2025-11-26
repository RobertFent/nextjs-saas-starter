import { z } from 'zod';
import { getTeamForUser, getUserWithTeam } from '../db/queries';
import { UserWithTeam, UserWithTeamId } from '../db/schema';
import { getCurrentAppUser } from './actions';
import { NextResponse } from 'next/server';
import { User } from '@/lib/db/schema';
import { logger } from '../logger';
import { formatError } from '../formatters';

const log = logger.child({
	lib: 'auth/middleware'
});

export interface ActionState {
	error?: string;
	success?: string;
	[key: string]: any; // This allows for additional properties
}

type ValidatedActionWithUserAndTeamIdFunction<
	S extends z.ZodType<any, any>,
	T
> = (data: z.infer<S>, formData: FormData, user: UserWithTeamId) => Promise<T>;

export const validatedActionWithUserAndTeamId = <
	S extends z.ZodType<any, any>,
	T
>(
	schema: S,
	action: ValidatedActionWithUserAndTeamIdFunction<S, T>
) => {
	return async (
		prevState: ActionState,
		formData: FormData
	): Promise<
		| T
		| {
				error: string;
		  }
	> => {
		const user = await getCurrentAppUser();
		const databaseUserWithTeamId = await getUserWithTeam(user.id);

		if (!databaseUserWithTeamId) {
			throw Error('User does not exist or no team is assigned to user');
		}

		const result = schema.safeParse(Object.fromEntries(formData));
		if (!result.success) {
			return { error: result.error.issues[0].message };
		}

		return action(result.data, formData, databaseUserWithTeamId);
	};
};

type ActionWithUserAndTeamFunction<T> = (
	formData: FormData,
	team: UserWithTeam
) => Promise<T>;

export function withUserAndTeam<T>(action: ActionWithUserAndTeamFunction<T>) {
	return async (formData: FormData): Promise<T> => {
		const user = await getCurrentAppUser();
		const team = await getTeamForUser(user.id);
		if (!team) {
			throw new Error('Team not found');
		}

		const userWithTeam = { ...user, team: team };

		return action(formData, userWithTeam);
	};
}

export function withApiAuthAndTryCatch<TArgs extends unknown[], TResponse>(
	handler: (user: User, ...args: TArgs) => Promise<NextResponse<TResponse>>
): (...args: TArgs) => Promise<NextResponse<TResponse | { error: string }>> {
	return async (...args) => {
		let user: User;
		try {
			user = await getCurrentAppUser();
		} catch (error) {
			// ignore NEXT_REDIRECT
			if (error instanceof Error && error.message === 'NEXT_REDIRECT') {
				throw error;
			}
			log.error(formatError(error));
			return NextResponse.json(
				{
					error: `Error during retrieval of user data`
				},
				{ status: 500 }
			);
		}

		try {
			return await handler(user, ...args);
		} catch (error) {
			log.error(formatError(error));
			return NextResponse.json(
				{
					error: 'An unexpected error happened during the API request'
				},
				{
					status: 500
				}
			);
		}
	};
}
