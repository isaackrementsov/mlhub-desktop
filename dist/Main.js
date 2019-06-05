"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var electron_1 = require("electron");
var ejse = require("ejs-electron");
var NeuralNetwork_1 = require("./network/NeuralNetwork");
var Main = /** @class */ (function () {
    function Main() {
    }
    Main.render = function (filename) {
        Main.mainWindow.loadURL("file://" + __dirname + "/../app/views/" + filename + ".ejs");
    };
    Main.onWindowAllClosed = function () {
        if (process.platform !== 'darwin') {
            Main.application.quit();
        }
    };
    Main.onClose = function () {
        Main.mainWindow = null;
    };
    Main.onReady = function () {
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
    };
    Main.main = function (app, browserWindow) {
        Main.BrowserWindow = browserWindow;
        Main.application = app;
        Main.application.on('window-all-closed', Main.onWindowAllClosed);
        Main.application.on('ready', Main.onReady);
        electron_1.ipcMain.on('close-main-window', function () {
            Main.application.quit();
        });
        electron_1.ipcMain.on('start-learning', function (e) {
            var network = new NeuralNetwork_1.default();
            network.learn();
            e.reply('started-learning');
        });
        electron_1.ipcMain.on('computer-data-request', function (e, data) {
            ejse.data('computer', data.name);
            ejse.data('validAuthKey', data.authKey);
            e.reply('computer-data-added');
        });
    };
    return Main;
}());
exports.default = Main;
//# sourceMappingURL=Main.js.map