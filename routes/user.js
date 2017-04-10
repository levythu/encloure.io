var express = require('express');
var router = express.Router();
var request=require("request");

var randomGen = require("../utils/randomGen");
var userdb = require("../models/userdb");

var conf=require("../settings");

var crypto = require('crypto');
var validator = require('validator');

var tokens = {}

var loggedinUsers = {}

router.get('/', function(req, res, next) {
    if (req.session.author == undefined){
        res.redirect('./login');
        return;
    } else{
        res.redirect('./play');
        return;
    }
});

router.get('/play', function(req, res){
    if (req.session.author == undefined){
        res.redirect('./login');
        return;
    }
    if (req.session.author in loggedinUsers){
        res.render('play', {
            username: loggedinUsers[req.session.author].username
        });
        return;
    } else {
        delete loggedinUsers[req.session.author];
        req.session.author = undefined;
        res.redirect('/error');
        return;
    }
    // userdb.findAccount(req.session.author, function(err, doc) {
    //     if (doc == null){
    //         req.session.author = undefined;
    //         res.redirect('/error');
    //         return;
    //     } else{
    //         res.render('play', {username: doc.username});
    //         return;
    //     }
    // });
});

router.get('/quickgame', function(req, res){
    if (req.session.author == undefined){
        res.redirect('./login');
        return;
    }
    if (req.session.author in loggedinUsers){
        var username = loggedinUsers[req.session.author].username;
        var token = randomGen.GenerateUUID(16);
        var type = "user";
        tokens[token] = {'email': req.session.author,
                        'username': username};
        res.redirect('/playground#token='+token+'&type='+type);
        return;
    } else {
        delete loggedinUsers[req.session.author];
        req.session.author = undefined;
        res.redirect('/error');
        return;
    }
    // userdb.findAccount(req.session.author, function(err, doc) {
    //     if (doc == null){
    //         req.session.author = undefined;
    //         res.redirect('/error');
    //         return;
    //     } else{
    //         var token = randomGen.GenerateUUID(16);
    //         var type = "user";
    //         tokens[token] = {'email': doc.email,
    //                         'username': doc.username};
    //         res.redirect('/playground#token='+token+'&type='+type);
    //         return;
    //     }
    // });
});

router.get('/createroom', function(req, res){
    if (req.session.author == undefined){
        res.redirect('./login');
        return;
    }
    if (req.session.author in loggedinUsers){
        res.render('createroom');
        return;
    } else {
        delete loggedinUsers[req.session.author];
        req.session.author = undefined;
        res.redirect('/error');
        return;
    }
    // userdb.findAccount(req.session.author, function(err, doc) {
    //     if (doc == null){
    //         req.session.author = undefined;
    //         res.redirect('/error');
    //         return;
    //     } else{
    //         res.render('createroom');
    //         return;
    //     }
    // });
});

router.get('/register', function(req, res) {
    res.render('register', {});
    return;
});

router.post('/register', function(req, res) {
    errors = []
    var pwd = encrypt(req.body.password1);
    if (req.session.author in loggedinUsers){
        errors.push('The email is already taken.');
        res.render('register', {errors: errors});
        return;
    }
    userdb.findAccount(req.body.email, function(err, doc) {
        if (doc == null){
            if (!req.body.password1 || !req.body.password2 || !req.body.email || !req.body.username){
                errors.push('Email, username and password are required.');
            }

            if (!validator.isEmail(req.body.email)){
                errors.push('The email is not valid.');
            }

            if (req.body.password1 !== req.body.password2){
                errors.push('The passwords do not match.');
            }

            if (errors.length != 0){
                res.render('register', {errors: errors});
                return
            }

            userdb.storeAccount(req.body.email, 
                req.body.username, pwd, function(){});
            req.session.author = req.body.email;
            loggedinUsers[req.session.author] = {
                'email': req.session.author,
                'username': req.body.username
            };

            res.redirect('./play');
            return;
        } else{
            errors.push('The email is already taken.');
            res.render('register', {errors: errors});
            return;
        }
    });
});

router.get('/login', function(req, res) {
    res.render('home', {user : req.user});
    return;
});

router.post('/login', function(req, res) {
    errors = []
    if (!req.body.password || !req.body.email){
        errors.push('Email and password are required.');
        res.render('home', {errors: errors});
        return;
    }

    var pwd = encrypt(req.body.password);
    userdb.findAccount(req.body.email, function(err, doc) {
        if (doc != null){
            if (doc.password !== pwd){
                errors.push('Invalid password');
                res.render('home', {errors: errors});
                return;
            }
            else{
                // authentication
                req.session.author = req.body.email;
                loggedinUsers[req.session.author] = {
                    'email': doc.email,
                    'username': doc.username
                };
                res.redirect('./play');
                return;
            }
        } else{
            errors.push('Email account does not exist.');
            res.render('home', {errors: errors});
            return;
        }
    });
});

router.get('/profile', function(req, res) {
    if (req.session.author == undefined){
        res.redirect('./login');
        return;
    }
    if (req.session.author in loggedinUsers){
        var username = loggedinUsers[req.session.author].username;
        res.render('profile', {
            username: username, 
            email: req.session.author
        });
        return;
    } else {
        delete loggedinUsers[req.session.author];
        req.session.author = undefined;
        res.redirect('/error');
        return;
    }
    // userdb.findAccount(req.session.author, function(err, doc) {
    //     if (doc == null){
    //         req.session.author = undefined;
    //         res.redirect('/error');
    //         return;
    //     } else{
    //         res.render('profile', {
    //             username: doc.username, 
    //             email: doc.email
    //         });
    //         return;
    //     }
    // });
});

router.post('/profile', function(req, res) {
    if (req.session.author == undefined){
        res.redirect('./login');
        return;
    }
    if (req.session.author in loggedinUsers){
        userdb.updateAccount(doc.email, 
            req.body.username, function(err, doc, lastErrorObject){

            loggedinUsers[req.session.author].username = doc.username;
            res.render('profile', {
                username: doc.username, 
                email: doc.email
            });
            return;
        });
        return;
    } else {
        delete loggedinUsers[req.session.author];
        req.session.author = undefined;
        res.redirect('/error');
        return;
    }
    // userdb.findAccount(req.session.author, function(err, doc) {
    //     if (doc == null){
    //         req.session.author = undefined;
    //         res.redirect('/error');
    //         return;
    //     } else{
    //         userdb.updateAccount(doc.email, 
    //             req.body.username, function(err, newDoc, lastErrorObject){
    //             res.render('profile', {
    //                 username: newDoc.username, 
    //                 email: newDoc.email
    //             });
    //             return;
    //         });
    //     }
    // });
    return;
});

// TODO
router.get('/friends', function(req, res) {
    if (req.session.author == undefined){
        res.redirect('./login');
        return;
    }
    res.render('index', { title: 'Enclosure.io' });
    return;
});

router.get('/logout', function(req, res) {
    delete loggedinUsers[req.session.author];
    req.session.author = undefined;
    res.redirect('../');
    return;
});

function encrypt(password){
    return crypto.createHash('sha256').update(password).digest('base64');
}

exports.r = router;

exports.tokens = tokens;
