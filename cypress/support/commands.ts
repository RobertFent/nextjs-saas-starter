import 'cypress-file-upload';
import '@cypress/snapshot';

Cypress.Commands.add('setupPostgresDataMinimal', () => {
	// disable park_prod_seeding and company profiles seeding because this takes too long and is not needed for most tests
	cy.exec('echo todo').its('exitCode').should('eq', 0);
});

Cypress.Commands.add(
	'delayedMatchImageSnapshot',
	(
		path: string,
		target:
			| Cypress.Chainable<JQuery<HTMLElement>>
			| Cypress.Chainable<Cypress.AUTWindow>,
		customFailureThreshold?: number,
		blackout?: string[]
	) => {
		const isHeadless = Cypress.config('isInteractive') === false;
		if (isHeadless) {
			// wait just in case any css or something like chartjs would be still loading or even scrollbar still shown -> happens sometimes in pipe
			// eslint-disable-next-line cypress/no-unnecessary-waiting
			cy.wait(2000);
			target.matchImageSnapshot(path, {
				// always blackout version tag because locally the version tag would be -development and in the pipe -staging
				blackout: [...(blackout ?? [])],
				failureThreshold: customFailureThreshold ?? 0.04
			});
		}
	}
);
