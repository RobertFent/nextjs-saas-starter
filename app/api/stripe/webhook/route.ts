import Stripe from 'stripe';
import { NextRequest, NextResponse } from 'next/server';
import { handleSubscriptionChange, stripe } from '@/lib/payments/stripe';
import { logger } from '@/lib/logger';
import { formatError } from '@/lib/formatters';

const log = logger.child({
	api: 'stripe/webhook'
});

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

export async function POST(request: NextRequest): Promise<Response> {
	const payload = await request.text();
	const signature = request.headers.get('stripe-signature');

	if (!signature) {
		return new Response('Missing stripe-signature headers', {
			status: 400
		});
	}

	let event: Stripe.Event;

	try {
		event = stripe.webhooks.constructEvent(
			payload,
			signature,
			webhookSecret
		);
	} catch (err) {
		log.error(`Webhook signature verification failed: ${formatError(err)}`);
		return NextResponse.json(
			{ error: 'Webhook signature verification failed.' },
			{ status: 400 }
		);
	}

	switch (event.type) {
		case 'customer.subscription.updated':
		case 'customer.subscription.deleted':
			const subscription = event.data.object as Stripe.Subscription;
			await handleSubscriptionChange(subscription);
			break;
		default:
			log.info(`Unhandled stripe event type ${event.type}`);
	}

	return NextResponse.json({ received: true });
}
