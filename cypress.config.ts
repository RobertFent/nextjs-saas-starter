import { defineConfig } from 'cypress';
import { config } from 'dotenv';
import { addMatchImageSnapshotPlugin } from 'cypress-image-snapshot/plugin';
// import { existsSync } from 'fs';
import mockAPIServer from './cypress/support/mockAPISever';

// load .env and in pipe .env for interal docker stuff
// if (existsSync('docker.env')) {
// 	config({ path: 'docker.env' });
// }

// load .env as second -> powerhouse-docker.env vars wont get overwritten
config({ path: '.env' });

export default defineConfig({
	e2e: {
		setupNodeEvents(on, config) {
			addMatchImageSnapshotPlugin(on, config);

			// mockttp stuff: https://github.com/cypress-io/cypress/discussions/28469
			on('before:run', () => {
				mockAPIServer.start();
			});
			on('after:run', () => {
				mockAPIServer.stop();
			});
			on('task', {
				mockAPIResponse({
					route,
					method,
					data,
					withQuery,
					shouldLogReceivedData,
					idleTimeInMs
				}) {
					mockAPIServer.mockResponse(
						route,
						method,
						data,
						withQuery,
						shouldLogReceivedData,
						idleTimeInMs
					);
					return null; // important to return null from Cypress node event tasks to signal they're complete
				},

				getReceivedData() {
					return mockAPIServer.getReceivedData();
				},

				resetAPIMocks() {
					mockAPIServer.reset();
					return null;
				},

				log(message) {
					console.log(message);
					return null;
				}
			});

			// https://github.com/cypress-io/cypress/issues/2102
			// https://github.com/cypress-io/cypress/issues/587
			on('before:browser:launch', (browser, launchOptions) => {
				if (browser.name !== 'chromium') {
					throw new Error(
						`Unsupported browser: ${browser.name}. Only chromium is allowed at the moment.`
					);
				}
				if (browser.isHeadless) {
					// remove any existing --window-size or scale factor arguments before adding custom one to prevent duplicates
					launchOptions.args = launchOptions.args.filter(
						(arg) => {
							return (
								!arg.startsWith('--window-size') &&
								!arg.startsWith(
									'--force-device-scale-factor'
								) &&
								!arg.startsWith('--disable-web-resources')
							);
						} // also remove this for loading fonts in pipe to prevent snapshot problems
					);
				}

				console.log('Browser launch options:', launchOptions.args);
				return launchOptions;
			});
		},
		// this needs to be enabled for the mock server to work
		experimentalInteractiveRunEvents: true,
		specPattern: ['cypress/e2e/tests/**/*.cy.{ts,tsx}'],
		// this is the dimension when running cypress headed
		viewportWidth: 1920,
		viewportHeight: 1080,
		defaultCommandTimeout: 10000,
		reporter: 'cypress-image-snapshot/reporter'
	},
	supportFolder: 'cypress/support',
	fixturesFolder: 'cypress/fixtures'
});
