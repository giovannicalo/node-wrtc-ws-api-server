import type WebSocket from "ws";

declare namespace Server {

	type Request = {
		headers: Record<string, string>;
		socket: Socket;
	};

	type Socket = {
		remoteAddress: string;
	};

	export class Client {

		/**
		 * Creates a new WebRTC WebSocket signaling API client.
		 *
		 * @param {WebSocket} socket - The WebSocket instance to use.
		 * @param {Object} request - The HTTP request that initiated the connection.
		 * @param {Server} server - The parent server instance.
		 */
		constructor(socket: WebSocket, request: Request, server: Server);

		/**
		 * The client's IP address.
		 */
		get address(): string;

		/**
		 * Adds a client to the worker.
		 *
		 * @param {Client} client - The client to add.
		 * @returns {void}
		 */
		addClient(client: Client): void;

		/**
		 * Chooses a worker for the client.
		 *
		 * @returns {void}
		 */
		chooseWorker(): void;

		/**
		 * The clients assigned to the worker.
		 */
		get clients(): Map<string, Client>;

		/**
		 * Closes the client's connection.
		 *
		 * @returns {void}
		 */
		close(): void;

		/**
		 * The time at which the client connected.
		 */
		get firstSeen(): number;

		/**
		 * The client's ID.
		 */
		get id(): string;

		/**
		 * The time at which the client last sent a message (pong or otherwise).
		 */
		get lastSeen(): number;

		/**
		 * The client's latency, in milliseconds, sampled every heartbeatInterval milliseconds using ping events.
		 */
		get latency(): number;

		/**
		 * Removes a client from the worker.
		 *
		 * @param {Client} client - The client to remove.
		 * @returns {void}
		 */
		removeClient(client: Client): void;

		/**
		 * Removes the worker currently assigned to the client.
		 *
		 * @returns {void}
		 */
		removeWorker(): void;

		/**
		 * The client's role.
		 */
		get role(): "client" | "worker";

		/**
		 * Sends a message to the client.
		 *
		 * @param {JsonSerializable} message - The message to send.
		 * @returns {void}
		 */
		send(message: JsonSerializable): void;

		/**
		 * The worker assigned to the client.
		 */
		get worker(): Client | null;

	}

	export type JsonSerializable = JsonSerializable[] | {
		[key: string]: JsonSerializable
	} | boolean | null | number | string | undefined;

	export type Options = {
		authenticate?(data: JsonSerializable): boolean | Promise<boolean>;
		heartbeatGracePeriod?: number;
		heartbeatInterval?: number;
		log?(level: "error" | "info" | "warning", message: string): void;
		socketOptions?: WebSocket.ServerOptions;
	};

}

declare class Server {

	/**
	 * Creates a new WebRTC WebSocket signaling API server.
	 *
	 * @param {Number} port - The port to listen on.
	 * @param {Server.Options} [options] - The options object.
	 * @param {Function} [options.authenticate] - A function to authenticate clients, which must return true if valid and false if not.
	 * @param {Number} [options.heartbeatGracePeriod=15000] - How long to keep unresponsive clients alive, in milliseconds, should be greater than heartbeatInterval, defaults to 15000.
	 * @param {Number} [options.heartbeatInterval=5000] - How often to send `ping` events to clients, in milliseconds, should be less than heartbeatGracePeriod, defaults to 5000.
	 * @param {Function} [options.log] - A function that logs messages.
	 * @param {WebSocket.ServerOptions} [options.socketOptions] - Custom options to pass to the WebSocketServer constructor.
	 */
	constructor(port: number, Options?: Server.Options);

	/**
	 * The authenticate function passed to the constructor.
	 */
	get authenticate(): Server.Options["authenticate"];

	/**
	 * The clients connected to the server.
	 */
	get clients(): Map<string, Server.Client>;

	/**
	 * Shuts down the server.
	 *
	 * @returns {void}
	 */
	close(): void;

	/**
	 * The heartbeatGracePeriod option passed to the constructor.
	 */
	get heartbeatGracePeriod(): number;

	/**
	 * The heartbeatInterval option passed to the constructor.
	 */
	get heartbeatInterval(): number;

	/**
	 * The log function passed to the constructor.
	 */
	get log(): Server.Options["log"];

	/**
	 * The WebSocketServer instance used by the server.
	 */
	get socket(): WebSocket.Server;

}

export = Server;
