const { ipcRenderer } = require('electron')

function sendReplayPath() {    
    //path: "D:\Coding Projects\MeleeClipper\replayInbox\Game_20200818T085845.slp"
    console.log(document.getElementById('leagueInstallPath').files[0].path);
    //match from the beginning to the last backslash
    //"D:\Coding Projects\MeleeClipper\replayInbox"
    const regExp = /(.*\\)/;
    const match = regExp.exec(document.getElementById('leagueInstallPath').files[0].path)[0];
    console.log(match);
    ipcRenderer.invoke('sendReplayPath', match).then((result) => {
        console.log(result);
        if ('err') {
            //do error stuff
        }
    })
}

