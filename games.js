const { default: SlippiGame } = require('@slippi/slippi-js');

const minimumGameTime = 1200; //20 seconds
const skipCPUmatches = true;

function filterGames(games) {
    let filteredGames = [];
    for (let i = 0; i < games.length; i++) {
        const settings = game.getSettings();
        //skip if CPU
        if (skipCPUmatches) {
            var skip = false;
            for (var n=0;n<settings.players.length;n++) {
              // if cpu
              if (settings.players[n].type != 0) {
                skip = true;
                break;
              }
            }
            if (skip) continue;
        }
        //skip if bad file
        if (game.getLatestFrame() == null || game.getLatestFrame() == undefined || game.getFrames() == null) {
            continue;
        }
        //skip if game too short
        if (game.getLatestFrame() < minimumGameTime) {
            continue;
        }
        filteredGames.push(games[i]);
    }
    return filteredGames;
}


function assignWinOrLoss(game, playerIndex) {
    const opponentIndex = playerIndex == 0 ? 1 : 0;
    //win if you have more stocks, or lower percent, when game ends
    const stats = game.getStats().map(x => x.killCount);
    const latestframePercents = game.getLatestFrame().players.map( x => x.post.percent);
    let playerKills = stats[playerIndex]
    let playerFinalPercent = latestframePercents[playerIndex];
    let opponentKills = stats[opponentIndex];
    let opponentFinalPercent = latestframePercents[opponentIndex];

    let moreKills = playerKills > opponentKills;
    let lowerPercent = (playerKills == opponentKills) && (playerFinalPercent < opponentFinalPercent);

    if (moreKills || lowerPercent) {
        game.isWin = true;
    } else {
        game.isWin = false;
    }
    return game;
}

module.exports = {
    filterGames: filterGames,
    assignWinOrLoss: assignWinOrLoss
}