import Stripe from 'stripe';

export interface StripePrice {
	id: string;
	productId: string;
	unitAmount: number | null;
	currency: string;
	interval: Stripe.Price.Recurring.Interval | undefined;
	trialPeriodDays: number | null | undefined;
}

export interface StripeProduct {
	id: string;
	name: string;
	description: string | null;
	defaultPriceId: string | undefined;
}
