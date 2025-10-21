/* eslint-disable @typescript-eslint/no-explicit-any */
import { z } from 'zod';
import { getTeamForUser } from '../db/queries';
import { User, TeamDataWithMembers } from '../db/schema';
import { getCurrentAppUser } from './actions';

export interface ActionState {
	error?: string;
	success?: string;
	[key: string]: any; // This allows for additional properties
}

type ValidatedActionWithUserFunction<S extends z.ZodType<any, any>, T> = (
	data: z.infer<S>,
	formData: FormData,
	user: User
) => Promise<T>;

export const validatedActionWithUser = <S extends z.ZodType<any, any>, T>(
	schema: S,
	action: ValidatedActionWithUserFunction<S, T>
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

		const result = schema.safeParse(Object.fromEntries(formData));
		if (!result.success) {
			return { error: result.error.issues[0].message };
		}

		return action(result.data, formData, user);
	};
};

type ActionWithTeamFunction<T> = (
	formData: FormData,
	team: TeamDataWithMembers
) => Promise<T>;

export function withTeam<T>(action: ActionWithTeamFunction<T>) {
	return async (formData: FormData): Promise<T> => {
		// todo
		const _user = await getCurrentAppUser();

		const team = await getTeamForUser();
		if (!team) {
			throw new Error('Team not found');
		}

		return action(formData, team);
	};
}
