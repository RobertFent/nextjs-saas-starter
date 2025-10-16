import { getTeamForUser } from '@/lib/db/queries';

export async function GET(): Promise<Response> {
	const team = await getTeamForUser();
	return Response.json(team);
}
