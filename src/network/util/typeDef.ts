export class Activation {

    j : number; //Index within layer
    l : number; //Layer
    val : number;

    constructor(j : number, l : number, val : number){
        this.j = j;
        this.l = l;
        this.val = val;
    }
}

export class Bias extends Activation {

    constructor(j : number, l : number, val : number){
        super(j, l, val);
    }

}

export class Weight extends Bias {

    k : number;
    /*Index that weight connects from
    l-1 | l
    k -> j
    */

    constructor(j :number, k : number, l : number, val : number){
        super(j, l, val);
        this.k = k;
    }
}
