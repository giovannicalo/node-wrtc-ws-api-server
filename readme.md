# Node WebRTC WebSocket Signaling API Server

[![Build Status](https://github.com/giovannicalo/node-wrtc-ws-api-server/actions/workflows/build.yml/badge.svg)](https://github.com/giovannicalo/node-wrtc-ws-api-server/actions/workflows/build.yml)
[![Coverage Status](https://coveralls.io/repos/github/giovannicalo/node-wrtc-ws-api-server/badge.svg?branch=master)](https://coveralls.io/github/giovannicalo/node-wrtc-ws-api-server?branch=master)

## Installation

```bash
npm install giovannicalo/node-wrtc-ws-api-server
```

> Not yet published to NPM. This will install it from GitHub.

## Usage

```javascript
const Server = require("wrtc-ws-api-server");

new Server(8080);
```

## API

### `new Server(port: number, options?: Options)`

Starts a WebSocket server listening on `port`.

Options are:

* `authenticate?(data: JsonSerializable): boolean | Promise<boolean>`: a function to authenticate clients, which must return `true` if valid and `false` if not, defaults to `undefined`.
* `heartbeatGracePeriod?: number`: how long to keep unresponsive clients alive, in milliseconds, should be greater than `heartbeatInterval`, defaults to `15000`.
* `heartbeatInterval?: number`: how often to send `ping` events to clients, in milliseconds, should be less than `heartbeatGracePeriod`, defaults to `5000`.
* `log?(level: "error" | "info" | "warning", message: string): void`: a logging function that will be called when certain events occur, defaults to `undefined`.
* `socketOptions?: WebSocket.ServerOptions`: custom [options](https://github.com/websockets/ws/blob/master/doc/ws.md#class-websocketserver) to pass to the `WebSocketServer` constructor, except `port`.

#### `authenticate?: (data: JsonSerializable) => boolean | Promise<boolean>`

The `authenticate` function passed to the `Server` constructor.

#### `clients: Map<string, Client>`

A `Map` of `Client` objects, one for each client connected to the server.

#### `close(): void`

Shuts down the server.

#### `heartbeatGracePeriod: number`

The value of `heartbeatGracePeriod`, passed to the `Server` constructor.

#### `heartbeatInterval: number`

The value of `heartbeatInterval`, passed to the `Server` constructor.

#### `log?: (level: "error" | "info" | "warning", message: string) => void`

The `log` function passed to the `Server` constructor.

#### `socket: WebSocketServer`

The [`WebSocketServer`](https://github.com/websockets/ws/blob/master/doc/ws.md#class-websocketserver) instance used by the `Server`.

### `Client`

Each of the clients connected to the `Server`.

Clients cannot be created manually, but they can be accessed via `Server.clients`.

#### `address: string`

The `Client`'s IP address.

#### `addClient(client: Client): void`

Assigns a `client` `Client` to the current `Client`. Only makes sense for `worker` `Client`s. It should not be used manually.

#### `chooseWorker(): void`

Forces the `Client` to choose a `worker` `Client`. Only makes sense for `client` `Client`s. It should not be used manually.

#### `clients: Map<string, Client>`

A `Map` of `client` `Client`s assigned to the current `Client`. Only makes sense for `worker` `Client`s.

#### `close(): void`

Closes the `Client`'s connection.

#### `firstSeen: number`

The time at which the `Client` connected.

#### `id: string`

The `Client`'s ID.

#### `lastSeen: number`

The time at which the `Client` last sent a message (`pong` or otherwise).

#### `latency: number`

The `Client`'s latency, in milliseconds, sampled every `heartbeatInterval` milliseconds using `ping` events.

#### `removeClient(client: Client): void`

Removes a `client` `Client` from the current `Client`. Only makes sense for `worker` `Client`s. It should not be used manually.

#### `removeWorker(): void`

Removes the `worker` `Client` assigned to the current `Client`. Only makes sense for `client` `Client`s. It should not be used manually.

#### `role: "client" | "worker"`

The `Client`'s role.

#### `send(message: JsonSerializable): void`

Sends a `message` to the client.

#### `worker: Client | null`

The `worker` `Client` used by the current `Client`. Only makes sense for `client` `Client`s.
