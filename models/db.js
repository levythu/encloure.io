// Connection URL
var conf=require("../settings");
var url = conf.database.url;

var mongojs = require('mongojs');
var db = mongojs(url, ['gameServers', 'rooms', 'users', 'gameHistory', 'maps']);

exports.insertDoc = function(collectionName, doc) {
    db.collection(collectionName).insert(doc, function(){});
};

exports.deleteDoc = function(collectionName, doc) {
    db.collection(collectionName).remove(doc, function(){});
};

exports.registerRoom = function(serverEndpoint, gameEndpoint, mapDoc, roomId) {
    db.collection('gameServers').update({
            endpoint: serverEndpoint
        }, {
            $push: { roomIds: gameEndpoint }
        }, {
            multi: false
        },
        function (){
    });

    db.collection('rooms').insert(
        {
            roomId:         roomId,
            serverEndpoint: serverEndpoint,
            gameEndpoint:   gameEndpoint,
            maxPlayers:     mapDoc.MaxPlayer,
            activePlayers:  0,
            map:            mapDoc,
        }, function(){
    });
}

exports.unregisterRoom = function(gameEndpoint) {
    db.collection('rooms').findOne(
        {
            'gameEndpoint':gameEndpoint
        },
        function(err, doc) {
            if (doc != null){
                db.collection('gameServers').update(
                    { endpoint:doc.serverEndpoint },
                    {
                        $pull: {
                            roomIds: gameEndpoint
                        }
                    },
                    { multi: false },
                    function (){});
                db.collection('rooms').remove(doc, function(){});
            }
    });
}

exports.unregisterGameServer = function(serverEndpoint) {
    db.collection('gameServers').findOne({'endpoint':serverEndpoint}, function(err, doc) {
        for (var id in doc.roomIds) {
            db.collection('rooms').remove(
                {'gameEndpoint':doc.roomIds[id]},
                function(){});
        }
        db.collection('gameServers').remove(
            {'endpoint':serverEndpoint},
            function(){});
    });
}

exports.updatePlayerNum = function(gameEndpoint, abs) {
    db.collection('rooms').update({
        gameEndpoint: gameEndpoint
    }, {
        $set: { activePlayers: parseInt(abs) }
    }, {
        multi: false
    }, function (){});
}

exports.persistGameHistory = function(doc) {
  db.collection('gameHistory').insert(doc, function(){});
}

exports.getAvailableRooms = function(callback) {
    db.collection('rooms').find(
    {
        $where: "this.activePlayers < this.maxPlayers"
    }, callback);
}

exports.getRoomWithId = function(roomId, callback) {
    db.collection('rooms').findOne(
        {roomId: parseInt(roomId)},
        callback
    );
}

exports.getMapWithEndpoint = function(endpoint, callback) {
  db.collection('rooms').findOne({gameEndpoint:endpoint}, function(err, doc){
    callback(doc.map.name);
  });
}

exports.getAllRooms = function(callback) {
    db.collection('rooms').find(callback);
}

exports.getAllMaps = function(callback) {
    db.collection('maps').find(callback);
}

exports.getMapWithName = function(name, callback){
    db.collection('maps').findOne(
        {name: name}, callback);
}

exports.getHighScores = function(mapname, callback) {
    db.collection('gameHistory').find({'map':mapname}).sort({percentage:-1}).limit(3)
}

// TODO sort with activePlayers or better sorting
exports.getServer = function(callback) {
    db.collection('gameServers').aggregate(
        [
            {
                 $project: {
                    endpoint: 1,
                    token: 1,
                    numberOfRooms: { $size: "$roomIds" }
                 }
            }
        ]
    ).sort({numberOfRooms:1}, callback);
}

exports.db = db
