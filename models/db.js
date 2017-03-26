// Connection URL
var conf=require("../settings");
var url = conf.database.url;

var mongojs = require('mongojs');
var db = mongojs(url, ['gamerServers']);

exports.insertDoc = function(collectionName, doc) {
    db.collection(collectionName).insert(doc, function(){});
};

exports.deleteDoc = function(collectionName, doc) {
    db.collection(collectionName).remove(doc, function(){});
};

exports.registerRoom = function(serverEndpoint, gameEndpoint) {
    db.collection('gamerServers').update({endpoint:serverEndpoint},
        {$push: { roomIds: gameEndpoint }}, {multi: false}, function (){});
    insertDoc('rooms', {'serverEndpoint':serverEndpoint, 'gameEndpoint':gameEndpoint});
}

exports.unRegisterRoom = function(gameEndpoint) {
    db.collection('rooms').findOne({'gameEndpoint':gameEndpoint}, function(err, doc) {
        db.collection('gamerServers').update({endpoint:doc.serverEndpoint},
            {$pull: { roomIds: gameEndpoint }}, {multi: false}, function (){});
        deleteDoc('rooms', doc);
    });

}

exports.unRegisterGameServer = function(serverEndpoint) {
    db.collection('gamerServers').findOne({'endpoint':serverEndpoint}, function(err, doc) {
        for (var id : doc.roomIds) {
            deleteDoc('rooms', {'gameEndpoint':id});
        }
        deleteDoc('gameServers', {'endpoint':serverEndpoint});
    }); 
}
