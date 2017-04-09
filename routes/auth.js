var express = require('express');
var router = express.Router();
var url = require('url')

var tokens = require('./user').tokens;

router.get('/', function(req, res) {
    var urlParts = url.parse(req.url, true);
    if (tokens[urlParts.query.token] != undefined){
        res.send(JSON.stringfy(tokens[urlParts.query.token]));
        return;
    }
    else{
        ret = {"error" : "invalid token"};
        res.send(JSON.stringfy(ret));
        return;
    }
});

module.exports = router;
