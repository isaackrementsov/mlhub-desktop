import { normalize, normDeriv, sumFunc, Initializer } from './util/mathUtil';
import { Weight, Bias, Activation } from './util/typeDef';
import ServerConnector from '../web/ServerConnector';

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
    private session : number;
    private initializer : Initializer;
    private connection : ServerConnector;

    static instance : NeuralNetwork;

    async start(){
        while(true){
            await this.populate();
            let steps : number = 0;
            this.slopes = [];
            while(true){
                steps++;
                this.learningRate = this.savedLearningRate;
                await this.learn();
                if(this.maxSlope < this.thresHold || steps > this.maxSteps){
                    let cost : number = this.cost();
                    if(cost < this.minimum || this.minimum == -1){
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

                         process.send({learningUpdate: `Minimum at ${cost}`});
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
        if(this.slopes.length > 7){
            this.slopes.splice(0, 1);
        }

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

    static init(session : number){
        NeuralNetwork.instance = new NeuralNetwork(); //Only way to access "this" in callbacks
        NeuralNetwork.instance.activations = [];
        NeuralNetwork.instance.sums = [];
        NeuralNetwork.instance.biases = [];
        NeuralNetwork.instance.weights = [];
        NeuralNetwork.instance.maxSlope = 0;
        NeuralNetwork.instance.session = session;
        NeuralNetwork.instance.connection = new ServerConnector();

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
                    NeuralNetwork.instance.initializer = new Initializer(
                        NeuralNetwork.instance.outputs.length,
                        NeuralNetwork.instance.inputs.length
                    );

                    //TODO: fix heap overflow error
                    NeuralNetwork.instance.start();
                });
            });
        });
        //TODO: Set up webSocket listeners
    }

}
