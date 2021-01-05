const { app, BrowserWindow, ipcMain } = require('electron')
const { default: SlippiGame } = require('@slippi/slippi-js');
const fs = require ('fs');
const ConversionFrequency = require('./conversionFrequency');

var win;
var fileNames;

function createWindow () {
  win.loadFile('index.html');
}

function createReplayWindow () {    
    win.loadFile('replayWindow.html');
}

app.whenReady().then(() => {
    win = new BrowserWindow( {    
      webPreferences: {
        nodeIntegration: true
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
      let games = [];
      let conversionDict = new Map();
      let conversionFrequencies = [];

      console.log(searchCriteria);
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
            let data = {...game.getStats(), ...game.getMetadata(), settings}
            delete data.settings.players;
            games.push(data);

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
              
              // if (conversionDict.has(moves)) {
              //   conversionDict.get(moves).val++;
              // } else {
              //   conversionDict.set(moves, {val: 1});
              // }

            })
          }          
      }
      console.log(conversionFrequencies); 
      return JSON.stringify(conversionFrequencies.sort((a, b) => b.frequency - a.frequency));
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