var express = require('express');
var router = express.Router();
var request=require("request");
var url = require('url');

var randomGen = require("../utils/randomGen");
var userdb = require("../models/userdb");

var conf=require("../settings");

var crypto = require('crypto');

router.get('/', function(req, res, next) {
    res.render('index', { title: 'Enclosure.io' });
});

router.get('/play', function(req, res){
    var urlParts = url.parse(req.url, true);
    console.log(urlParts);
    if (urlParts.query.email != undefined){
        var email = urlParts.query.email;
    }
    else{
        var email = req.session.author;
    }
    userdb.findAccount(email, function(err, doc) {
        if (doc == null){
            req.session.author = undefined;
            res.redirect('/error');
            return;
        } else{
            res.render('play', {username: doc.username});
            return;
        }
    });
});

router.post('/quickgame', function(req, res){
    var token = encodeURIComponent(req.session.author);
    var type = "quickgame";
    res.redirect('/playground#token='+token+'&type='+type);
});

router.get('/register', function(req, res) {
    res.render('register', {});
    return;
});

router.post('/register', function(req, res) {
    if (!req.body.password1 || !req.body.password2 || !req.body.email || !req.body.username){
        res.render('register', {error: 'Email, username and password are required.'});
        return;
    }
    if (req.body.password1 !== req.body.password2){
        res.render('register', {error: 'The passwords do not match.'});
        return;
    }

    var pwd = encrypt(req.body.password1);

    userdb.findAccount(req.body.email, function(err, doc) {
        if (doc == null){
            userdb.storeAccount(req.body.email, 
                req.body.username, pwd, function(){});
            req.session.author = req.body.email;
            res.redirect('./play?email='+encodeURIComponent(req.body.email));
            return;
        } else{
            res.render('register', {error: 'The email is already taken.'});
            return;
        }
    });
});

router.get('/login', function(req, res) {
    res.render('home', {user : req.user});
    return;
});

router.post('/login', function(req, res) {
    if (!req.body.password || !req.body.email){
        res.render('home', {error: 'Email and password are required.'});
                return;
    }

    var pwd = encrypt(req.body.password);
    userdb.findAccount(req.body.email, function(err, doc) {
        if (doc != null){
            if (doc.password !== pwd){
                res.render('home', {error: 'Invalid password'});
                return;
            }
            else{
                // authentication
                req.session.author = req.body.email;
                res.redirect('./play');
                return;
            }
        } else{
            res.render('home', {error: 'Email account not exists.'});
            return;
        }
    });
});

// TODO
router.get('/profile', function(req, res) {
    userdb.findAccount(req.session.author, function(err, doc) {
        if (doc == null){
            req.session.author = undefined;
            res.redirect('/error');
            return;
        } else{
            res.render('profile', {username: doc.username});
            return;
        }
    });
    return;
});

// TODO
router.get('/friends', function(req, res) {
    res.render('index', { title: 'Enclosure.io' });
    return;
});

router.get('/logout', function(req, res) {
    req.session.author = undefined;
    res.redirect('../');
    return;
});

function encrypt(password){
    return crypto.createHash('sha256').update(password).digest('base64');
}

exports.r = router;
