var express = require('express');
var router = express.Router();
var request=require("request");
// var passport = require('passport');
// var User = require('../models/user')

var randomGen = require("../utils/randomGen");
var userdb = require("../models/userdb");

var conf=require("../settings");

var crypto = require('crypto');

router.get('/', function(req, res, next) {
    res.render('index', { title: 'Enclosure.io' });
});

router.get('/play', function(req, res){
  res.sendFile('play.html', {
        root: './public/'
    }, function(err) {
        if (err) {
            console.log(err);
        }
    });
});

router.post('/quickgame', function(req, res){
    // console.log(req.body.name);
    // var token = encodeURIComponent(randomGen.GenerateUUID(16));
    var token = encodeURIComponent(req.body.name);
    res.redirect('../playground#token='+token);
});

router.get('/register', function(req, res) {
    res.render('register', {});
});

router.post('/register', function(req, res) {
    if (!req.body.password || !req.body.email || !req.body.username){
        res.render('register', {error: 'Email, username and password are required.'});
    }
    if (req.body.password !== req.body.confirmPwd){
        res.render('register', {error: 'The passwords do not match.'});
    }

    var pwd = encrypt(req.body.password);

    userdb.findAccount(req.body.email, function(err, doc) {
        if (doc == null){
            userdb.storeAccount(req.body.email, 
                req.body.username, req.body.password, function(){});
            req.session.authenticated = true;
            res.redirect('/play?email='+encodeURIComponent(req.body.email));
        } else{
            res.render('register', {error: 'The email is already taken.'});
        }
    });
});

router.get('/login', function(req, res) {
    res.render('home', {user : req.user});
});

router.post('/login', function(req, res) {
    if (!req.body.password || !req.body.email){
        res.render('register', {error: 'Email and password are required.'});
    }

    var pwd = encrypt(req.body.password);
    userdb.findAccount(req.body.email, function(err, doc) {
        if (doc != null){
            if (doc.password !== pwd){
                res.render('home', {error: 'Invalid password'});
            }
            else{
                // authentication
                req.session.authenticated = true;
                res.redirect('/play?email='+encodeURIComponent(req.body.email));
            }
        } else{
            res.render('home', {error: 'Email account not exists.'});
            // not sure what these mean
            // req.flash('error', 'Username and password are incorrect');
            // res.redirect('/login');
        }
    });
});

// TODO
router.get('/profile', function(req, res) {
    res.render('index', { title: 'Enclosure.io' });
});

// TODO
router.get('/friends', function(req, res) {
    res.render('index', { title: 'Enclosure.io' });
});

router.get('/logout', function(req, res) {
    delete req.session.authenticated;
    res.redirect('../');
});

function encrypt(password){
    return crypto.createHash('sha256').update(password).digest('base64');
}

exports.r = router;
