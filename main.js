const { app, BrowserWindow, ipcMain, ipcRenderer } = require('electron')
const { default: SlippiGame } = require('@slippi/slippi-js');
const fs = require ('fs');
const ConversionFrequency = require('./conversionFrequency');
const { exec } = require("child_process");
const ProgressBar = require('electron-progressbar');


var win;
var progressBar;

function createWindow () {
  win.loadFile('index.html');
}

function createReplayWindow () {    
    win.loadFile('replayWindow.html');
}

app.whenReady().then(() => {
    win = new BrowserWindow( {    
      webPreferences: {
        nodeIntegration: true,
        enableRemoteModule: true
      }});
    createWindow();
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

ipcMain.handle('sendReplayPath', async (event, replayPath) => {
    console.log(replayPath);
    return getFiles(replayPath).then((files) => {
        //ends in .slp
        let regExp = /.*\.slp$/;
        let replays = files.filter(file => regExp.test(file.name));                
        if (replays.length == 0) {
            return 'err';
        }
        win.loadFile('index.html')
        fileNames = replays;
        return 'success';        
    })
})


async function getReplays(path) {
  let files = await getFiles(path);
  let regExp = /.*\.slp$/;
  let replays = files.filter(file => regExp.test(file.name));
  return replays;
}

ipcMain.handle('searchForMatches', async (event, searchCriteria) => {
    return getReplays(searchCriteria.directory).then((replays) => {
      let conversionFrequencies = [];
      for (let i = 0; i < replays.length; i++) {
          let playerIndex = null;
          const game = new SlippiGame(replays[i].path);

          if (game.getMetadata().players[0].names.netplay == searchCriteria.playerName || game.getMetadata().players[0].names.code == searchCriteria.playerName) {
            playerIndex = 0;
          }
          if (game.getMetadata().players[1].names.netplay == searchCriteria.playerName || game.getMetadata().players[1].names.code == searchCriteria.playerName) {
            playerIndex = 1;
          }          
          if (playerIndex == 1 || playerIndex == 0) {

            let settings = game.getSettings();
            let gameConversions = game.getStats().conversions.filter(x => x.playerIndex == playerIndex);
           
            gameConversions.forEach((gameConversion) => {
              let moveIds = gameConversion.moves.map(x=>x.moveId);

              let conversionFrequency = new ConversionFrequency(moveIds);
              let addNew = true;
              conversionFrequencies.forEach((conversion) => {
                //JSON it or else it doesnt work                   
                if (JSON.stringify(moveIds) === JSON.stringify(conversion.moveIds)) {
                  conversion.frequency++;
                  addNew = false;
                }
              })
              if (addNew) {
                conversionFrequencies.push(conversionFrequency);
              }
            })
          }          
      }
      // console.log(conversionFrequencies); 
      return JSON.stringify(conversionFrequencies.sort((a, b) => b.frequency - a.frequency));
    })

})


ipcMain.handle('searchForConversions', async (event, searchCriteria) => {
  return getReplays(searchCriteria.directory).then((replays) => {
    let conversions = [];
    for (let i = 0; i < replays.length; i++) {
        let playerIndex = null;
        const game = new SlippiGame(replays[i].path);

        if (game.getMetadata().players[0].names.netplay == searchCriteria.playerName || game.getMetadata().players[0].names.code == searchCriteria.playerName) {
          playerIndex = 0;
        }
        if (game.getMetadata().players[1].names.netplay == searchCriteria.playerName || game.getMetadata().players[1].names.code == searchCriteria.playerName) {
          playerIndex = 1;
        }          
        if (playerIndex == 1 || playerIndex == 0) {
          let gameConversions = game.getStats().conversions.filter(x => x.playerIndex == playerIndex);
          gameConversions.forEach((gameConversion) => {
            let data = {
              "conversion": gameConversion,
              "filePath": replays[i].path,
              "startFrame": gameConversion.startFrame,
              "endFrame": gameConversion.endFrame
            }
            conversions.push(data);
          })
          
        }          
    }
    // console.log(conversionFrequencies); 
    return JSON.stringify(conversions.sort((a, b) => b.conversion.moves.length- a.conversion.moves.length));
  })
})

ipcMain.handle('playConversion', async (event, conversion) => {
  const dolphinPath = "C:\\Users\\18135\\AppData\\Roaming\\Slippi Desktop App\\dolphin\\Dolphin.exe"
  const isoPath = "D:\\Games\\Dolphin Isos\\Super Smash Bros. Melee (USA) (En,Ja) (Rev 2).nkit.iso"
  var replayCommand = `"${dolphinPath}" -i tempMoments.json -b -e "${isoPath}"`;
  var output = {
    "mode": "queue",
    "replay": "",
    "isRealTimeMode": false,
    "outputOverlayFiles": true,
    "queue": []
    };
    var queueMessage = {
      "path":conversion.filePath,
      "startFrame": conversion.startFrame,
      "endFrame": conversion.endFrame
    };
    output.queue.push(queueMessage);
    console.log(replayCommand);
    console.log(JSON.stringify(output));
    fs.writeFileSync("tempMoments.json", JSON.stringify(output));
    exec(replayCommand, (error) => {
      //dolphin will exit, and then the command will error
      //then this fires - so this is how we time it (since opening a million dolphins doesnt work so well)
      if (error) {
          console.log(`error - but actually good!`);                               
          return;
      }
  })
})

async function getFiles(path = "./") {
    const entries = fs.readdirSync(path, { withFileTypes: true });
    // Get files within the current directory and add a path key to the file objects
    const files = entries
        .filter(file => !file.isDirectory())
        .map(file => ({ ...file, path: path + file.name }));

    // Get folders within the current directory
    const folders = entries.filter(folder => folder.isDirectory());

    for (const folder of folders)
        /*
          Add the found files within the subdirectory to the files array by calling the
          current function itself
        */
        files.push(...await getFiles(`${path}${folder.name}/`));

    return files;
}