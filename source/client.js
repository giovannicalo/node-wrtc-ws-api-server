const { v4: uuid } = require("uuid");

const roles = require("./roles");

class Client {

	#address = null;

	#clients = new Map();

	#firstSeen = Date.now();

	#id = uuid();

	#interval = null;

	#isAlive = true;

	#lastPinged = Date.now();

	#lastSeen = Date.now();

	#latency = 0;

	#role = null;

	#server = null;

	#socket = null;

	#worker = null;

	constructor(socket, { headers, socket: { remoteAddress } }, server) {
		this.#address = headers["x-forwarded-for"] || remoteAddress;
		this.#server = server;
		this.#socket = socket;
		this.#socket.addListener("close", this.close);
		this.#socket.addListener("error", this.#handleError);
		this.#socket.addListener("message", this.#handleMessage);
		this.#socket.addListener("pong", this.#handlePong);
		this.#interval = setInterval(this.#ping, this.#server.heartbeatInterval);
		this.#log("info", `Connected from ${this.#address}`);
		this.#ping();
	}

	get address() {
		return this.#address;
	}

	addClient = (client) => {
		this.#clients.set(client.id, client);
		this.send({
			data: { id: client.id },
			event: "connection"
		});
	};

	#adoptOrphans = () => {
		for (const client of this.#server.clients.values()) {
			if (client.role === "client") {
				client.chooseWorker();
			}
		}
	};

	#authenticate = async (data) => {
		const { role } = data;
		if (!roles.has(role) || this.#server.authenticate && !await this.#server.authenticate(data)) {
			this.#log("warning", `Failed to authenticate as ${role}`);
			this.close();
			return;
		}
		this.#role = role;
		this.send({
			data: { id: this.#id },
			event: "handshake"
		});
		this.#log("info", `Authenticated as ${role}`);
		if (role === "client") {
			this.chooseWorker();
		} else if (role === "worker") {
			this.#adoptOrphans();
		}
	};

	chooseWorker = () => {
		if (this.#worker) {
			return;
		}
		let bestWorker = null;
		for (const client of this.#server.clients.values()) {
			if (client.role === "worker" && (!bestWorker || client.clients.size < bestWorker.clients.size)) {
				bestWorker = client;
			}
		}
		if (bestWorker) {
			this.#worker = bestWorker;
			this.#worker.addClient(this);
			this.#log("info", `Chosen worker ${this.#worker.id}`);
		} else {
			this.#log("warning", "Failed to choose a worker as none is available");
		}
	};

	get clients() {
		return this.#clients;
	}

	close = () => {
		if (!this.#isAlive) {
			return;
		}
		this.#isAlive = false;
		clearInterval(this.#interval);
		this.#socket.close();
		this.#server.clients.delete(this.#id);
		if (this.#role === "client") {
			this.#worker?.removeClient(this);
		} else if (this.#role === "worker") {
			for (const client of this.#clients.values()) {
				client.removeWorker();
				client.chooseWorker();
			}
		}
		this.#log("info", "Disconnected");
	};

	get firstSeen() {
		return this.#firstSeen;
	}

	#forward = ({ data, event, id }) => {
		if (this.#role === "client") {
			if (this.#worker) {
				this.#worker.send({ data, event, id: this.#id });
				this.#log("info", `Forwarded ${event} to worker ${this.#worker.id}`);
			} else {
				this.#log("warning", `Failed to forward ${event} as no worker is available`);
			}
		} else if (this.#role === "worker") {
			if (id && this.#clients.has(id)) {
				this.#clients.get(id).send({ data, event });
				this.#log("info", `Forwarded ${event} to client ${id}`);
			} else {
				this.#log("warning", `Failed to forward ${event} to invalid client ${id}`);
			}
		}
	};

	#handleError = (error) => {
		this.#log("error", error);
	};

	#handleMessage = (message) => {
		try {
			this.#updateLastSeen();
			const parsedMessage = JSON.parse(message);
			const { data, event } = parsedMessage;
			if (event === "handshake") {
				this.#authenticate(data);
			} else {
				this.#forward(parsedMessage);
			}
		} catch (error) {
			this.#log("error", `Failed to handle message ${message}: ${error}`);
		}
	};

	#handlePong = () => {
		this.#updateLastSeen();
		this.#latency = Date.now() - this.#lastPinged;
	};

	get id() {
		return this.#id;
	}

	get lastSeen() {
		return this.#lastSeen;
	}

	get latency() {
		return this.#latency;
	}

	#log = (level, message) => {
		this.#server.log?.(level, `[${this.#id}] ${message}`);
	};

	#ping = () => {
		if (this.#lastSeen < Date.now() - this.#server.heartbeatGracePeriod) {
			this.close();
		} else {
			this.#lastPinged = Date.now();
			this.#socket.ping();
		}
	};

	removeClient = (client) => {
		this.#clients.delete(client.id);
		this.send({
			data: { id: client.id },
			event: "disconnection"
		});
	};

	removeWorker = () => {
		this.#worker = null;
	};

	get role() {
		return this.#role;
	}

	send = (message) => {
		this.#socket.send(JSON.stringify(message));
	};

	#updateLastSeen = () => {
		this.#lastSeen = Date.now();
	};

	get worker() {
		return this.#worker;
	}

}

module.exports = Client;
