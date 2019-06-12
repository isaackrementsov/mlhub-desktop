import * as fs from 'fs';
import Cryptr = require('cryptr');

export default class Storage {

    private cryptr : Cryptr;

    appDataPath : string;

    static instance : Storage;
    static filename : string = 'mlhubStorage.json';

    set(key : string, data : any, encrypted : boolean){
        let obj = JSON.parse(fs.readFileSync(this.appDataPath).toString());

        if(encrypted){
            data = this.cryptr.encrypt(data);
        }

        obj[key] = data;
        fs.writeFileSync(this.appDataPath, JSON.stringify(obj));
    }

    get(key : string, encrypted : boolean) : any {
        let val : string = JSON.parse(fs.readFileSync(this.appDataPath).toString())[key];
        if(encrypted && val.length > 0){
            return this.cryptr.decrypt(val);
        }else{
            return val;
        }
    }

    constructor(path : string){
        this.appDataPath = path + '/' + Storage.filename;
        this.cryptr = new Cryptr('kdi2jd5f@s');

        if(!fs.existsSync(this.appDataPath)){
            fs.writeFileSync(this.appDataPath, '{"authKey": "", "computer": "", "session": 0}');
        }

        Storage.instance = this;
    }

}
