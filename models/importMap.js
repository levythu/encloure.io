var db = require("./db")

db.insertDoc('maps', {
  name: 'circular_war',
  displayName: 'Circular War',
  MapSize: [80,80],
  MaxPlayer: 20,
  map: require("../game/circular_war"),
});

db.insertDoc('maps', {
  name: 'bloody_matrix',
  displayName: 'Bloody Matrix',
  MapSize: [29,29],
  MaxPlayer: 8,
  map: require("../game/bloody_matrix"),
});

db.insertDoc('maps', {
  name: 'desperate_fight',
  displayName: 'Desperate Fight',
  MapSize: [7, 20],
  MaxPlayer: 2,
  map: require("../game/desperate_fight"),
});

db.insertDoc('maps', {
  name: 'recurrent_self',
  displayName: 'Recurrent Self',
  MapSize: [24, 26],
  MaxPlayer: 1,
  map: require("../game/recurrent_self"),
});
