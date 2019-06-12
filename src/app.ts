import { app, BrowserWindow } from 'electron';
import Main from './Main';
import Storage from './web/Storage';

new Storage(app.getPath('appData')); //Instance is stored in static class property for other modules to access

Main.main(app, BrowserWindow);
