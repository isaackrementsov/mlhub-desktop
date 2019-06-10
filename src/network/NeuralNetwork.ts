import { normalize, normDeriv, sumFunc, Initializer } from './util/mathUtil';
import { Weight, Bias, Activation } from './util/typeDef';
import { delay } from './util/misc';

export default class NeuralNetwork {

    private weights : Weight[][][];
    private biases : Bias[][];
    private minWeights : Weight[][][];
    private minBiases : Bias[][];
    private activations : Activation[][][];
    private sums : Activation[][][];
    private inputs : number[][];
    private outputs : number[][];
    private layers : number[];
    private slopes : number[];
    private learningRate : number;
    private savedLearningRate : number;
    private maxSlope : number;
    private minimum : number;
    private decayRate : number;
    private thresHold : number;
    private maxSteps : number;
    private initializer : Initializer;

    async start(){
        while(true){
            await this.populate();
            let steps : number = 0;
            while(true){
                steps++;
                this.learningRate = this.savedLearningRate;
                this.slopes = [];
                await this.learn();
                if(this.maxSlope < this.thresHold || steps > this.maxSteps){
                    let cost : number = this.cost();
                    if(cost < this.minimum || this.minimum == -1){
                        console.log(cost);
                        this.minimum = cost;
                        this.minWeights = this.weights;
                        this.minBiases = this.biases;
                    }
                    break;
                }else if(this.approachingMinimum()){
                    this.learningRate /= this.decayRate;
                }
            }
        }
    }

    async test(){
        await this.activateT(0);
    }

    private approachingMinimum() : boolean { //Looks for gradient descent algorithm bouncing between two sides of a minimum
        return Math.abs(this.slopes[this.slopes.length - 7] - this.slopes[this.slopes.length - 1]) < this.thresHold;
    }

    private async learn(){
        await this.activate();

        this.maxSlope = 0;

        let newWeights : Weight[][][] = this.weights;
        let newBiases : Bias[][] = this.biases;

        for(let l = 1; l < this.weights.length; l++){
            for(let j = 0; j < this.weights[l].length; j++){
                for(let k = 0; k < this.weights[l][j].length; k++){
                    let w : Weight = this.weights[l][j][k];
                    let step : number = await this.propagate(w);
                    if(!isNaN(step)){
                        w.val -= this.learningRate*step;
                        if(step > this.maxSlope){
                            this.maxSlope = step;
                        }
                    }
                    newWeights[l][j][k] = w;
                }
            }
        }

        for(let l = 1; l < this.biases.length; l++){
            for(let j = 0; j < this.biases[l].length; j++){
                let b : Bias  = this.biases[l][j];
                let step : number = await this.propagateB(b);
                if(!isNaN(step)){
                    b.val -= this.learningRate*step;
                    if(step > this.maxSlope){
                        this.maxSlope = step;
                    }
                 }
                newBiases[l][j] = b;
            }
        }

        this.slopes.push(this.maxSlope);
        this.biases = newBiases;
        this.weights = newWeights;
    }

    private populate(){
        for(let l = this.layers.length - 1; l > 0; l--){
            this.biases[l] = [];
            this.weights[l] = [];
            for(let j = 0; j < this.layers[l]; j++){
                this.biases[l][j] = new Bias(j, l, this.initializer.init());
                this.weights[l][j] = [];
                for(let k = 0; k < this.layers[l - 1]; k++){
                    this.weights[l][j][k] = new Weight(j, k, l, this.initializer.init());
                }
            }
        }
    }

    private cost() : number {
        return sumFunc(this.outputs.length, this.outputs.length, t => sumFunc(this.outputs[t].length, this.outputs[t].length, j => {
            return Math.pow(this.activations[t][this.activations[t].length - 1][j].val - this.outputs[t][j], 2);
        }));
    }

    private activate() {
        for(let t = 0; t < this.inputs.length; t++){
            this.activateT(t);
        }
    }

    private activateT(t : number){
        this.activations[t] = [];
        this.sums[t] = [];
        for(let l = 0; l < this.layers.length; l++){
            this.activations[t][l] = [];
            this.sums[t][l] = [];
            if(l == 0){
                for(let j = 0; j < this.inputs[t].length; j++){
                    let inp : Activation = new Activation(j, l, normalize(this.inputs[t][j]));
                    this.activations[t][l][j] = inp;
                    this.sums[t][l][j] = inp;
                }
            }else{
                for(let j = 0; j < this.layers[l]; j++){
                    let sum : number = sumFunc(this.activations[t][l - 1].length, 1, k => {
                        return this.weights[l][j][k].val*this.activations[t][l - 1][k].val;
                    });
                    sum += this.biases[l][j].val;

                    this.activations[t][l][j] = new Activation(j, l, normalize(sum));
                    this.sums[t][l][j] = new Activation(j, l, sum);
                }
            }
        }
    }

    private propagate(w : Weight) : number { //Partial derivative of cost function with respect to weight
        return sumFunc(this.outputs.length, this.outputs.length, t => sumFunc(this.outputs[t].length, this.outputs[t].length, j => {
            return 2*(this.activations[t][this.activations[t].length - 1][j].val - this.outputs[t][j])*this.pd(
                this.activations[t][this.activations[t].length - 1][j],
                w, t
            );
        }));
    }

    private pd(a : Activation, w : Weight, t : number) : number { //Takes partial derivative of activation with respect to weight
        return normDeriv(this.sums[t][a.l][a.j].val)*this.pdSum(a, w, t);
    }

    private pdSum(a : Activation, w : Weight, t : number) : number { //Handles sum statement in recursive derivative definition
        if(a.l == w.l) return this.activations[t][a.l - 1][w.k].val;

        let s = sumFunc(this.activations[t][a.l - 1].length, 1,
            async k => this.weights[a.l][a.j][k].val*this.pd(this.activations[t][a.l - 1][k], w, t)
        );
        return s;
    }

    private propagateB(b : Bias) : number { //Partial derivative of cost function with respect to weight
        return sumFunc(this.outputs.length, this.outputs.length, t => sumFunc(this.outputs[t].length, this.outputs[t].length, j => {
            return 2*(this.activations[t][this.activations[t].length - 1][j].val - this.outputs[t][j])*this.pdB(
                this.activations[t][this.activations[t].length - 1][j],
                b, t
            );
        }));
    }

    private pdB(a : Activation, b : Bias, t : number) : number { //Takes partial derivative of activation with respect to weight
        return normDeriv(this.sums[t][a.l][a.j].val)*this.pdSumB(a, b, t);
    }

    private pdSumB(a : Activation, b : Bias, t : number) : number { //Handles sum statement in recursive derivative definition
        if(a.l == b.l) return 1;

        return sumFunc(this.activations[t][a.l - 1].length, 1,
            k => this.weights[a.l][a.j][k].val*this.pdB(this.activations[t][a.l - 1][k], b, t)
        );
    }

    constructor(){
        this.layers = [3,2,3];
        this.activations = [];
        this.sums = [];
        this.maxSlope = 0;
        this.minimum = -1;
        //Add server stuff here
        this.biases = [];
        this.weights = [];
        this.inputs = [[1,0.5,0.2], [1, 1, 1], [0.2, 0.1, 0.3]];
        this.outputs = [[0, 0, 1], [0, 1, 0], [1, 0, 0]];
        this.learningRate = 1;
        this.savedLearningRate = this.learningRate;
        this.decayRate = 2;
        this.thresHold = 0.005;
        this.maxSteps = 100;
        this.initializer = new Initializer(this.outputs.length, this.inputs.length);
    }

}
