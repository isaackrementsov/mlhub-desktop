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
const ServerConnector_1 = require("../web/ServerConnector");
class NeuralNetwork {
    start() {
        return __awaiter(this, void 0, void 0, function* () {
            while (true) {
                yield this.populate();
                let steps = 0;
                this.slopes = [];
                while (true) {
                    steps++;
                    this.learningRate = this.savedLearningRate;
                    yield this.learn();
                    if (this.maxSlope < this.thresHold || steps > this.maxSteps) {
                        let cost = this.cost();
                        if (cost < this.minimum || this.minimum == -1) {
                            this.minimum = cost;
                            this.minWeights = this.weights;
                            this.minBiases = this.biases;
                            process.send({
                                ws: true,
                                cost: cost,
                                weights: this.minWeights,
                                biases: this.minBiases,
                                session: this.session,
                                authKey: this.connection.authKey
                            });
                            process.send({ learningUpdate: `Minimum at ${cost}` });
                        }
                        break;
                    }
                    else if (this.approachingMinimum()) {
                        this.learningRate /= this.decayRate;
                    }
                }
            }
        });
    }
    test() {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.activateT(0);
        });
    }
    approachingMinimum() {
        return Math.abs(this.slopes[this.slopes.length - 7] - this.slopes[this.slopes.length - 1]) < this.thresHold;
    }
    learn() {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.activate();
            this.maxSlope = 0;
            let newWeights = this.weights;
            let newBiases = this.biases;
            for (let l = 1; l < this.weights.length; l++) {
                for (let j = 0; j < this.weights[l].length; j++) {
                    for (let k = 0; k < this.weights[l][j].length; k++) {
                        let w = this.weights[l][j][k];
                        let step = yield this.propagate(w);
                        if (!isNaN(step)) {
                            w.val -= this.learningRate * step;
                            if (step > this.maxSlope) {
                                this.maxSlope = step;
                            }
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
                        b.val -= this.learningRate * step;
                        if (step > this.maxSlope) {
                            this.maxSlope = step;
                        }
                    }
                    newBiases[l][j] = b;
                }
            }
            this.slopes.push(this.maxSlope);
            if (this.slopes.length > 7) {
                this.slopes.splice(0, 1);
            }
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
                    let inp = new typeDef_1.Activation(j, l, mathUtil_1.normalize(this.inputs[t][j]));
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
    static init(session) {
        NeuralNetwork.instance = new NeuralNetwork(); //Only way to access "this" in callbacks
        NeuralNetwork.instance.activations = [];
        NeuralNetwork.instance.sums = [];
        NeuralNetwork.instance.biases = [];
        NeuralNetwork.instance.weights = [];
        NeuralNetwork.instance.maxSlope = 0;
        NeuralNetwork.instance.session = session;
        NeuralNetwork.instance.connection = new ServerConnector_1.default();
        NeuralNetwork.instance.connection.sendHTTPRequest('GET', '/api/ml/inputs', inputs => {
            NeuralNetwork.instance.inputs = inputs;
            NeuralNetwork.instance.connection.sendHTTPRequest('GET', '/api/ml/outputs', outputs => {
                NeuralNetwork.instance.outputs = outputs;
                NeuralNetwork.instance.connection.sendHTTPRequest('GET', '/api/ml/misc', misc => {
                    NeuralNetwork.instance.learningRate = misc.learningRate;
                    NeuralNetwork.instance.savedLearningRate = NeuralNetwork.instance.learningRate;
                    NeuralNetwork.instance.thresHold = misc.thresHold;
                    NeuralNetwork.instance.decayRate = misc.decayRate;
                    NeuralNetwork.instance.maxSteps = misc.maxSteps;
                    NeuralNetwork.instance.layers = misc.layers;
                    NeuralNetwork.instance.minimum = misc.minimum == null ? -1 : misc.minimum;
                    NeuralNetwork.instance.initializer = new mathUtil_1.Initializer(NeuralNetwork.instance.outputs.length, NeuralNetwork.instance.inputs.length);
                    //TODO: fix heap overflow error
                    NeuralNetwork.instance.start();
                });
            });
        });
        //TODO: Set up webSocket listeners
    }
}
exports.default = NeuralNetwork;
//# sourceMappingURL=NeuralNetwork.js.map