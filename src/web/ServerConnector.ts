import { request, ServerResponse } from 'http';
import * as WebSocket from 'ws';

import Storage from './Storage';

export default class ServerConnector {

    private authKey : string;

    sendHTTPRequest(verb : string, url : string, cb : (any) => void, query? : string){
        let req = request({
            hostname: 'localhost',
            method: verb,
            path: this.getUrl(url, query)
        }, res => {
            let body : string = '';

            res.on('data', res => {
                body += res.toString();
            });

            res.on('end', () => {
                cb(JSON.parse(body));
            });
        });
        req.end();
    }

    sendWebSocketsRequest(url : string, open : (WebSocket) => void, message? : string, query? : string){
        let ws : WebSocket = new WebSocket('ws://localhost:8080' + this.getUrl(url, query));

        ws.on('open', () => {
            open(ws);
        });

        if(message) process.send({learningUpdate: message});
    }

    listenForWebSocketData(open : (WebSocket) => void, incoming? : (any) => void){
        let ws = new WebSocket('ws://localhost:8080/api/ws/open?authKey' + this.authKey);

        ws.on('open', () => {
            open(ws);
        });

        if(incoming) ws.on('message', incoming);
    }

    getUrl(url : string, query? : string){
        return query ? `${url}?${query}&&authKey=${this.authKey}` : `${url}?authKey=${this.authKey}`;
    }

    constructor(){
        this.authKey = Storage.instance.get('authKey', true);
    }

}
