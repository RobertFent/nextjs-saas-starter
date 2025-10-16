/* eslint-disable @typescript-eslint/no-explicit-any */
import { z } from 'zod';
import { redirect } from 'next/navigation';
import { getUser, getTeamForUser } from '../db/queries';
import { User, TeamDataWithMembers } from '../db/schema';

export interface ActionState {
	error?: string;
	success?: string;
	[key: string]: any; // This allows for additional properties
}

type ValidatedActionFunction<S extends z.ZodType<any, any>, T> = (
	data: z.infer<S>,
	formData: FormData
) => Promise<T>;

export function validatedAction<S extends z.ZodType<any, any>, T>(
	schema: S,
	action: ValidatedActionFunction<S, T>
) {
	return async (
		prevState: ActionState,
		formData: FormData
	): Promise<
		| T
		| {
				error: string;
		  }
	> => {
		const result = schema.safeParse(Object.fromEntries(formData));
		if (!result.success) {
			return { error: result.error.issues[0].message };
		}

		return action(result.data, formData);
	};
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
		const user = await getUser();
		if (!user) {
			throw new Error('User is not authenticated');
		}

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
		const user = await getUser();
		if (!user) {
			redirect('/sign-in');
		}

		const team = await getTeamForUser();
		if (!team) {
			throw new Error('Team not found');
		}

		return action(formData, team);
	};
}
