var alphabet : string[] = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm', 'n', 'o', 'p', 'q', 'r', 's', 't', 'u', 'v', 'w', 'y', 'x', 'z', '#', '!', '?'];
function randomGen(){
    let rand : string = '';
    for(let i = 0; i < 50*Math.round(Math.pow(Math.random(), Math.random())) + 10; i++){
        let num : number = Math.round(10*Math.random());
        if(num % 2 == 0 || num < 5){
            rand += alphabet[Math.round((alphabet.length - 1)*Math.random())];
        }else{
            rand += Math.round(100*Math.random());
        }
    }
    return rand;
}

export default randomGen;
