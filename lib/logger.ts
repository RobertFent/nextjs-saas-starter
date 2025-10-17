import pino, { Logger } from 'pino';

/**
 * Defines a logger property that uses the pino library for logging with specific transport and level configurations based on the NODE_ENV environment variable.
 *
 * Usage: const log = logger.child({ side: 'server', 'server-action': 'users' });
 * log.debug('foo)
 *
 * @date Jul 10th 2025
 * @author Robot
 *
 * @type {Logger}
 */
export const logger: Logger = pino({
	transport: {
		target: 'pino-pretty',
		options: {
			colorize: true
		}
	},
	level: process.env['NODE_ENV'] === 'production' ? 'info' : 'debug'
});
