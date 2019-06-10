import { request, ServerResponse } from 'http';
import { ipcMain } from 'electron';
import WebSocket from 'ws';

import Storage from './Storage';

export default class ServerConnector {

    private authKey : string;
    private wss : WebSocket.Server;

    sendHTTPRequest(verb : string, url : string, cb : (ServerResponse) => void, query? : string){
        let req = request({
            hostname: 'http://localhost:8080',
            method: verb,
            path: this.getUrl(url, query)
        }, res => {
            res.on('data', cb);
        });
    }

    sendWebSocketsRequest(url : string, open : (WebSocket) => void, message? : string, incoming? : (any) => void, query? : string){
        let ws : WebSocket = new WebSocket(this.getUrl(url, query));

        ws.on('open', () => {
            open(ws);
        });

        if(incoming) ws.on('message', incoming);

        if(message) ipcMain.emit('learning-update', message);
    }

    getUrl(url : string, query? : string){
        return query ? `${url}?${query}&&authKey=${this.authKey}` : `${url}?authKey=${this.authKey}`
    }

    constructor(){
        this.authKey = Storage.instance.get('authKey', true);
        this.wss = WebSocket.Server({port: 9090, perMessageDeflate: {
            zlibDeflateOptions: {
              chunkSize: 1024,
              memLevel: 7,
              level: 3
            },
            zlibInflateOptions: {
              chunkSize: 10 * 1024
            },
        }});
    }

}
