"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class Activation {
    constructor(j, l, val) {
        this.j = j;
        this.l = l;
        this.val = val;
    }
}
exports.Activation = Activation;
class Bias extends Activation {
    constructor(j, l, val) {
        super(j, l, val);
    }
}
exports.Bias = Bias;
class Weight extends Bias {
    /*Index that weight connects from
    l-1 | l
    k -> j
    */
    constructor(j, k, l, val) {
        super(j, l, val);
        this.k = k;
    }
}
exports.Weight = Weight;
//# sourceMappingURL=typeDef.js.map