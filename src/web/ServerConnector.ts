import { request, ServerResponse } from 'http';

import Storage from './Storage';

export default class ServerConnector {

    private authKey : string;

    sendHTTPRequest(verb : string, url : string, data : string, cb : (ServerResponse) => void, cbE : (Error) => void){
        let req = request({
            hostname: 'http://localhost:8080',
            method: verb,
            path: `${url}?${data}&&authKey=${this.authKey}`
        }, res => {
            res.on('data', cb);
        });

        req.on('error', cbE);
    }

    sendWebSocketsRequest(url : string, data : string){
        
    }

    listenForWebSocketsResponse(){

    }

    constructor(){
        this.authKey = Storage.instance.get('authKey');
    }

}
