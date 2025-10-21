import { Webhook } from 'svix';
import { db } from '@/lib/db/drizzle';
import { users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';
import { WebhookEvent } from '@clerk/nextjs/server';

const webhookSecret = process.env.CLERK_WEBHOOK_SECRET!;

// this was not received
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
		console.error('Webhook signature verification failed.', err);
		return NextResponse.json(
			{ error: 'Webhook signature verification failed.' },
			{ status: 400 }
		);
	}

	const type = event.type;

	if (type === 'user.created') {
		const data = event.data;
		const { id, email_addresses, first_name, last_name } = data;
		const email = email_addresses?.[0]?.email_address;

		await db.insert(users).values({
			clerkId: id,
			email,
			name: `${first_name ?? ''} ${last_name ?? ''}`.trim()
		});
	}

	if (type === 'user.deleted') {
		const data = event.data;
		await db.delete(users).where(eq(users.clerkId, data.id ?? ''));
	}

	return new Response('ok');
}
