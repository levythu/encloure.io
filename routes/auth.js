var express = require('express');
var router = express.Router();
var url = require('url')

var tokens = require('./user').tokens;

router.get('/', function(req, res) {
    var urlParts = url.parse(req.url, true);
    res.send(JSON.stringfy(tokens[urlParts.query.token]));
    return;
});

module.exports = router;
