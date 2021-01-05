const { ipcRenderer } = require('electron')

let message = {
    "playerName": '',
    "playerCharacter": '',
    "opponentName": '',
    "opponentCharacter": '',
    "stage": '',
    "directory": '',
}

function searchForMatches() {
    message.playerName = document.getElementById('playerOneName').value;
    message.playerCharacter = document.getElementById('playerOneCharacter').value;
    message.opponentName = document.getElementById('playerTwoName').value;
    message.opponentCharacter = document.getElementById('playerTwoCharacter').value;
    message.stage = document.getElementById('stage').value;
    console.log(message);

    const regExp = /(.*\\)/;
    const match = regExp.exec(document.getElementById('leagueInstallPath').files[0].path)[0];
    message.directory = match;
    ipcRenderer.invoke('searchForMatches', message).then((result) => {
        var bar = JSON.parse(result);
        console.log(bar);
        var list = document.createElement('ul');
        for (var i = 0; i < bar.length; i++) {
            var item = document.createElement('li');
            var otherItem = document.createElement('li');
            item.appendChild(document.createTextNode(bar[i].moveNames));
            otherItem.appendChild(document.createTextNode("doot"));
            list.appendChild(item);
            list.appendChild(otherItem);                        
        }
        document.getElementById('foo').appendChild(list);
        if (result === 'err') {
            //do error stuff
        }
    })
}