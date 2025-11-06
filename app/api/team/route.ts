import { withApiAuthAndTryCatch } from '@/lib/auth/middleware';
import { getTeamForUser } from '@/lib/db/queries';
import { Team } from '@/lib/db/schema';
import { NextResponse } from 'next/server';

export const GET = withApiAuthAndTryCatch<[Request], Team | { error: string }>(
	async (user, _req) => {
		const team = await getTeamForUser(user.id);

		if (!team) {
			return NextResponse.json(
				{
					error: 'You are not assigned to any team. This should never happen. Please contact an administrator or create a new account'
				},
				{ status: 500 }
			);
		}
		return NextResponse.json(team, { status: 200 });
	}
);
