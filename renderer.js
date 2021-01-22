const { ipcRenderer } = require('electron')

let message = {
    "playerName": '',
    "playerCharacter": '',
    "opponentName": '',
    "opponentCharacter": '',
    "stage": '',
    "directory": '',
}
const vueApp = new Vue({
    el: '#vapp',
    data: {
        conversions: null
      },
      methods: {
          playConversion: function (conversion, event) {
              console.log(conversion);
              ipcRenderer.invoke('playConversion', conversion);              
          }
      }
  })

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
    ipcRenderer.invoke('searchForConversions', message).then((result) => {
        var bar = JSON.parse(result);
        console.log(bar);        
        vueApp.conversions = bar;
        if (result === 'err') {
            //do error stuff
        }
    })
}