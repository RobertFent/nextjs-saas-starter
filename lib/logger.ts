import pino, { Logger } from 'pino';

const isLocal = process.env.NODE_ENV !== 'production' && !process.env.VERCEL;

/**
 * Defines a logger property that uses the pino library for logging with specific transport and level configurations based on the NODE_ENV environment variable.
 * Usage: const log = logger.child({ side: 'server', 'server-action': 'users' });
 * log.debug('foo')
 */
export const logger: Logger = pino(
	isLocal
		? {
				transport: {
					target: 'pino-pretty',
					options: { colorize: true }
				},
				level: 'debug'
			}
		: undefined
);
