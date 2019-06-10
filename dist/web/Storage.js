"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const fs = require("fs");
const crypto = require("crypto");
const app_1 = require("../app");
class Storage {
    constructor() {
        this.appDataPath = app_1.default.getPath('appData') + 'storage.json';
        this.password = crypto.randomBytes(32);
        fs.appendFileSync(this.appDataPath, '{authKey: ""}');
        Storage.instance = this;
    }
    set(key, data, encrypted) {
        let obj = fs.readFileSync(this.appDataPath).toJSON();
        if (encrypted) {
            let cipher = crypto.createCipher(Storage.algorithm, this.password);
            data = cipher.update(data, 'utf8', 'hex');
            data += cipher.final('hex');
        }
        obj[key] = data;
        fs.writeFileSync(this.appDataPath, JSON.stringify(obj));
    }
    get(key, encrypted) {
        let val = fs.readFileSync(this.appDataPath).toJSON()[key];
        if (encrypted) {
            let decipher = crypto.createDecipher(Storage.algorithm, this.password);
            let data = decipher.update(val, 'hex', 'utf8');
            return data + decipher.final('utf8');
        }
        else {
            return val;
        }
    }
}
Storage.algorithm = 'aes-256-gcm';
exports.default = Storage;
//# sourceMappingURL=Storage.js.map