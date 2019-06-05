import { BrowserWindow, ipcMain } from 'electron';
import * as ejse from 'ejs-electron';

import NeuralNetwork from './network/NeuralNetwork';

export default class Main {

    static mainWindow : Electron.BrowserWindow;
    static application : Electron.App;
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
                nodeIntegration: true
            }
        });
        if(!ejse.data('validAuthKey')){
            ejse.data('validAuthKey', false);
        }
        ejse.listen();
        Main.render('index');
        //Main.mainWindow.webContents.openDevTools();
        Main.mainWindow.on('closed', Main.onClose);
    }

    static main(app : Electron.App, browserWindow: typeof BrowserWindow){
        Main.BrowserWindow = browserWindow;
        Main.application = app;

        Main.application.on('window-all-closed', Main.onWindowAllClosed);
        Main.application.on('ready', Main.onReady);

        ipcMain.on('close-main-window', () => {
            Main.application.quit();
        });

        ipcMain.on('start-learning', (e) => {
            let network : NeuralNetwork = new NeuralNetwork();
            network.learn();
            e.reply('started-learning');
        });

        ipcMain.on('computer-data-request', (e, data) => {
            ejse.data('computer', data.name);
            ejse.data('validAuthKey', data.authKey);
            e.reply('computer-data-added');
        });
    }

}
