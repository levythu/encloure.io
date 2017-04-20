// Connection URL
var conf = require("../settings");
var assert = require("assert");
var url = conf.database.url;

var mongojs = require('mongojs');
var db = mongojs(url, ['gameServers', 'rooms', 'users', 'gameHistory', 'maps']);

exports.insertDoc = function(collectionName, doc) {
    db.collection(collectionName).insert(doc, function() {});
};

exports.deleteDoc = function(collectionName, doc) {
    db.collection(collectionName).remove(doc, function() {});
};

exports.registerRoom = function(serverEndpoint, gameEndpoint, mapDoc, roomId) {
    db.collection('gameServers').update({
            endpoint: serverEndpoint
        }, {
            $push: {
                roomIds: gameEndpoint
            }
        }, {
            multi: false
        },
        function() {});

    db.collection('rooms').insert({
        roomId: roomId,
        serverEndpoint: serverEndpoint,
        gameEndpoint: gameEndpoint,
        maxPlayers: mapDoc.MaxPlayer,
        activePlayers: 0,
        map: mapDoc,
    }, function() {});
}

exports.unregisterRoom = function(gameEndpoint) {
    db.collection('rooms').findOne({
            'gameEndpoint': gameEndpoint
        },
        function(err, doc) {
            if (doc != null) {
                db.collection('gameServers').update({
                        endpoint: doc.serverEndpoint
                    }, {
                        $pull: {
                            roomIds: gameEndpoint
                        }
                    }, {
                        multi: false
                    },
                    function() {});
                db.collection('rooms').remove(doc, function() {});
            }
        });
}

exports.unregisterGameServer = function(serverEndpoint) {
    db.collection('gameServers').findOne({
        'endpoint': serverEndpoint
    }, function(err, doc) {
        for (var id in doc.roomIds) {
            db.collection('rooms').remove({
                    'gameEndpoint': doc.roomIds[id]
                },
                function() {});
        }
        db.collection('gameServers').remove({
                'endpoint': serverEndpoint
            },
            function() {});
    });
}

exports.updatePlayerNum = function(gameEndpoint, abs) {
    db.collection('rooms').update({
        gameEndpoint: gameEndpoint
    }, {
        $set: {
            activePlayers: parseInt(abs)
        }
    }, {
        multi: false
    }, function() {});
}

exports.persistGameHistory = function(doc) {
    db.collection('gameHistory').insert(doc, function() {});
}

exports.getAvailableRooms = function(callback) {
    db.collection('rooms').find({
        $where: "this.activePlayers < this.maxPlayers"
    }, callback);
}

exports.getRoomWithId = function(roomId, callback) {
    db.collection('rooms').findOne({
            roomId: parseInt(roomId)
        },
        callback
    );
}

exports.getMapWithEndpoint = function(endpoint, callback) {
    db.collection('rooms').findOne({
        gameEndpoint: endpoint
    }, function(err, doc) {
        callback(doc.map.name);
    });
}

exports.getAllRooms = function(callback) {
    db.collection('rooms').find(callback);
}

exports.getAllMaps = function(callback) {
    db.collection('maps').find(callback);
}

exports.getMapWithName = function(name, callback) {
    db.collection('maps').findOne({
        name: name
    }, callback);
}

exports.getPersonalBests = function(email, callback) {
    db.collection('maps').find(function(err, maps) {
        assert.equal(null, err);
        var result = [];
        var counter = 0;
        for (var i in maps) {
            var item = {
                name: maps[i].name,
                number: 999,
                percentage: "12%",
                time: "12:23",
            };
            result.push(item);
            (function(i) {
                db.collection('gameHistory').find({
                    $and: [{
                        email: email
                    }, {
                        map: maps[i].name
                    }]
                }).sort({
                    percentage: -1
                }).limit(1, function(err, items) {
                    assert.equal(null, err);
                    counter += 1;
                    if (items.length === 0) {
                        result[i].percentage = "N/A";
                    } else {
                        result[i].percentage = Math.floor(items[0].percentage * 1000) / 10 + "%";
                    }
                    if (counter === 3 * maps.length) {
                        callback(result);
                    }
                });
                db.collection('gameHistory').find({
                    $and: [{
                        email: email
                    }, {
                        map: maps[i].name
                    }]
                }).sort({
                    time: -1
                }).limit(1, function(err, items) {
                    assert.equal(null, err);
                    counter += 1;
                    if (items.length === 0) {
                        result[i].time = "N/A";
                    } else {
                        result[i].time = msToTime(items[0].time);
                    }
                    if (counter === 3 * maps.length) {
                        callback(result);
                    }
                });
                db.collection('gameHistory').find({
                    $and: [{
                        email: email
                    }, {
                        map: maps[i].name
                    }]
                }).sort({
                    kill: -1
                }).limit(1, function(err, items) {
                    assert.equal(null, err);
                    counter += 1;
                    if (items.length === 0) {
                        result[i].number = "N/A";
                    } else {
                        result[i].number = items[0].kill;
                    }
                    if (counter === 3 * maps.length) {
                        callback(result);
                    }
                });
            })(i);
        }
    });
}

exports.getHighScores = function(mapname, callback) {
    var killer = [];
    var enclosure = [];
    var survivor = [];
    var counter = 0;
    var highScore = {
        killer: [],
        enclosure: [],
        survivor: []
    };
    var thisCallback = function() {
        var emailList = [];
        var tempList = killer.concat(enclosure).concat(survivor);
        for (var i in tempList) {
            emailList.push(tempList[i].email);
        }
        db.collection('users').find({
            'email': {
                $in: emailList
            }
        }, function(err, items) {
            assert.equal(null, err);
            for (var i in killer) {
                highScore.killer.push({
                    name: items.find(x => x.email === killer[i].email).username,
                    number: killer[i].kill
                })
            }
            for (var i in survivor) {
                highScore.survivor.push({
                    name: items.find(x => x.email === survivor[i].email).username,
                    number: msToTime(survivor[i].time)
                })
            }
            for (var i in enclosure) {
                highScore.enclosure.push({
                    name: items.find(x => x.email === enclosure[i].email).username,
                    number: Math.floor(enclosure[i].percentage * 1000) / 10 + "%"
                })
            }
            if (highScore.killer.length === 0) {
                highScore.killer.push({
                    name: "N/A",
                    number: "N/A"
                })
            }
            if (highScore.survivor.length === 0) {
                highScore.survivor.push({
                    name: "N/A",
                    number: "N/A"
                })
            }
            if (highScore.enclosure.length === 0) {
                highScore.enclosure.push({
                    name: "N/A",
                    number: "N/A"
                })
            }
            callback(highScore);
        });
    }

    db.collection('gameHistory').find({
        'map': mapname
    }).sort({
        percentage: -1
    }).limit(3, function(err, items) {
        assert.equal(null, err);
        counter += 1;
        enclosure = items;
        if (counter == 3) {
            thisCallback();
        }
    });

    db.collection('gameHistory').find({
        'map': mapname
    }).sort({
        time: -1
    }).limit(3, function(err, items) {
        assert.equal(null, err);
        counter += 1;
        survivor = items;
        if (counter == 3) {
            thisCallback();
        }
    });

    db.collection('gameHistory').find({
        'map': mapname
    }).sort({
        kill: -1
    }).limit(3, function(err, items) {
        assert.equal(null, err);
        counter += 1;
        killer = items;
        if (counter == 3) {
            thisCallback();
        }
    });
}

exports.getMoreScores = function(mapname, type, callback) {
    var choose = {};
    choose[type] = -1;
    db.collection('gameHistory').find({
        'map': mapname
    }).sort(choose).limit(100, function(err, items) {
        assert.equal(null, err);
        if (items.length === 0) {
            var result = [{
                name: "N/A",
                number: "N/A"
            }]
            callback(result);
        }
        var emailList = [];
        for (var i in items) {
            emailList.push(items[i].email);
        }
        db.collection('users').find({
            'email': {
                $in: emailList
            }
        }, function(err, names) {
            assert.equal(null, err);
            var result = [];
            for (var i in items) {
              var num = items[i][type];
              if (type == 'time') {
                num = msToTime(items[i][type]);
              } else if (type === 'percentage') {
                num = Math.floor(items[i][type] * 1000) / 10 + "%"
              }
                result.push({
                    name: names.find(x => x.email == items[i].email).username,
                    number: num,
                })
            }
            callback(result);
        })
    })
}

// TODO sort with activePlayers or better sorting
exports.getServer = function(callback) {
    db.collection('gameServers').aggregate(
        [{
            $project: {
                endpoint: 1,
                token: 1,
                numberOfRooms: {
                    $size: "$roomIds"
                }
            }
        }]
    ).sort({
        numberOfRooms: 1
    }, callback);
}

// from milisseconds to time format, credit to http://stackoverflow.com/questions/9763441/milliseconds-to-time-in-javascript
function msToTime(s) {
    var ms = s % 1000;
    s = (s - ms) / 1000;
    var secs = s % 60;
    s = (s - secs) / 60;
    var mins = s % 60;
    var hrs = (s - mins) / 60;

    var ret = (mins < 10 ? "0" + mins : mins) + ':' + (secs < 10 ? "0" + secs : secs);
    if (hrs > 0) ret = hrs + ':' + ret;

    return ret
}
exports.db = db
