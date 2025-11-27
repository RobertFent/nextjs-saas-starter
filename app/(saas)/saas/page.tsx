import { JSX } from 'react';

export default function SaasPage(): JSX.Element {
	return (
		<main>
			<section className='py-20'>
				<div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
					<div className='sm:text-center md:max-w-2xl md:mx-auto lg:col-span-6 lg:text-left'>
						<h1 className='text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl'>
							Your <span className='text-accent'> SaaS </span>
							will live here
						</h1>
						<p className='mt-3 text-base text-foreground/80 sm:mt-5 sm:text-xl lg:text-lg xl:text-xl'>
							This is the main area of your product, accessible
							only to registered users. Here, you can access all
							features and tools you implemented in your SaaS
							solution. The landing page is just for marketing and
							showcasing the product, while this section is
							dedicated to delivering the actual value to users.
						</p>
						<p className='mt-3 text-base text-foreground/80 sm:mt-5 sm:text-xl lg:text-lg xl:text-xl'>
							Already implemented is the initial version of the
							dashboard. There you can invite and remove users to
							your team and manage the Stripe subscription.
						</p>
					</div>
				</div>
			</section>
		</main>
	);
}
