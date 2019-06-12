"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const NeuralNetwork_1 = require("./NeuralNetwork");
const Storage_1 = require("../web/Storage");
process.on('message', (data) => {
    Storage_1.default.instance = new Storage_1.default(data.path);
    NeuralNetwork_1.default.init(Storage_1.default.instance.get('session', false));
});
//# sourceMappingURL=index.js.map