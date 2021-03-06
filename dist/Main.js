"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const electron_1 = require("electron");
const child_process_1 = require("child_process");
const ejse = require("ejs-electron");
const Storage_1 = require("./web/Storage");
const ServerConnector_1 = require("./web/ServerConnector");
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
        Main.child.send({
            path: Storage_1.default.instance.appDataPath.split(Storage_1.default.filename)[0],
            authKey: Storage_1.default.instance.get('authKey', true)
        });
    }
    static main(app, browserWindow) {
        Main.BrowserWindow = browserWindow;
        Main.application = app;
        Main.connection = new ServerConnector_1.default();
        Main.application.on('window-all-closed', Main.onWindowAllClosed);
        Main.application.on('ready', Main.onReady);
        electron_1.ipcMain.on('close-main-window', () => {
            Main.application.quit();
        });
        electron_1.ipcMain.on('start-learning', (e) => {
            let sess = Storage_1.default.instance.get('session', false);
            sess++;
            Storage_1.default.instance.set('session', sess, false);
            this.connection.sendWebSocketsRequest('/api/ws/relativeMinimum', ws => {
                Main.startChild();
                Main.child.on('message', data => {
                    if (data.ws) {
                        ws.send(JSON.stringify(data));
                    }
                    else {
                        e.sender.send('learning-update', data.learningUpdate);
                    }
                });
                Main.child.on('close', () => Main.startChild());
                Main.child.on('error', () => {
                    Main.child.kill('SIGINT');
                    Main.startChild();
                });
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