import { eq, isNull, and } from 'drizzle-orm';
import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { stripe } from '@/lib/payments/stripe';
import { db } from '@/lib/db/drizzle';
import { users, teamMembers, teams } from '@/lib/db/schema';
import { logger } from '@/lib/logger';
import { formatError } from '@/lib/formatters';
import { withApiAuthAndTryCatch } from '@/lib/auth/middleware';

const log = logger.child({
	api: 'stripe/checkout'
});

export const GET = withApiAuthAndTryCatch<[NextRequest], unknown>(
	async (_user, request) => {
		const searchParams = request.nextUrl.searchParams;
		const sessionId = searchParams.get('session_id');

		if (!sessionId) {
			return NextResponse.redirect(new URL('/pricing', request.url));
		}

		try {
			const session = await stripe.checkout.sessions.retrieve(sessionId, {
				expand: ['customer', 'subscription']
			});

			if (!session.customer || typeof session.customer === 'string') {
				throw new Error('Invalid customer data from Stripe.');
			}

			const customerId = session.customer.id;
			const subscriptionId =
				typeof session.subscription === 'string'
					? session.subscription
					: session.subscription?.id;

			if (!subscriptionId) {
				throw new Error('No subscription found for this session.');
			}

			const subscription = await stripe.subscriptions.retrieve(
				subscriptionId,
				{
					expand: ['items.data.price.product']
				}
			);

			const plan = subscription.items.data[0]?.price;

			if (!plan) {
				throw new Error('No plan found for this subscription.');
			}

			const productId = (plan.product as Stripe.Product).id;

			if (!productId) {
				throw new Error('No product ID found for this subscription.');
			}

			const userId = session.client_reference_id;
			if (!userId) {
				throw new Error(
					"No user ID found in session's client_reference_id."
				);
			}

			const user = await db
				.select()
				.from(users)
				.where(and(eq(users.id, userId), isNull(users.deletedAt)))
				.limit(1);

			if (user.length === 0) {
				throw new Error('User deleted or not found in database.');
			}

			const userTeam = await db
				.select({
					teamId: teamMembers.teamId
				})
				.from(teamMembers)
				.where(
					and(
						eq(teamMembers.userId, user[0].id),
						isNull(teamMembers.deletedAt)
					)
				)
				.limit(1);

			if (userTeam.length === 0) {
				throw new Error('User is not associated with any team.');
			}

			await db
				.update(teams)
				.set({
					stripeCustomerId: customerId,
					stripeSubscriptionId: subscriptionId,
					stripeProductId: productId,
					planName: (plan.product as Stripe.Product).name,
					subscriptionStatus: subscription.status,
					updatedAt: new Date()
				})
				.where(eq(teams.id, userTeam[0].teamId));

			return NextResponse.redirect(
				new URL('/saas/dashboard', request.url)
			);
		} catch (error) {
			log.error(`Error during stripe checkout: ${formatError(error)}`);
			return NextResponse.json(
				{
					error: `An error occured during stripe checkout`
				},
				{ status: 500 }
			);
		}
	}
);
