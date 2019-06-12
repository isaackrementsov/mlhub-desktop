"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const electron_1 = require("electron");
const child_process_1 = require("child_process");
const ejse = require("ejs-electron");
const Storage_1 = require("./web/Storage");
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
                nodeIntegration: true,
                nodeIntegrationInWorker: true
            }
        });
        ejse.data('validAuthKey', Storage_1.default.instance.get('authKey', true));
        ejse.listen();
        Main.render('index');
        //Main.mainWindow.webContents.openDevTools();
        Main.mainWindow.on('closed', Main.onClose);
    }
    static startChild() {
        Main.child = child_process_1.fork('./dist/network/index.js');
        Main.child.send({ path: Storage_1.default.instance.appDataPath.split(Storage_1.default.filename)[0] });
    }
    static main(app, browserWindow) {
        console.log('starting');
        Main.BrowserWindow = browserWindow;
        Main.application = app;
        this.startChild();
        electron_1.ipcMain.on('close-main-window', () => {
            Main.application.quit();
        });
        electron_1.ipcMain.on('start-learning', (e) => {
            let sess = Storage_1.default.instance.get('session', false);
            sess++;
            Storage_1.default.instance.set('session', sess, false);
            //NeuralNetwork.init(sess);
            Main.child = child_process_1.fork('./dist/network/index.js');
            Main.child.send({ path: Storage_1.default.instance.appDataPath.split(Storage_1.default.filename)[0] });
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
        electron_1.ipcMain.on('computer-data-request', (e, data) => {
            ejse.data('computer', data.name);
            ejse.data('validAuthKey', data.authKey);
            Storage_1.default.instance.set('computer', data.name, false);
            Storage_1.default.instance.set('authKey', data.authKey, true);
            e.reply('computer-data-added');
        });
    }
}
exports.default = Main;
//# sourceMappingURL=Main.js.map