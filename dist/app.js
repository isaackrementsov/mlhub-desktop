"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const electron_1 = require("electron");
const Main_1 = require("./Main");
const Storage_1 = require("./web/Storage");
new Storage_1.default(electron_1.app.getPath('appData')); //Instance is stored in static class property for other modules to access
Main_1.default.main(electron_1.app, electron_1.BrowserWindow);
//# sourceMappingURL=app.js.map