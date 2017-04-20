var express = require('express');
var router = express.Router();
var request = require("request");
var url = require('url');

var randomGen = require("../utils/randomGen");
var userdb = require("../models/userdb");
var db = require("../models/db");

var conf = require("../settings");

var crypto = require('crypto');
var validator = require('validator');

var tokens = {}

var loggedinUsers = {}

router.get('/', function(req, res, next) {
    if (req.session.author == undefined) {
        res.redirect('./login');
        return;
    } else {
        res.redirect('./play');
        return;
    }
});

router.get('/play', function(req, res) {
    if (req.session.author == undefined) {
        res.redirect('./login');
        return;
    }
    if (req.session.author in loggedinUsers) {
        db.getAllRooms(function(err, docs) {
            // No available room
            if (docs.length == 0) {
                res.render('play', {
                    username: loggedinUsers[req.session.author].username,
                    rooms: undefined,
                });
                return;
            }

            rooms = [];
            fullrooms = [];
            //TODO: sort by activePlayers
            docs.sort(function(a, b) {
                if (a.roomId < b.roomId)
                    return -1;
                else if (a.roomId > b.roomId)
                    return 1;
                return 0;
            });
            for (var i in docs) {
                if (docs[i].activePlayers === docs[i].maxPlayers) {
                    fullrooms.push({
                        roomId: docs[i].roomId,
                        activePlayers: docs[i].activePlayers,
                        maxPlayers: docs[i].maxPlayers,
                        map: docs[i].map.displayName,
                    });
                } else {
                    rooms.push({
                        roomId: docs[i].roomId,
                        activePlayers: docs[i].activePlayers,
                        maxPlayers: docs[i].maxPlayers,
                        map: docs[i].map.displayName,
                    });
                }
            }
            rooms = rooms.concat(fullrooms);
            res.render('play', {
                username: loggedinUsers[req.session.author].username,
                rooms: rooms,
            });
            return;
        });
    } else {
        delete loggedinUsers[req.session.author];
        req.session.author = undefined;
        res.redirect('/error');
        return;
    }
});

router.get('/quickgame', function(req, res) {
    if (req.session.author == undefined) {
        res.redirect('./login');
        return;
    }
    if (req.session.author in loggedinUsers) {
        var username = loggedinUsers[req.session.author].username;
        var token = encodeURIComponent(randomGen.GenerateUUID(16));
        var type = "user";
        tokens[token] = {
            'email': req.session.author,
            'username': username
        };
        res.redirect('/playground#token=' + token + '&type=' + type);
        return;
    } else {
        delete loggedinUsers[req.session.author];
        req.session.author = undefined;
        res.redirect('/error');
        return;
    }
});

router.get('/createroom', function(req, res) {
    if (req.session.author == undefined) {
        res.redirect('./login');
        return;
    }
    if (req.session.author in loggedinUsers) {
        db.getAllMaps(function(err, docs) {
            if (docs == null) {
                res.render('createroom', {
                    username: loggedinUsers[req.session.author].username,
                });
                return;
            }

            maps = [];
            for (i in docs) {
                maps.push({
                    displayName: docs[i].displayName,
                    map: docs[i].map,
                    MapSize: docs[i].MapSize,
                    MaxPalyer: docs[i].MaxPalyer,
                });
            }
            res.render('createroom', {
                username: loggedinUsers[req.session.author].username,
                maps: maps,
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
});

router.post('/createroom', function(req, res) {
    if (req.session.author == undefined) {
        res.redirect('./login');
        return;
    }
    if (req.session.author in loggedinUsers) {
        request.post(conf.server.masterEndPoint + '/gm/createroom', {
            form: req.body
        }, function(err, response, body) {
            var username = loggedinUsers[req.session.author].username;
            var token = encodeURIComponent(randomGen.GenerateUUID(16));
            var type = "user";
            tokens[token] = {
                'email': req.session.author,
                'username': username
            };
            if (err || Math.floor(response.statusCode / 100) !== 2 || body == undefined) {
                res.redirect('/playground#token=' + token + '&type=' + type);
            } else {
                res.redirect('/playground#token=' + token + '&type=' + type + '&endpoint=' + body);
            }
            return;
        });
    } else {
        delete loggedinUsers[req.session.author];
        req.session.author = undefined;
        res.redirect('/error');
        return;
    }
    return;
});

router.get('/getroom', function(req, res) {
    if (req.session.author == undefined) {
        res.redirect('./login');
        return;
    }
    var roomId = req.query.roomId;

    if (req.session.author in loggedinUsers) {
        db.getRoomWithId(roomId, function(err, doc) {
            var username = loggedinUsers[req.session.author].username;
            var token = encodeURIComponent(randomGen.GenerateUUID(16));
            var type = "user";
            tokens[token] = {
                'email': req.session.author,
                'username': username
            };
            if (doc != undefined) {
                res.redirect('/playground#token=' + token + '&type=' + type + '&endpoint=' + doc.gameEndpoint);
            } else {
                // TODO: may need better handling.
                res.redirect('./play');
                // res.render('play', {
                //     username: loggedinUsers[req.session.author].username,
                //     error: 'The room does not exist.'
                // });
            }
            return;
        });
        return;
    } else {
        delete loggedinUsers[req.session.author];
        req.session.author = undefined;
        res.redirect('/error');
        return;
    }
});

router.get('/getmap', function(req, res) {
    if (req.session.author == undefined) {
        res.redirect('./login');
        return;
    }
    var query = req._parsedOriginalUrl.query;
    var mapName = query.split("=")[1];

    if (req.session.author in loggedinUsers) {
        db.getMapWithName(mapName, function(err, doc) {
            if (doc == null) {
                res.send("no map");
                return;
            }
            res.send(doc.map);
            return;
        });
        return;
    } else {
        delete loggedinUsers[req.session.author];
        req.session.author = undefined;
        res.redirect('/error');
        return;
    }
});

router.get('/register', function(req, res) {
    res.render('register', {});
    return;
});

router.post('/register', function(req, res) {
    errors = []
    var pwd = encrypt(req.body.password1);
    if (req.session.author in loggedinUsers) {
        errors.push('The email is already taken.');
        res.render('register', {
            errors: errors
        });
        return;
    }
    userdb.findAccount(req.body.email, function(err, doc) {
        if (doc == null) {
            if (!req.body.password1 || !req.body.password2 || !req.body.email || !req.body.username) {
                errors.push('Email, username and password are required.');
            }

            if (!validator.isEmail(req.body.email)) {
                errors.push('The email is not valid.');
            }

            if (req.body.password1 !== req.body.password2) {
                errors.push('The passwords do not match.');
            }

            if (errors.length != 0) {
                res.render('register', {
                    errors: errors
                });
                return
            }

            userdb.storeAccount(req.body.email,
                req.body.username, pwd,
                function() {});
            req.session.author = req.body.email;
            loggedinUsers[req.session.author] = {
                'email': req.session.author,
                'username': req.body.username
            };

            res.redirect('./play');
            return;
        } else {
            errors.push('The email is already taken.');
            res.render('register', {
                errors: errors
            });
            return;
        }
    });
});

router.get('/login', function(req, res) {
    res.render('home', {
        user: req.user
    });
    return;
});

router.post('/login', function(req, res) {
    errors = []
    if (!req.body.password || !req.body.email) {
        errors.push('Email and password are required.');
        res.render('home', {
            errors: errors
        });
        return;
    }

    var pwd = encrypt(req.body.password);
    userdb.findAccount(req.body.email, function(err, doc) {
        if (doc != null) {
            if (doc.password !== pwd) {
                errors.push('Invalid password');
                res.render('home', {
                    errors: errors
                });
                return;
            } else {
                // authentication
                req.session.author = req.body.email;
                loggedinUsers[req.session.author] = {
                    'email': doc.email,
                    'username': doc.username
                };
                res.redirect('./play');
                return;
            }
        } else {
            errors.push('Email account does not exist.');
            res.render('home', {
                errors: errors
            });
            return;
        }
    });
});

router.get('/profile', function(req, res) {
    if (req.session.author == undefined) {
        res.redirect('./login');
        return;
    }
    if (req.session.author in loggedinUsers) {
        var username = loggedinUsers[req.session.author].username;
        res.render('profile', {
          username: username,
          email: req.session.author,
        });
        return;
    } else {
        delete loggedinUsers[req.session.author];
        req.session.author = undefined;
        res.redirect('/error');
        return;
    }
});

router.post('/profile', function(req, res) {
    if (req.session.author == undefined) {
        res.redirect('./login');
        return;
    }
    if (req.session.author in loggedinUsers) {
        userdb.updateAccount(req.session.author,
            req.body.username,
            function(err, doc, lastErrorObject) {

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
    return;
});

router.get('/leaderboard', function(req, res) {
  if (req.session.author == undefined) {
      res.redirect('./login');
      return;
  }
  if (req.session.author in loggedinUsers) {
      db.getAllMaps(function(err, docs) {
          if (docs == null) {
              res.render('leaderboard');
              return;
          }

          maps = [];
          for (i in docs) {
              maps.push(docs[i].displayName);
          }
          res.render('leaderboard', {
              maps: maps,
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
});

router.get('/getLeaderboard', function(req, res) {
    if (req.session.author == undefined) {
        res.redirect('./login');
        return;
    }
    if (req.session.author in loggedinUsers) {
      db.getHighScores(req.query.map.toLowerCase().replace(" ", "_"), function(highScore) {
        res.send(highScore);
      });

    } else {
        delete loggedinUsers[req.session.author];
        req.session.author = undefined;
        res.redirect('/error');
        return;
    }

});

//TODO
router.get('/getPersonalBests', function(req, res) {
    if (req.session.author == undefined) {
        res.redirect('./login');
        return;
    }
    if (req.session.author in loggedinUsers) {
      var email = loggedinUsers[req.session.author].email;
      console.log(email);
      db.getPersonalBests(email, function(result){
        console.log(result);
        res.send(result);
      });
      return;
    } else {
        delete loggedinUsers[req.session.author];
        req.session.author = undefined;
        res.redirect('/error');
        return;
    }
    // res.send([{
    //         name: "harlen",
    //         number: 999,
    //         percentage: "12%",
    //         time: "12:23",
    //     },{
    //         name: "harle",
    //         number: 998,
    //         percentage: "12%",
    //         time: "12:23",
    //     },{
    //         name: "harl",
    //         percentage: "12%",
    //         number: 997,
    //         time: "12:23",
    //     }]);
});

// TODO
router.get('/friends', function(req, res) {
    if (req.session.author == undefined) {
        res.redirect('./login');
        return;
    }
    res.render('index', {
        title: 'Enclosure.io'
    });
    return;
});

router.get('/logout', function(req, res) {
    delete loggedinUsers[req.session.author];
    req.session.author = undefined;
    res.redirect('../');
    return;
});

function encrypt(password) {
    return crypto.createHash('sha256').update(password).digest('base64');
}

exports.r = router;

exports.tokens = tokens;
