var express = require('express');
var router = express.Router();

var request=require("request");

var conf=require("../settings");
var Lock=require("../utils/lock");
var db=require("../models/db");


var list={};

router.post('/register', function(req, res) {
    if (req.body.secret!==conf.server.masterSecret) {
        res.status(403).send("Invalid secret.");
        return;
    }
    console.log("Registered: "+req.body.endpoint);

    db.insertDoc('gameServers', {endpoint:req.body.endpoint, token:req.body.token, roomIds:[]});
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
    db.deleteDoc('gameServers', {endpoint:req.body.endpoint});
    delete list[req.body.endpoint];
    res.send("OK.");

});

router.get('/getserver', function(req, res) {
    mutex.Lock(function() {
        db.getRoom(function(room){
            if (room == null) {
                // create a new room
                db.getServer(function(servers){
                    if (servers == null) {
                        res.status(503).send("No gameserver available");
                        mutex.Unlock();
                        return;
                    }
                    availableServer = servers[0].endpoint;
                    request.post(availableServer+"/newserver", {form: {
                        token: list[availableServer],
                    }}, function(err, response, body) {
                        if (err || Math.floor(response.statusCode/100)!==2) {
                            mutex.Unlock();
                            res.status(503).send("Game server fail to create server.");
                            return;
                        }
                        // add ws to db
                        db.registerRoom(availableServer, body);
                        res.send(body);
                        mutex.Unlock();
                        return;
                    });
                });
            } else {
                // assign this room to user
                db.updatePlayerNum(room.gameEndpoint, 1);
                mutex.Unlock();
                res.send(room.gameEndpoint);
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
            return;
        }
        db.unregisterRoom(req.body.gameEndpoint);
        mutex.Unlock();
    });
});

exports.r = router;
exports.serverlist=list;
