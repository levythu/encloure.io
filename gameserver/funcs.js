var express = require('express');
var router = express.Router();

var gm=require("./gamemanager");

/* GET home page. */
router.get('/', function(req, res) {
    res.send("Gameserver service.");
});

router.post('/newserver', function(req, res) {
    if (req.body.token!==gm.token) {
        res.status(403).send("Invalid token.");
        return;
    }
    gm.LaunchGame(function(gamepoint) {
        res.send(gamepoint);
    });
});

module.exports = router;
