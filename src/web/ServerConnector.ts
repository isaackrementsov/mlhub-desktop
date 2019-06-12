import { request, ServerResponse } from 'http';
import * as WebSocket from 'ws';

import Storage from './Storage';

export default class ServerConnector {

    authKey : string;
    ws : WebSocket;

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
        this.ws = new WebSocket('ws://localhost' + this.getUrl(url));

        this.ws.on('open', () => {
            open(this.ws);
        });

        if(message) process.send({learningUpdate: message});
    }

    listenForWebSocketData(open : (WebSocket) => void, incoming? : (any) => void){
        this.ws = new WebSocket('ws://localhost/api/ws/open?authKey=' + this.authKey);

        this.ws.on('open', () => {
            open(this.ws);
        });

        if(incoming) this.ws.on('message', incoming);
    }

    getUrl(url : string, query? : string){
        return query ? `${url}?${query}&&authKey=${this.authKey}` : `${url}?authKey=${this.authKey}`;
    }

    constructor(){
        this.authKey = Storage.instance.get('authKey', true);
    }

}
