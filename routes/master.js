var express = require('express');
var router = express.Router();

var request=require("request");

var conf=require("../settings");
var Lock=require("../utils/lock");

var list={};

router.post('/register', function(req, res) {
    console.log(req.body);
    if (req.body.secret!==conf.server.masterSecret) {
        res.status(403).send("Invalid secret.");
        return;
    }

    list[req.body.endpoint]=req.body.token;
    res.send("OK.");
});

// this is a temp behavior
var theserverEndpoint=null;
var mutex=new Lock();
router.get('/getserver', function(req, res) {
    mutex.Lock(function() {
        if (theserverEndpoint==null) {
            var availableServer=null;
            for (var i in list) {
                availableServer=i;
                break;
            }
            if (availableServer==null) {
                res.status(503).send("No gameserver available");
                mutex.Unlock();
                return;
            }
            request.post(availableServer+"/newserver", {form: {
                token: list[availableServer],
            }}, function(err, response, body) {
                if (err || Math.floor(response.statusCode/100)!==2) {
                    mutex.Unlock();
                    res.status(503).send("Game server fail to create server.");
                    return;
                }
                theserverEndpoint=body;
                res.send(theserverEndpoint);
                mutex.Unlock();
                return;
            });
        } else {
            mutex.Unlock();
            res.send(theserverEndpoint);
            return;
        }
    });
});

exports.r = router;
exports.serverlist=list;
