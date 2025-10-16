declare namespace Cypress {
	interface Chainable {
		/**
		 * Runs seeding script with minimal inital data.
		 */
		setupPostgresDataMinimal(): Chainable<Element>;

		/**
		 * Custom command to take and compare image snapshots.
		 * A small delay and custom failure threshold is added to ensure rendering in pipe.
		 * The target element should also be passed (cy.window() or cy.get('#elementId')).
		 * Saves or matches the image against the given path.
		 *
		 * @param {string} path
		 * @param {(| Cypress.Chainable<JQuery<HTMLElement>>
		 * 				| Cypress.Chainable<Cypress.AUTWindow>)} target
		 */
		delayedMatchImageSnapshot(
			path: string,
			target:
				| Cypress.Chainable<JQuery<HTMLElement>>
				| Cypress.Chainable<Cypress.AUTWindow>,
			customFailureThreshold?: number,
			blackout?: string[]
		): void;
	}
}
