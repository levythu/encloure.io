// Connection URL
var conf=require("../settings");
var url = conf.database.url;

var mongojs = require('mongojs');
var db = mongojs(url, ['gameServers', 'rooms', 'users']);

exports.insertDoc = function(collectionName, doc) {
    db.collection(collectionName).insert(doc, function(){});
};

exports.deleteDoc = function(collectionName, doc) {
    db.collection(collectionName).remove(doc, function(){});
};

exports.registerRoom = function(serverEndpoint, gameEndpoint) {
    db.collection('gameServers').update({endpoint:serverEndpoint},
        {$push: { roomIds: gameEndpoint }}, {multi: false}, function (){});
    //TODO: hardcode max players
    db.collection('rooms').insert({'serverEndpoint':serverEndpoint,
    'gameEndpoint':gameEndpoint, maxPlayers:20, activePlayers:1}, function(){});
}

exports.unregisterRoom = function(gameEndpoint) {
    db.collection('rooms').findOne({'gameEndpoint':gameEndpoint}, function(err, doc) {
        db.collection('gameServers').update({endpoint:doc.serverEndpoint},
            {$pull: { roomIds: gameEndpoint }}, {multi: false}, function (){});
        db.collection('rooms').remove(doc, function(){});
    });
}

exports.unregisterGameServer = function(serverEndpoint) {
    db.collection('gameServers').findOne({'endpoint':serverEndpoint}, function(err, doc) {
        for (var id in doc.roomIds) {
            db.collection('rooms').remove({'gameEndpoint':doc.roomIds[id]}, function(){});
        }
        db.collection('gameServers').remove({'endpoint':serverEndpoint}, function(){});
    });
}

exports.updatePlayerNum = function(gameEndpoint, num) {
    db.collection('rooms').update({'gameEndpoint': gameEndpoint}, {$inc: { activePlayers: num }}, {multi: false}, function (){});
}

exports.getRoom = function(callback) {
    db.collection('rooms').findOne({$where: "this.activePlayers < this.maxPlayers"}, function(err, doc){
        callback(doc);
    });
}

exports.getServer = function(callback) {
    db.collection('gameServers').aggregate(
        [
          {
             $project: {
                endpoint: 1,
                numberOfRooms: { $size: "$roomIds" }
             }
          }
        ]
    ).sort({numberOfRooms:1}, function(err, docs) {
        callback(docs);
    });
}

exports.db = db