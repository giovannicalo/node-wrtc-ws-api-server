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
		constructor(socket: WebSocket, request: Request, server: Server);
		get address(): string;
		addClient(client: Client): void;
		chooseWorker(): void;
		get clients(): Map<string, Client>;
		close(): void;
		get firstSeen(): number;
		get id(): string;
		get lastSeen(): number;
		get latency(): number;
		removeClient(client: Client): void;
		removeWorker(): void;
		get role(): "client" | "worker";
		send(data: JsonSerializable): void;
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
	constructor(port: number, Options?: Server.Options);
	get authenticate(): Server.Options["authenticate"];
	get clients(): Map<string, Server.Client>;
	close(): void;
	get heartbeatGracePeriod(): number;
	get heartbeatInterval(): number;
	get log(): Server.Options["log"];
	get socket(): WebSocket.Server;
}

export = Server;
