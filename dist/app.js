"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const electron_1 = require("electron");
const Main_1 = require("./Main");
const Storage_1 = require("./web/Storage");
new Storage_1.default(); //Instance is stored in static class property for other modules to access
Main_1.default.main(electron_1.app, electron_1.BrowserWindow);
exports.default = electron_1.app;
//# sourceMappingURL=app.js.map