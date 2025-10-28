import { Webhook } from 'svix';
import { NextResponse } from 'next/server';
import { WebhookEvent } from '@clerk/nextjs/server';
import {
	createUserWithTeam,
	deleteUserWithTeamMembership
} from '@/lib/db/queries';
import { logger } from '@/lib/logger';
import { logActivity } from '@/lib/serverFunctions';
import { ActivityType } from '@/lib/db/schema';
import { formatError } from '@/lib/formatters';

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
	log.debug(type);

	// todo: invitation results in user.created
	if (type === 'user.created') {
		const data = event.data;
		const { id, email_addresses, first_name, last_name } = data;
		const email = email_addresses?.[0]?.email_address;
		const name = `${first_name ?? ''} ${last_name ?? ''}`.trim();
		const teamMember = await createUserWithTeam(id, email, name);
		await logActivity(
			teamMember.teamId,
			teamMember.userId,
			ActivityType.SIGN_UP
		);
	} else if (type === 'user.deleted') {
		const data = event.data;
		const { id } = data;
		if (id) {
			await deleteUserWithTeamMembership(data.id ?? '');
		}
	}

	return new Response('ok');
}
