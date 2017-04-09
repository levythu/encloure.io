var express = require('express');
var router = express.Router();
var url = require('url')

var tokens = require('./user').tokens;

router.get('/', function(req, res) {
    var urlParts = url.parse(req.url, true);
    if (urlParts.query.token in tokens){
        res.send(JSON.stringify(tokens[urlParts.query.token]));
        return;
    }
    else{
        ret = {"error" : "invalid token"};
        res.send(JSON.stringify(ret));
        return;
    }
});

module.exports = router;
