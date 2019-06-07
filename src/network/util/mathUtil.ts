export let normalize = (x : number) => {
    return 2/(1 + Math.exp(-2*x)) - 1;
}

export let  normDeriv = (x : number) => {
    return 1 - Math.pow(normalize(x), 2);
}

export let sumFunc = (max : number, divisor : number, cb : Function) => {
    let sum : number = 0;

    for(let i = 0; i < max; i++){
        sum += cb(i);
    }

    return sum/divisor;
}

export class Initializer {

    private outputs : number;
    private inputs : number;

    bmtRandom() {
        let u = 0, v = 0;
        while(u === 0) u = Math.random();
        while(v === 0) v = Math.random();
        return Math.sqrt( -2.0 * Math.log( u ) ) * Math.cos( 2.0 * Math.PI * v );
    }

    init() : number {
        return this.bmtRandom()*Math.sqrt(1/(this.outputs + this.inputs));
    }

    constructor(outputs : number, inputs : number){
        this.outputs = outputs;
        this.inputs = inputs;
    }

}
