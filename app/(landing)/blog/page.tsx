import { JSX } from 'react';

export default function BlogPage(): JSX.Element {
	return (
		<main>
			<section className='py-20'>
				<div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
					<div className='sm:text-center md:max-w-2xl md:mx-auto lg:col-span-6 lg:text-left'>
						<h1 className='text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl'>
							Your
							<span className='text-accent'> Blog </span>
							will live here
						</h1>
						<p className='mt-3 text-base text-foreground/80 sm:mt-5 sm:text-xl lg:text-lg xl:text-xl'>
							A blog page is used to share valuable content,
							updates, and insights with your audience. It helps
							build trust, improve SEO, and engage visitors by
							providing helpful information related to your
							product or industry.
						</p>
					</div>
				</div>
			</section>
		</main>
	);
}
