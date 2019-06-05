"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var electron_1 = require("electron");
var ejse = require("ejs-electron");
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
        electron_1.ipcMain.on('register', function () {
        });
    };
    return Main;
}());
exports.default = Main;
//# sourceMappingURL=Main.js.map