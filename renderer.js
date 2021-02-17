const { ipcRenderer } = require('electron');
const {searchForConversions, playConversion} = require('./test');
const ProgressBar = require('electron-progressbar');

let message = {
    "playerName": '',
    "playerCharacter": '',
    "opponentName": '',
    "opponentCharacter": '',
    "stage": '',
    "directory": '',
}


function prettyConversions(conversions) {
  if (conversions) {
    let prettyData = [];
    conversions.forEach((conversion) => {
      if (conversion) { 
      console.log(conversion);
        let data = {
            "openingType": conversion.conversion.openingType,
            "moveCount": conversion.conversion.moves.length,
            "killedOpponent": conversion.conversion.didKill,
            "length": Math.round(100 * (conversion.conversion.endFrame - conversion.conversion.startFrame)/60)/100,
            "damageDone": Math.round(1 * conversion.conversion.endPercent - conversion.conversion.startPercent)/1,
            replayData: {
              "filePath": conversion.filePath,
              "startFrame": conversion.conversion.startFrame,
              "endFrame": conversion.conversion.endFrame
            }
        }
        prettyData.push(data);
      }
    })
    console.log(prettyData);
    return prettyData;
  }
}

const vueApp = new Vue({
    el: '#demo',
    data: {
        conversions: "",
        searchQuery: "",
        gridColumns: ["openingType", "moveCount", "killedOpponent", "length", "damageDone"],
        gridData: []
    }         
  })


  Vue.component("demo-grid", {
    template: "#grid-template",
    props: {
      heroes: Array,
      columns: Array,
      filterKey: String
    },
    data: function() {
      var sortOrders = {};
      this.columns.forEach(function(key) {
        sortOrders[key] = 1;
      });
      return {
        sortKey: "",
        sortOrders: sortOrders
      };
    },
    computed: {
      filteredHeroes: function() {
        var sortKey = this.sortKey;
        var filterKey = this.filterKey && this.filterKey.toLowerCase();
        var order = this.sortOrders[sortKey] || 1;
        var heroes = this.heroes;
        if (filterKey) {
          heroes = heroes.filter(function(row) {
            return Object.keys(row).some(function(key) {
              return (
                String(row[key])
                  .toLowerCase()
                  .indexOf(filterKey) > -1
              );
            });
          });
        }
        if (sortKey) {
          heroes = heroes.slice().sort(function(a, b) {
            a = a[sortKey];
            b = b[sortKey];
            return (a === b ? 0 : a > b ? 1 : -1) * order;
          });
        }
        return heroes;
      }
    },
    filters: {
      capitalize: function(str) {
        return str.charAt(0).toUpperCase() + str.slice(1);
      }
    },
    methods: {
      sortBy: function(key) {
        this.sortKey = key;
        this.sortOrders[key] = this.sortOrders[key] * -1;
      },
      playReplay: function(conversion) {
        console.log('PLAYING REPLAY!')
        console.log(conversion);
       playConversion(conversion.replayData);
      }
    }
  });


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
    searchForConversions(message).then((result) => {  
        var bar = JSON.parse(result);
        console.log(bar);        
        vueApp.conversions = bar;
        vueApp.gridData = prettyConversions(bar);
        ipcRenderer.invoke('complete').then(() => {
        if (result === 'err') {
            //do error stuff
        }
      })
    })

}