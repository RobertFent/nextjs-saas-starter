import Stripe from 'stripe';
import { redirect } from 'next/navigation';
import {
	getTeamByStripeCustomerId,
	updateTeamSubscription
} from '../db/queries';
import { UserWithTeam } from '../db/schema';
import { StripePrice, StripeProduct } from '../definitions/stripe';
import { logger } from '../logger';
import { UserRole } from '../enums';

const log = logger.child({
	lib: 'stripe'
});

// connect to stripe
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
	apiVersion: '2025-04-30.basil'
});

export async function createCheckoutSession({
	userWithTeam,
	priceId
}: {
	userWithTeam: UserWithTeam;
	priceId: string;
}): Promise<void> {
	const session = await stripe.checkout.sessions.create({
		payment_method_types: ['card'],
		line_items: [
			{
				price: priceId,
				quantity: 1
			}
		],
		mode: 'subscription',
		success_url: `${process.env.BASE_URL}/api/stripe/checkout?session_id={CHECKOUT_SESSION_ID}`,
		cancel_url: `${process.env.BASE_URL}/pricing`,
		customer: userWithTeam.team.stripeCustomerId || undefined,
		client_reference_id: userWithTeam.id.toString(),
		allow_promotion_codes: true,
		subscription_data: {
			trial_period_days: 14
		}
	});

	redirect(session.url!);
}

export async function createCustomerPortalSession(
	userWithTeam: UserWithTeam
): Promise<Stripe.Response<Stripe.BillingPortal.Session>> {
	if (
		!userWithTeam.team.stripeCustomerId ||
		!userWithTeam.team.stripeProductId
	) {
		redirect('/pricing');
	}

	// get role of current user in team and verify if is owner
	const membership = userWithTeam.team.teamMembers.find((members) => {
		return members.userId === userWithTeam.id;
	});
	if (membership?.role !== UserRole.OWNER) {
		throw Error('User not authorized');
	}

	let configuration: Stripe.BillingPortal.Configuration;
	const configurations = await stripe.billingPortal.configurations.list();

	if (configurations.data.length > 0) {
		configuration = configurations.data[0];
	} else {
		const product = await stripe.products.retrieve(
			userWithTeam.team.stripeProductId
		);
		if (!product.active) {
			throw new Error("Team's product is not active in Stripe");
		}

		const prices = await stripe.prices.list({
			product: product.id,
			active: true
		});
		if (prices.data.length === 0) {
			throw new Error("No active prices found for the team's product");
		}

		configuration = await stripe.billingPortal.configurations.create({
			business_profile: {
				headline: 'Manage your subscription'
			},
			features: {
				subscription_update: {
					enabled: true,
					default_allowed_updates: [
						'price',
						'quantity',
						'promotion_code'
					],
					proration_behavior: 'create_prorations',
					products: [
						{
							product: product.id,
							prices: prices.data.map((price) => {
								return price.id;
							})
						}
					]
				},
				subscription_cancel: {
					enabled: true,
					mode: 'at_period_end',
					cancellation_reason: {
						enabled: true,
						options: [
							'too_expensive',
							'missing_features',
							'switched_service',
							'unused',
							'other'
						]
					}
				},
				payment_method_update: {
					enabled: true
				}
			}
		});
	}

	return stripe.billingPortal.sessions.create({
		customer: userWithTeam.team.stripeCustomerId,
		return_url: `${process.env.BASE_URL}/saas/dashboard`,
		configuration: configuration.id
	});
}

export const handleSubscriptionChange = async (
	subscription: Stripe.Subscription
): Promise<void> => {
	const customerId = subscription.customer as string;
	const subscriptionId = subscription.id;
	const status = subscription.status;

	const team = await getTeamByStripeCustomerId(customerId);

	if (!team) {
		log.error(`Team not found for Stripe customer: ${customerId}`);
		return;
	}

	if (status === 'active' || status === 'trialing') {
		const plan = subscription.items.data[0]?.plan;
		await updateTeamSubscription(team.id, {
			stripeSubscriptionId: subscriptionId,
			stripeProductId: plan?.product as string,
			planName: (plan?.product as Stripe.Product).name,
			subscriptionStatus: status
		});
	} else if (status === 'canceled' || status === 'unpaid') {
		await updateTeamSubscription(team.id, {
			stripeSubscriptionId: null,
			stripeProductId: null,
			planName: null,
			subscriptionStatus: status
		});
	}
};

export const getStripePrices = async (): Promise<StripePrice[]> => {
	const prices = await stripe.prices.list({
		expand: ['data.product'],
		active: true,
		type: 'recurring'
	});

	return prices.data.map((price) => {
		return {
			id: price.id,
			productId:
				typeof price.product === 'string'
					? price.product
					: price.product.id,
			unitAmount: price.unit_amount,
			currency: price.currency,
			interval: price.recurring?.interval,
			trialPeriodDays: price.recurring?.trial_period_days
		};
	});
};

export const getStripeProducts = async (): Promise<StripeProduct[]> => {
	const products = await stripe.products.list({
		active: true,
		expand: ['data.default_price']
	});

	return products.data.map((product) => {
		return {
			id: product.id,
			name: product.name,
			description: product.description,
			defaultPriceId:
				typeof product.default_price === 'string'
					? product.default_price
					: product.default_price?.id
		};
	});
};
