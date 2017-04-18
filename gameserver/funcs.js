var express = require('express');
var router = express.Router();

var gm=require("./gamemanager");
var conf=require("../settings");

/* GET home page. */
router.get('/', function(req, res) {
    res.send("Gameserver service.");
});

// Method: POST /newserver
// Args: [token] - In body form, the token passed when game server registered
//       [roomMap] - In body form, the stringfied version of JSON, the format is equal to conf.game.defaultMap
//                   and by default the server will use conf.game.defaultMap
//       [player] -  In body form, the stringfied version of JSON, the format is equal to conf.game.player
//                   and by default the server will use conf.game.player
router.post('/newserver', function(req, res) {
    if (req.body.token!==gm.token) {
        res.status(403).send("Invalid token.");
        return;
    }
    var roomMap=conf.game.defaultMap;
    if ('roomMap' in req.body) {
        try {
            roomMap=JSON.parse(req.body.roomMap);
        } catch (e) {
            res.status(400).send("Invalid roomMap configure.");
            return;
        }
    }
    var player=conf.game.player;
    if ("player" in req.body) {
        try {
            player=JSON.parse(req.body.player);
        } catch (e) {
            res.status(400).send("Invalid player configure.");
            return;
        }
    }
    gm.LaunchGame(function(gamepoint, theserver) {
        if ("roomId" in req.body) {
            theserver.g.roomId=req.body.roomId;
        }
        res.send(gamepoint);
    }, roomMap, player);
});

module.exports = router;
