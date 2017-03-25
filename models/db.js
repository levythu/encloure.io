// Connection URL
var conf=require("../settings");
var url = conf.database.url;

var mongojs = require('mongojs');
var db = mongojs(url, ['gamerServers']);

function insertDoc(collectionName, doc, callback) {
    db.collection(collectionName).insert(doc, callback);
};

function deleteDoc(collectionName, doc, callback) {
    db.collection(collectionName).remove(doc, callback);
};

exports.insertDoc = insertDoc;
exports.deleteDoc = deleteDoc;
