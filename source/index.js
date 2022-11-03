const { WebSocketServer } = require("ws");

const Client = require("./client");

class Server {

	#authenticate = null;

	#clients = new Map();

	#heartbeatGracePeriod = null;

	#heartbeatInterval = null;

	#log = null;

	#socket = null;

	constructor(port, {
		authenticate,
		heartbeatGracePeriod,
		heartbeatInterval,
		log,
		socketOptions
	} = {}) {
		this.#authenticate = authenticate;
		this.#heartbeatGracePeriod = heartbeatGracePeriod ?? 15000;
		this.#heartbeatInterval = heartbeatInterval ?? 5000;
		this.#log = log;
		this.#socket = new WebSocketServer({
			...socketOptions,
			port
		}, this.#handleStart);
		this.#socket.addListener("connection", this.#handleConnection);
		this.#socket.addListener("error", this.#handleError);
	}

	get authenticate() {
		return this.#authenticate;
	}

	get clients() {
		return this.#clients;
	}

	close = () => {
		for (const client of this.#clients.values()) {
			client.close();
		}
		this.#socket.close();
		this.#log("info", "Closed");
	};

	#handleConnection = (socket, request) => {
		const client = new Client(socket, request, this);
		this.#clients.set(client.id, client);
	};

	#handleError = (error) => {
		this.#log("error", error);
	};

	#handleStart = () => {
		this.#log?.("info", `Listening on port ${this.#socket.address().port}`);
	};

	get heartbeatGracePeriod() {
		return this.#heartbeatGracePeriod;
	}

	get heartbeatInterval() {
		return this.#heartbeatInterval;
	}

	get log() {
		return this.#log;
	}

	get socket() {
		return this.#socket;
	}

}

module.exports = Server;
