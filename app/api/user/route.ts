import { getCurrentAppUser } from '@/lib/auth/actions';

// todo: error handling
export async function GET(): Promise<Response> {
	const user = await getCurrentAppUser();
	return Response.json(user);
}
