import {
	CompletedBody,
	CompletedRequest,
	getLocal,
	MaybePromise,
	type Mockttp
} from 'mockttp';
import { CallbackResponseResult } from 'mockttp/dist/rules/requests/request-step-definitions';

/**
 * Class for a Mock API Server that allows setting up and managing mock responses for different routes and methods.
 * The server can be reset, started, stopped, and mock responses can be registered.
 * Only 'GET' and 'POST' methods are currently supported. With the later one throwing an error due to missing implementation
 * The server runs on a specific port and provides logs for server status and requests received.
 *
 * @class MockAPIServer
 */
class MockAPIServer {
	private readonly server: Mockttp;
	private readonly port: number;
	private receivedData: CompletedBody[] = [];

	constructor() {
		this.server = getLocal();
		this.port = 9000; // < Make sure this matches the port in your custom API_URL env url
	}

	/**
	 * Resets the server instance.
	 * Re-registers default handlers.
	 */
	reset(): void {
		this.server.reset();
		this.server.forGet('/').thenReply(200, 'Mock API server is up');
	}

	/**
	 * Starts the server and sets up default route.
	 */
	start(): void {
		this.server.start(this.port);
		this.server
			.forGet('/')
			.thenReply(200, 'Mock API server is up')
			.then(() => {
				console.info(
					`\n📡 Mock API server running on http://localhost:${this.port}\n`
				);
			});
	}

	/**
	 * Stops the server.
	 */
	stop(): void {
		this.server.stop().then(() => {
			console.info(`📡 Mock API server stopped`);
		});
	}

	/**
	 * Registers a mock response for a specified route and method with optional query parameters and logging of received data.
	 */
	mockResponse(
		route: string,
		method: 'GET' | 'POST',
		data: unknown,
		withQuery?: Record<string, string>,
		shouldLogReceivedData?: boolean,
		idleTimeInMs = 100
	): void {
		console.log(
			`Registering mock for route: ${route}; Method: ${method}${withQuery ? '; query: ' + withQuery : ''}`
		);

		if (method === 'GET') {
			if (withQuery) {
				this.server
					.forGet(route)
					.withQuery(withQuery)
					.thenCallback((req) => {
						return this.delayedResponse(
							req,
							data,
							idleTimeInMs,
							shouldLogReceivedData
						);
					});
			} else {
				this.server.forGet(route).thenCallback((req) => {
					return this.delayedResponse(
						req,
						data,
						idleTimeInMs,
						shouldLogReceivedData
					);
				});
			}
		} else if (method === 'POST') {
			this.server.forPost(route).thenCallback((req) => {
				return this.delayedResponse(
					req,
					data,
					idleTimeInMs,
					shouldLogReceivedData
				);
			});
		} else if (method === 'DELETE') {
			this.server.forDelete(route).thenCallback((req) => {
				return this.delayedResponse(
					req,
					data,
					idleTimeInMs,
					shouldLogReceivedData
				);
			});
		} else {
			throw Error('Only GET, POST and DELETE supported');
		}
	}

	/**
	 * Return an array of CompletedBody from the received data
	 */
	getReceivedData(): CompletedBody[] {
		return this.receivedData;
	}

	/**
	 * Handles an incoming request and responds after a simulated delay.
	 * Optionally logs the received request body.
	 * Returns a 200 response with the provided data.
	 */
	private delayedResponse = (
		req: CompletedRequest,
		data: unknown,
		idleTimeInMs: number,
		shouldLogReceivedData?: boolean
	): MaybePromise<CallbackResponseResult> => {
		return new Promise((resolve) => {
			console.log('Request received: ', req.path);
			if (shouldLogReceivedData) {
				this.receivedData.push(req.body);
			}
			setTimeout(() => {
				resolve({ statusCode: 200, json: data });
			}, idleTimeInMs);
		});
	};
}

const mockAPIServer = new MockAPIServer();
export default mockAPIServer;
