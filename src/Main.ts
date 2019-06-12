import { BrowserWindow, ipcMain } from 'electron';
import { fork } from 'child_process';
import * as ejse from 'ejs-electron';

import NeuralNetwork from './network/NeuralNetwork';
import Storage from './web/Storage';

export default class Main {

    static mainWindow : Electron.BrowserWindow;
    static application : Electron.App;
    static child;
    static BrowserWindow;

    private static render(filename){
        Main.mainWindow.loadURL(`file://${__dirname}/../app/views/${filename}.ejs`);
    }

    private static onWindowAllClosed(){
        if(process.platform !== 'darwin'){
            Main.application.quit();
        }
    }

    private static onClose(){
        Main.mainWindow = null;
    }

    private static onReady(){
        Main.mainWindow = new Main.BrowserWindow({
            width: 800,
            height: 600,
            frame: false,
            webPreferences: {
                nodeIntegration: true,
                nodeIntegrationInWorker: true
            }
        });

        ejse.data('validAuthKey', Storage.instance.get('authKey', true));
        ejse.listen();

        Main.render('index');
        //Main.mainWindow.webContents.openDevTools();
        Main.mainWindow.on('closed', Main.onClose);
    }

    private static startChild(){
        Main.child = fork('./dist/network/index.js');
        Main.child.send({path: Storage.instance.appDataPath.split(Storage.filename)[0]});
    }

    static main(app : Electron.App, browserWindow: typeof BrowserWindow){
        Main.BrowserWindow = browserWindow;
        Main.application = app;

        this.startChild();

        ipcMain.on('close-main-window', () => {
            Main.application.quit();
        });

        ipcMain.on('start-learning', (e) => {
            let sess : number = Storage.instance.get('session', false);
            sess++;
            Storage.instance.set('session', sess, false);

            //NeuralNetwork.init(sess);
            Main.child = fork('./dist/network/index.js');

            Main.child.send({path: Storage.instance.appDataPath.split(Storage.filename)[0]});

            Main.child.on('message', data => {
                e.sender.send('learning-update', data.learningUpdate);
            });

            Main.child.on('close', () => this.startChild());

            Main.child.on('error', () => {
                Main.child.kill('SIGINT');
                this.startChild();
            });

            e.reply('started-learning');
        });

        ipcMain.on('computer-data-request', (e, data) => {
            ejse.data('computer', data.name);
            ejse.data('validAuthKey', data.authKey);

            Storage.instance.set('computer', data.name, false);
            Storage.instance.set('authKey', data.authKey, true);

            e.reply('computer-data-added');
        });
    }

}
