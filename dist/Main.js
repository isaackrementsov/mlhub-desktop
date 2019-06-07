"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const electron_1 = require("electron");
const ejse = require("ejs-electron");
const NeuralNetwork_1 = require("./network/NeuralNetwork");
class Main {
    static render(filename) {
        Main.mainWindow.loadURL(`file://${__dirname}/../app/views/${filename}.ejs`);
    }
    static onWindowAllClosed() {
        if (process.platform !== 'darwin') {
            Main.application.quit();
        }
    }
    static onClose() {
        Main.mainWindow = null;
    }
    static onReady() {
        Main.mainWindow = new Main.BrowserWindow({
            width: 800,
            height: 600,
            frame: false,
            webPreferences: {
                nodeIntegration: true
            }
        });
        if (!ejse.data('validAuthKey')) {
            ejse.data('validAuthKey', false);
        }
        ejse.listen();
        Main.render('index');
        //Main.mainWindow.webContents.openDevTools();
        Main.mainWindow.on('closed', Main.onClose);
    }
    static main(app, browserWindow) {
        Main.BrowserWindow = browserWindow;
        Main.application = app;
        Main.application.on('window-all-closed', Main.onWindowAllClosed);
        Main.application.on('ready', Main.onReady);
        electron_1.ipcMain.on('close-main-window', () => {
            Main.application.quit();
        });
        electron_1.ipcMain.on('start-learning', (e) => {
            let network = new NeuralNetwork_1.default();
            network.learn();
            e.reply('started-learning');
        });
        electron_1.ipcMain.on('computer-data-request', (e, data) => {
            ejse.data('computer', data.name);
            ejse.data('validAuthKey', data.authKey);
            e.reply('computer-data-added');
        });
    }
}
exports.default = Main;
//# sourceMappingURL=Main.js.map