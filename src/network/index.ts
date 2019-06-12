import NeuralNetwork from './NeuralNetwork';
import Storage from '../web/Storage';

process.on('message', (data) => {
    Storage.instance = new Storage(data.path);
    NeuralNetwork.init(Storage.instance.get('session', false));
});
