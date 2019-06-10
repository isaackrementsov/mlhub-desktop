"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const http_1 = require("http");
const ws_1 = require("ws");
const Storage_1 = require("./Storage");
class ServerConnector {
    sendHTTPRequest(verb, url, cb, cbE, query) {
        let req = http_1.request({
            hostname: 'http://localhost:8080',
            method: verb,
            path: this.getUrl(url, query)
        }, res => {
            res.on('data', cb);
        });
        req.on('error', cbE);
    }
    sendWebSocketsRequest(url, open, query) {
        this.webSocket = new ws_1.default(this.getUrl(url, query));
        this.webSocket.on('open', open);
    }
    listenForWebSocketsResponse(data) {
        this.webSocket.on('message', data);
    }
    getUrl(url, query) {
        return query ? `${url}?${query}&&authKey=${this.authKey}` : `${url}?authKey=${this.authKey}`;
    }
    constructor() {
        this.authKey = Storage_1.default.instance.get('authKey', true);
    }
}
exports.default = ServerConnector;
//# sourceMappingURL=ServerConnector.js.map