"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.normalize = (x) => {
    return 2 / (1 + Math.exp(-2 * x)) - 1;
};
exports.normDeriv = (x) => {
    return 1 - Math.pow(exports.normalize(x), 2);
};
exports.sumFunc = (max, divisor, cb) => {
    let sum = 0;
    for (let i = 0; i < max; i++) {
        sum += cb(i);
    }
    return sum / divisor;
};
class Initializer {
    bmtRandom() {
        let u = 0, v = 0;
        while (u === 0)
            u = Math.random();
        while (v === 0)
            v = Math.random();
        return Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
    }
    init() {
        return this.bmtRandom() * Math.sqrt(1 / (this.outputs + this.inputs));
    }
    constructor(outputs, inputs) {
        this.outputs = outputs;
        this.inputs = inputs;
    }
}
exports.Initializer = Initializer;
//# sourceMappingURL=mathUtil.js.map