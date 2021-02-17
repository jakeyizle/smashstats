const { default: SlippiGame } = require('@slippi/slippi-js');
const fs = require ('fs');
const { ipcRenderer } = require('electron');
const db = require('electron-db');
var hash = require('object-hash');
const { exec } = require("child_process");


async function getReplays(path) {
  let files = await getFiles(path);
  let regExp = /.*\.slp$/;
  let replays = files.filter(file => regExp.test(file.name));
  return replays;
}

async function searchForConversions(searchCriteria) {
  return getReplays(searchCriteria.directory).then(async (replays) => {
    await ipcRenderer.invoke('loading', replays.length);
    let conversions = [];
    const cachedConversions = await getCachedConversions();
    for (let i = 0; i < replays.length; i++) {
      await ipcRenderer.invoke('increment');
      console.log(i);
      let playerIndex = null;
      const game = new SlippiGame(replays[i].path);

      if (!game.getMetadata()) {
        continue;
      }
      const hashGame = {
        "hash": hash(game)
      }
      const isGameCached = await isGameInDB(hashGame);
      if (isGameCached) {
        console.log(`${i} is in DB`)
        continue;
      }
      await insertGame(hashGame);

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
          };
          insertConversion(data);
          conversions.push(data);
        });

      }
    }    
    const allConversions = conversions.concat(cachedConversions);
    return JSON.stringify(allConversions.sort((a, b) => b.conversion.moves.length - a.conversion.moves.length));
  })
}

async function playConversion(conversion) {
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
}

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
async function getAllGames() {
  return db.getAll('games', (succ, data) => {
    console.log(`getAllGames - ${succ}`)
    console.log(data);
  })
}

function isGameInDB(hash) {
  return new Promise((resolve, reject) => {
  db.getRows('games', {"hash": hash.hash}, (isInDB, result) => {
    console.log('isGameInDB');
    console.log(result);
    console.log(result.length);
    resolve(result.length);
  })  
})
}



async function insertGame(hash) {
  console.log('INSERT');
  console.log(hash);
  return db.insertTableContent('games', hash, (succ, err) => {
  });
}
async function insertConversion(conversion) {
  if (db.valid('conversions')) {
    return db.insertTableContent('conversions', conversion, (succ, err) => {
    })    
  }
}

async function getCachedConversions() {
  return new Promise((resolve, reject) => {
   db.getAll('conversions', (succ, data) => {
     resolve(data);
    })
  })
}
module.exports = {
  searchForConversions: searchForConversions,
  playConversion: playConversion
}