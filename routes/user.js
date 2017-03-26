var express = require('express');
var router = express.Router();
var randomGen = require("../utils/randomGen");
var request=require("request");

var conf=require("../settings");

router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});

router.post('/quickgame', function(req, res){
  // console.log(req.body.name);
  // var token = encodeURIComponent(randomGen.GenerateUUID(16));
  var token = encodeURIComponent(req.body.name);
  res.redirect('playground#token='+token);
});

router.get('/playground', function(req, res){
  res.sendFile('playground.html', {
        root: './public/'
    }, function(err) {
        if (err) {
            console.log(err);
        }
    });
});
exports.r = router;