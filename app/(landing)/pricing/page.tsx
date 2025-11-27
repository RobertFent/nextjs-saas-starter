import { Check } from 'lucide-react';
import { SubmitButton } from './submit-button';
import { JSX } from 'react';
import { getStripePrices, getStripeProducts } from '@/lib/payments/stripe';
import { checkoutAction } from '@/lib/payments/actions';

// Prices are fresh for one hour max
export const revalidate = 3600;

export default async function PricingPage(): Promise<JSX.Element> {
	const [prices, products] = await Promise.all([
		getStripePrices(),
		getStripeProducts()
	]);

	const basePlan = products.find((product) => {
		return product.name === 'Base';
	});
	const plusPlan = products.find((product) => {
		return product.name === 'Plus';
	});

	const basePrice = prices.find((price) => {
		return price.productId === basePlan?.id;
	});
	const plusPrice = prices.find((price) => {
		return price.productId === plusPlan?.id;
	});

	return (
		<main className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12'>
			<div className='grid md:grid-cols-2 gap-8 max-w-xl mx-auto'>
				<PricingCard
					name={basePlan?.name || 'Base'}
					price={basePrice?.unitAmount || 800}
					interval={basePrice?.interval || 'month'}
					trialDays={basePrice?.trialPeriodDays || 7}
					features={[
						'Unlimited Usage',
						'Unlimited Workspace Members',
						'Email Support'
					]}
					priceId={basePrice?.id}
				/>
				<PricingCard
					name={plusPlan?.name || 'Plus'}
					price={plusPrice?.unitAmount || 1200}
					interval={plusPrice?.interval || 'month'}
					trialDays={plusPrice?.trialPeriodDays || 7}
					features={[
						'Everything in Base, and:',
						'Early Access to New Features',
						'24/7 Support + Slack Access'
					]}
					priceId={plusPrice?.id}
				/>
			</div>
		</main>
	);
}

const PricingCard = ({
	name,
	price,
	interval,
	trialDays,
	features,
	priceId
}: {
	name: string;
	price: number;
	interval: string;
	trialDays: number;
	features: string[];
	priceId?: string;
}): JSX.Element => {
	return (
		<div className='p-6 bg-secondary/60 rounded-xl flex flex-col'>
			<div className='flex-1'>
				<h2 className='text-2xl font-bold mb-2'>{name}</h2>
				<p className='text-sm mb-4 text-secondary-foreground/80'>
					with {trialDays} day free trial
				</p>
				<p className='text-4xl font-medium text-secondary-foreground/80 mb-6'>
					${price / 100}{' '}
					<span className='text-xl font-normal text-secondary-foreground'>
						per user / {interval}
					</span>
				</p>
				<ul className='space-y-4 mb-8'>
					{features.map((feature, index) => {
						return (
							<li key={index} className='flex items-start'>
								<Check className='h-5 w-5 text-accent mr-2 mt-0.5 flex-shrink-0' />
								<span className='text-secondary-foreground/70'>
									{feature}
								</span>
							</li>
						);
					})}
				</ul>
			</div>
			<form action={checkoutAction} className='mt-auto'>
				<input type='hidden' name='priceId' value={priceId} />
				<SubmitButton />
			</form>
		</div>
	);
};
