var db = require("./db").db;

exports.findAccount = function(email, callback){
    db.users.findOne({'email':email}, callback);
}

exports.storeAccount = function(email, username, password, callback){
    db.users.insert({'email':email, 'username': username, 'password': password}, callback);
}

