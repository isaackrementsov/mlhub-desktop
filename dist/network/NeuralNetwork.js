"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const mathUtil_1 = require("./util/mathUtil");
const typeDef_1 = require("./util/typeDef");
class NeuralNetwork {
    start() {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.populate();
            yield this.learn();
        });
    }
    learn() {
        return __awaiter(this, void 0, void 0, function* () {
            let avgSlope = 0;
            let descentLen = 0;
            yield this.activate();
            let newWeights = this.weights;
            let newBiases = this.biases;
            for (let l = 1; l < this.weights.length; l++) {
                for (let j = 0; j < this.weights[l].length; j++) {
                    for (let k = 0; k < this.weights[l][j].length; k++) {
                        let w = this.weights[l][j][k];
                        let step = yield this.propagate(w);
                        if (!isNaN(step)) {
                            w.val -= step;
                            avgSlope += step;
                            descentLen++;
                        }
                        newWeights[l][j][k] = w;
                    }
                }
            }
            for (let l = 1; l < this.biases.length; l++) {
                for (let j = 0; j < this.biases[l].length; j++) {
                    let b = this.biases[l][j];
                    let step = yield this.propagateB(b);
                    if (!isNaN(step)) {
                        b.val -= step;
                        avgSlope += step;
                        descentLen++;
                    }
                    newBiases[l][j] = b;
                }
            }
            avgSlope /= descentLen;
            console.log(avgSlope);
            this.biases = newBiases;
            this.weights = newWeights;
        });
    }
    populate() {
        for (let l = this.layers.length - 1; l > 0; l--) {
            this.biases[l] = [];
            this.weights[l] = [];
            for (let j = 0; j < this.layers[l]; j++) {
                this.biases[l][j] = new typeDef_1.Bias(j, l, this.initializer.init());
                this.weights[l][j] = [];
                for (let k = 0; k < this.layers[l - 1]; k++) {
                    this.weights[l][j][k] = new typeDef_1.Weight(j, k, l, this.initializer.init());
                }
            }
        }
    }
    cost() {
        return mathUtil_1.sumFunc(this.outputs.length, this.outputs.length, t => mathUtil_1.sumFunc(this.outputs[t].length, this.outputs[t].length, j => {
            return Math.pow(this.activations[t][this.activations[t].length - 1][j].val - this.outputs[t][j], 2);
        }));
    }
    activate() {
        for (let t = 0; t < this.inputs.length; t++) {
            this.activateT(t);
        }
    }
    activateT(t) {
        this.activations[t] = [];
        this.sums[t] = [];
        for (let l = 0; l < this.layers.length; l++) {
            this.activations[t][l] = [];
            this.sums[t][l] = [];
            if (l == 0) {
                for (let j = 0; j < this.inputs[t].length; j++) {
                    let inp = new typeDef_1.Activation(j, l, this.inputs[t][j]);
                    this.activations[t][l][j] = inp;
                    this.sums[t][l][j] = inp;
                }
            }
            else {
                for (let j = 0; j < this.layers[l]; j++) {
                    let sum = mathUtil_1.sumFunc(this.activations[t][l - 1].length, 1, k => {
                        return this.weights[l][j][k].val * this.activations[t][l - 1][k].val;
                    });
                    sum += this.biases[l][j].val;
                    this.activations[t][l][j] = new typeDef_1.Activation(j, l, mathUtil_1.normalize(sum));
                    this.sums[t][l][j] = new typeDef_1.Activation(j, l, sum);
                }
            }
        }
    }
    propagate(w) {
        return mathUtil_1.sumFunc(this.outputs.length, this.outputs.length, t => mathUtil_1.sumFunc(this.outputs[t].length, this.outputs[t].length, j => {
            return 2 * (this.activations[t][this.activations[t].length - 1][j].val - this.outputs[t][j]) * this.pd(this.activations[t][this.activations[t].length - 1][j], w, t);
        }));
    }
    pd(a, w, t) {
        return mathUtil_1.normDeriv(this.sums[t][a.l][a.j].val) * this.pdSum(a, w, t);
    }
    pdSum(a, w, t) {
        if (a.l == w.l)
            return this.activations[t][a.l - 1][w.k].val;
        let s = mathUtil_1.sumFunc(this.activations[t][a.l - 1].length, 1, (k) => __awaiter(this, void 0, void 0, function* () { return this.weights[a.l][a.j][k].val * this.pd(this.activations[t][a.l - 1][k], w, t); }));
        return s;
    }
    propagateB(b) {
        return mathUtil_1.sumFunc(this.outputs.length, this.outputs.length, t => mathUtil_1.sumFunc(this.outputs[t].length, this.outputs[t].length, j => {
            return 2 * (this.activations[t][this.activations[t].length - 1][j].val - this.outputs[t][j]) * this.pdB(this.activations[t][this.activations[t].length - 1][j], b, t);
        }));
    }
    pdB(a, b, t) {
        return mathUtil_1.normDeriv(this.sums[t][a.l][a.j].val) * this.pdSumB(a, b, t);
    }
    pdSumB(a, b, t) {
        if (a.l == b.l)
            return 1;
        return mathUtil_1.sumFunc(this.activations[t][a.l - 1].length, 1, k => this.weights[a.l][a.j][k].val * this.pdB(this.activations[t][a.l - 1][k], b, t));
    }
    constructor() {
        this.layers = [3, 2, 3];
        this.activations = [];
        this.sums = [];
        this.biases = [];
        this.weights = [];
        this.inputs = [[1, 0.5, 0.2], [1, 1, 1], [0.2, 0.1, 0.3]];
        this.outputs = [[0, 0, 1], [0, 1, 0], [1, 0, 0]];
        this.initializer = new mathUtil_1.Initializer(this.outputs.length, this.inputs.length);
    }
}
exports.default = NeuralNetwork;
//# sourceMappingURL=NeuralNetwork.js.map