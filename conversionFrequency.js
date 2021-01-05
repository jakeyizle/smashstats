const Moves = require('./moves');

class ConversionFrequency {
  moveIds;
  moveNames = [];
  frequency = 1;

  constructor(moves) {
    this.moveIds = moves;
    moves.forEach(move => {
      this.moveNames.push(Moves.getMoveName(move));
    })
  }
}

module.exports = ConversionFrequency;