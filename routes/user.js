var express = require('express');
var router = express.Router();
var path = require('path');


var request=require("request");

var conf=require("../settings");
/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});

//===============ROUTES=================
//displays our homepage
router.post('/quickgame', function(req, res){
  console.log(req.body.name);
  res.render('playground', {name: req.body.name})
  // res.sendFile("playground.html",{
  //       root: './public/',
  //       name: req.body.name
  //   }, function(err) {
  //       if (err) {
  //           console.log(err);
  //       }
  //   });
});
exports.r = router;
