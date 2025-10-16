import { getUser } from '@/lib/db/queries';

export async function GET(): Promise<Response> {
	const user = await getUser();
	return Response.json(user);
}
