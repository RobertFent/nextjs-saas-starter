import { getCurrentAppUser } from '@/lib/auth/actions';
import { getTeamForUser } from '@/lib/db/queries';

export async function GET(): Promise<Response> {
	const user = await getCurrentAppUser();
	const team = await getTeamForUser(user.id);
	return Response.json(team);
}
