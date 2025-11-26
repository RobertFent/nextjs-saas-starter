import { Webhook } from 'svix';
import { NextResponse } from 'next/server';
import { WebhookEvent } from '@clerk/nextjs/server';
import {
	addUserToTeam,
	createTeam,
	createUser,
	deleteUserWithTeamMembership
} from '@/lib/db/queries';
import { logger } from '@/lib/logger';
import { formatError } from '@/lib/formatters';
import { ActivityType, UserRole } from '@/lib/enums';
import { logActivity } from '@/lib/serverFunctions';

const log = logger.child({
	api: 'webhooks/clerk'
});

const webhookSecret = process.env.CLERK_WEBHOOK_SECRET!;

export async function POST(request: Request): Promise<Response> {
	const payload = await request.text();
	const svixId = request.headers.get('svix-id');
	const svixTimestamp = request.headers.get('svix-timestamp');
	const svixSignature = request.headers.get('svix-signature');

	if (!svixId || !svixTimestamp || !svixSignature) {
		return new Response('Missing svix headers', { status: 400 });
	}

	const wh = new Webhook(webhookSecret);

	let event: WebhookEvent;
	try {
		event = wh.verify(payload, {
			'svix-id': svixId,
			'svix-timestamp': svixTimestamp,
			'svix-signature': svixSignature
		}) as WebhookEvent;
	} catch (err) {
		log.error(`Webhook signature verification failed. ${formatError(err)}`);
		return NextResponse.json(
			{ error: 'Webhook signature verification failed.' },
			{ status: 400 }
		);
	}

	const type = event.type;

	if (type === 'user.created') {
		const data = event.data;
		const { id, email_addresses, first_name, last_name, public_metadata } =
			data;
		const email = email_addresses[0]?.email_address;
		const name = `${first_name ?? ''} ${last_name ?? ''}`.trim();

		// create user in any case
		const user = await createUser(id, email, name);

		const hasInvite =
			'teamId' in public_metadata && 'role' in public_metadata;

		let teamId: string, role: UserRole;
		if (hasInvite) {
			// reuse public teamId and role
			teamId = public_metadata.teamId as string;
			role = public_metadata.role as UserRole;
			await logActivity(teamId, user.id, ActivityType.ACCEPT_INVITATION);
		} else {
			// create new team by default
			const newTeam = await createTeam(user.id);
			teamId = newTeam.id;
			role = UserRole.OWNER;
		}

		// add user in any case to new team or existing team
		await addUserToTeam(user.id, teamId, role);
	} else if (type === 'user.deleted') {
		const data = event.data;
		const { id } = data;
		if (id) {
			await deleteUserWithTeamMembership(data.id ?? '');
		}
	}

	return new Response('ok');
}
