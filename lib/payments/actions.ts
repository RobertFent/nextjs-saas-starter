'use server';

import { redirect } from 'next/navigation';
import { createCheckoutSession, createCustomerPortalSession } from './stripe';
import { withUserAndTeam } from '../auth/middleware';

export const checkoutAction = withUserAndTeam(
	async (formData, userWithTeam) => {
		const priceId = formData.get('priceId') as string;
		await createCheckoutSession({ userWithTeam, priceId });
	}
);

export const customerPortalAction = withUserAndTeam(async (_, userWithTeam) => {
	const portalSession = await createCustomerPortalSession(userWithTeam);
	redirect(portalSession.url);
});
