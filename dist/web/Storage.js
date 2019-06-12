"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const fs = require("fs");
const Cryptr = require("cryptr");
class Storage {
    constructor(path) {
        this.appDataPath = path + '/' + Storage.filename;
        this.cryptr = new Cryptr('kdi2jd5f@s');
        if (!fs.existsSync(this.appDataPath)) {
            fs.writeFileSync(this.appDataPath, '{"authKey": "", "computer": "", "session": 0}');
        }
        Storage.instance = this;
    }
    set(key, data, encrypted) {
        let obj = JSON.parse(fs.readFileSync(this.appDataPath).toString());
        if (encrypted) {
            data = this.cryptr.encrypt(data);
        }
        obj[key] = data;
        fs.writeFileSync(this.appDataPath, JSON.stringify(obj));
    }
    get(key, encrypted) {
        let val = JSON.parse(fs.readFileSync(this.appDataPath).toString())[key];
        if (encrypted && val.length > 0) {
            console.log(this.cryptr.decrypt(val));
            return this.cryptr.decrypt(val);
        }
        else {
            return val;
        }
    }
}
Storage.filename = 'mlhubStorage.json';
exports.default = Storage;
//# sourceMappingURL=Storage.js.map