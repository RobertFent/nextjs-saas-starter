/* eslint-disable @typescript-eslint/no-explicit-any */
import { z } from 'zod';
import { getTeamForUser, getUserWithTeam } from '../db/queries';
import { TeamDataWithMembers, UserWithTeamId } from '../db/schema';
import { getCurrentAppUser } from './actions';

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

type ActionWithTeamFunction<T> = (
	formData: FormData,
	team: TeamDataWithMembers
) => Promise<T>;

export function withTeam<T>(action: ActionWithTeamFunction<T>) {
	return async (formData: FormData): Promise<T> => {
		const user = await getCurrentAppUser();
		const team = await getTeamForUser(user.id);
		if (!team) {
			throw new Error('Team not found');
		}

		return action(formData, team);
	};
}
