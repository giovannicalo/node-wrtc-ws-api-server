/* eslint-disable max-classes-per-file */

const MockEventEmitter = require("events");

const { WebSocketServer } = require("ws");

const Server = require(".");
const Client = require("./client");

jest.mock("ws", () => {
	return {
		WebSocketServer: class extends MockEventEmitter {

			#port = null;

			constructor({ port }, handler) {
				super();
				this.constructorSpy({ port }, handler);
				this.#port = port;
				setImmediate(handler);
			}

			constructorSpy = jest.fn();

			close = jest.fn();

			address() {
				return { port: this.#port };
			}

		}
	};
});

jest.mock("./client", () => {
	return class Client {

		close = jest.fn();

	};
});

beforeEach(() => {
	jest.clearAllMocks();
});

it("should start a WebSocket server on the given port", () => {
	const port = 8080;
	const server = new Server(port);
	expect(server.socket.constructorSpy).toHaveBeenCalledTimes(1);
	expect(server.socket.constructorSpy).toHaveBeenCalledWith({ port }, expect.any(Function));
});

it("should return the given authenticate function", () => {
	const authenticate = jest.fn();
	const server = new Server(8080, { authenticate });
	expect(server.authenticate).toBe(authenticate);
});

it("should return the given heartbeat grace period", () => {
	const heartbeatGracePeriod = 10000;
	const server = new Server(8080, { heartbeatGracePeriod });
	expect(server.heartbeatGracePeriod).toBe(heartbeatGracePeriod);
});

it("should return the given heartbeat interval", () => {
	const heartbeatInterval = 10000;
	const server = new Server(8080, { heartbeatInterval });
	expect(server.heartbeatInterval).toBe(heartbeatInterval);
});

it("should return the given log function", () => {
	const log = jest.fn();
	const server = new Server(8080, { log });
	expect(server.log).toBe(log);
});

it("should return the WebSocket server instance", () => {
	const server = new Server(8080);
	expect(server.socket).toBeInstanceOf(WebSocketServer);
});

it("should create a client upon connection", () => {
	const server = new Server(8080);
	server.socket.emit("connection");
	expect(server.clients.values().next().value).toBeInstanceOf(Client);
});

it("should close all clients when closed", () => {
	const server = new Server(8080);
	server.socket.emit("connection");
	server.close();
	expect(server.clients.values().next().value.close).toHaveBeenCalledTimes(1);
});

it("should log a message on start when given a log function", () => {
	const log = jest.fn();
	jest.useFakeTimers();
	new Server(8080, { log }); // eslint-disable-line no-new
	jest.runAllTimers();
	expect(log).toHaveBeenCalledTimes(1);
	expect(log).toHaveBeenCalledWith("info", "Listening on port 8080");
	jest.useRealTimers();
});

it("should log a message on error when given a log function", () => {
	const log = jest.fn();
	jest.useFakeTimers();
	const server = new Server(8080, { log });
	jest.runAllTimers();
	server.socket.emit("error", "Foo");
	expect(log).toHaveBeenCalledTimes(2);
	expect(log).toHaveBeenCalledWith("error", "Foo");
	jest.useRealTimers();
});
