const { ipcRenderer } = require('electron')

let message = {
    "playerName": '',
    "playerCharacter": '',
    "opponentName": '',
    "opponentCharacter": '',
    "stage": '',
    "directory": '',
}


function prettyConversions(conversions) {
  console.log(123);
  if (conversions) {
    let prettyData = [];
    conversions.forEach((conversion) => {
        let data = {
            "moveCount": conversion.conversion.moves.length,
            "killedOpponent": conversion.conversion.didKill
        }
        prettyData.push(data);
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
        gridColumns: ["moveCount", "killedOpponent"],
        gridData: []
    },
      methods: {
          playConversion: function (conversion, event) {
              console.log(conversion);
              ipcRenderer.invoke('playConversion', conversion);              
          }          
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
    ipcRenderer.invoke('searchForConversions', message).then((result) => {
        var bar = JSON.parse(result);
        console.log(bar);        
        vueApp.conversions = bar;
        vueApp.gridData = prettyConversions(bar);
        if (result === 'err') {
            //do error stuff
        }
    })
}