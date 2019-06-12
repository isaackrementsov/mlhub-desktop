"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const http_1 = require("http");
const WebSocket = require("ws");
const Storage_1 = require("./Storage");
class ServerConnector {
    sendHTTPRequest(verb, url, cb, query) {
        let req = http_1.request({
            hostname: 'localhost',
            method: verb,
            path: this.getUrl(url, query)
        }, res => {
            let body = '';
            res.on('data', res => {
                body += res.toString();
            });
            res.on('end', () => {
                cb(JSON.parse(body));
            });
        });
        req.end();
    }
    sendWebSocketsRequest(url, open, message, query) {
        let ws = new WebSocket('ws://localhost:8080' + this.getUrl(url, query));
        ws.on('open', () => {
            open(ws);
        });
        if (message)
            process.send({ learningUpdate: message });
    }
    listenForWebSocketData(open, incoming) {
        let ws = new WebSocket('ws://localhost:8080/api/ws/open?authKey' + this.authKey);
        ws.on('open', () => {
            open(ws);
        });
        if (incoming)
            ws.on('message', incoming);
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