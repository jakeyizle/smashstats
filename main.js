const { app, BrowserWindow, ipcMain, ipcRenderer } = require('electron')
const { default: SlippiGame } = require('@slippi/slippi-js');
const fs = require ('fs');
const ConversionFrequency = require('./conversionFrequency');
const { exec } = require("child_process");
const ProgressBar = require('electron-progressbar');
const db = require('electron-db');


var win;
var progressBar;

function createWindow () {
  win.loadFile('index.html');
}

app.whenReady().then(() => {
    win = new BrowserWindow( {    
      webPreferences: {
        nodeIntegration: true,
        enableRemoteModule: true
      }});
    createWindow();
    initalizeDatabase();
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow()
  }  
})

ipcMain.handle('loading', async (event, message) => {
  console.log('ping');
  progressBar = new ProgressBar({
    indeterminate: false,
    text: 'Preparing data...',
    detail: 'Wait...',
    maxValue: message
  });
  
  progressBar
    .on('completed', function() {
      console.info(`completed...`);
      progressBar.detail = 'Task completed. Exiting...';
    })
    .on('aborted', function(value) {
      console.info(`aborted... ${value}`);
    })
    .on('progress', function(value) {
      progressBar.detail = `File ${value} out of ${progressBar.getOptions().maxValue}...`;
    });
})

ipcMain.handle('increment', async (event, message) => {
  progressBar.value += 1;
})
ipcMain.handle('complete', async (event, message) => {
  console.log('pong');
  progressBar.setCompleted();
})
ipcMain.handle('ping', async (event, message) => {
  console.log(`ping - ${message}`);
})


async function initalizeDatabase() {
  db.createTable('games', (succ, msg) => {
    console.log(`Succ - ${succ} - Msg ${msg}`)
  });
  db.createTable('conversions', (succ, msg) => {
    console.log(`Succ - ${succ} - Msg ${msg}`)
  });
}