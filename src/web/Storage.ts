import * as fs from 'fs';
import * as crypto from 'crypto';

import app from '../app';

export default class Storage {

    private appDataPath : string;
    private password : Buffer;

    private static algorithm = 'aes-256-gcm';

    static instance : Storage;

    set(key : string, data : any, encrypted : boolean){
        let obj = fs.readFileSync(this.appDataPath).toJSON();

        if(encrypted){
            let cipher = crypto.createCipher(Storage.algorithm, this.password);
            data = cipher.update(data, 'utf8', 'hex');
            data += cipher.final('hex');
        }

        obj[key] = data;
        fs.writeFileSync(this.appDataPath, JSON.stringify(obj));
    }

    get(key : string, encrypted : boolean) : any {
        let val : string = fs.readFileSync(this.appDataPath).toJSON()[key];

        if(encrypted){
            let decipher = crypto.createDecipher(Storage.algorithm, this.password);
            let data : string = decipher.update(val, 'hex', 'utf8');

            return data + decipher.final('utf8');
        }else{
            return val;
        }
    }

    constructor(){
        this.appDataPath = app.getPath('appData') + 'storage.json';
        this.password = crypto.randomBytes(32);

        fs.appendFileSync(this.appDataPath, '{authKey: ""}');

        Storage.instance = this;
    }

}
