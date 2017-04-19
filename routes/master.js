var express = require('express');
var router = express.Router();

var request=require("request");

var conf=require("../settings");
var Lock=require("../utils/lock");
var db=require("../models/db");
var user=require("./user");


var list={};

router.post('/register', function(req, res) {
    if (req.body.secret!==conf.server.masterSecret) {
        res.status(403).send("Invalid secret.");
        return;
    }
    console.log("Registered: "+req.body.endpoint);

    db.insertDoc('gameServers', {
        endpoint:req.body.endpoint,
        token:req.body.token,
        roomIds:[]
    });
    list[req.body.endpoint]=req.body.token;
    res.send("OK.");
});

// this is a temp behavior
var mutex=new Lock();
router.post('/unregister', function(req, res) {
    console.log(req.body);
    if (req.body.secret!==conf.server.masterSecret) {
        res.status(403).send("Invalid secret.");
        return;
    }
    db.unregisterGameServer(req.body.endpoint);
    delete list[req.body.endpoint];
    res.send("OK.");

});

// TODO: refractor /getserver and /createroom
router.get('/getserver', function(req, res) {
    mutex.Lock(function() {
        db.getAvailableRooms(function(err, rooms){
            // Either no room or all rooms are full
            if (rooms.length == 0 || 'forcecreate' in req.query) {
                // create a new room
                db.getServer(function(err, servers){
                    if (servers.length == 0) {
                        res.status(503).send("No gameserver available");
                        mutex.Unlock();
                        return;
                    }
                    console.log(servers);

                    db.getAllRooms(function(err, roomDocs) {

                        var roomId = 0
                        if (roomDocs != null){
                            for (var i = 0; i < roomDocs.length; i++){
                                if (roomDocs[i].roomId > roomId){
                                    roomId = roomDocs[i].roomId;
                                }
                            }
                        }
                        roomId++;
                        availableServer = servers[0].endpoint;
                        list[availableServer] = servers[0].token;
                        request.post(availableServer+"/newserver", {form: {
                            token: list[availableServer],
                            roomId: roomId,
                        }}, function(err, response, body) {
                            if (err || Math.floor(response.statusCode/100)!==2) {
                                mutex.Unlock();
                                res.status(503).send("Game server fail to create server.");
                                return;
                            }
                            // add ws to db
                            db.registerRoom(availableServer, body, conf.game.defaultMap, roomId);
                            res.send(body);
                            mutex.Unlock();
                            return;
                        });
                    });
                });
            } else {
                // assign this room to user
                mutex.Unlock();
                res.send(rooms[Math.floor(Math.random()*rooms.length)].gameEndpoint);
                return;
            }

        });
    });
});

router.post('/unregisterRoom', function(req, res){
    mutex.Lock(function() {
        console.log(req.body);
        if (req.body.secret!==conf.server.masterSecret) {
            res.status(403).send("Invalid secret.");
            mutex.Unlock();
            return;
        }
        db.unregisterRoom(req.body.gameEndpoint);
        res.send("");
        mutex.Unlock();
    });
});

router.post('/updatePlayerNum', function(req, res) {
    mutex.Lock(function() {
        if (req.body.secret!==conf.server.masterSecret) {
            res.status(403).send("Invalid secret.");
            mutex.Unlock();
            return;
        }
        db.updatePlayerNum(req.body.endpoint, req.body.abs);
        res.send("");
        mutex.Unlock();
        return;
    });
});

router.post('/persistGameHistory', function(req,res) {
  mutex.Lock(function() {
    if (req.body.secret!==conf.server.masterSecret) {
        res.status(403).send("Invalid secret.");
        mutex.Unlock();
        return;
    }
    // verify user
    if (req.body.token in user.tokens) {
      db.persistGameHistory({
        email : user.tokens[req.body.token].email,
        percentage : req.body.percentage,
        kill : req.body.kill,
        map : req.body.map,
        time : req.body.time,
      });
    } else {
      res.status(403).send("Invalid user token.");
    }
    mutex.Unlock();
    res.send("ok.");
    return;
  });
});
router.post('/createroom', function(req, res){

    mutex.Lock(function() {
        db.getServer(function(err, servers){
            if (servers.length == 0) {
                res.status(503).send("No gameserver available");
                mutex.Unlock();
                return;
            }
            availableServer = servers[0].endpoint;
            var mapName = req.body.map.toLowerCase().replace(" ", "_");

            db.getMapWithName(mapName, function(err, mapDoc){

                db.getAllRooms(function(err, roomDocs) {

                    var roomId = 0
                    if (roomDocs != null){
                        for (var i = 0; i < roomDocs.length; i++){
                            if (roomDocs[i].roomId > roomId){
                                roomId = roomDocs[i].roomId;
                            }
                        }
                    }
                    roomId++;

                    list[availableServer] = servers[0].token;
                    request.post(availableServer+"/newserver", {form: {
                        token:      list[availableServer],
                        roomMap:    JSON.stringify(mapDoc),
                        player:     JSON.stringify({
                                        'sprintCD': parseInt(req.body.sprintCD) * conf.game.RPS,
                                        'sprintDistance': parseInt(req.body.sprintDistance),
                                        'speed': conf.game.player.speed,
                                        'standingFrame' : conf.game.player.standingFrame,
                                    }),
                        roomId:     roomId
                    }}, function(err, response, body) {
                        if (err || Math.floor(response.statusCode/100)!==2) {
                            mutex.Unlock();
                            res.status(503).send("Game server fail to create server.");
                            return;
                        }

                        // add ws to db
                        db.registerRoom(availableServer, body, mapDoc, roomId);
                        res.send(body);
                        mutex.Unlock();
                        return;
                    });
                });
            });
        });
    });
});

exports.r = router;
exports.serverlist=list;
