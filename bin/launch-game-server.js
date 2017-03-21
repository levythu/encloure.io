#!/usr/bin/env node

/**
 * Module dependencies.
 */

var conf=require("../settings");
var port = normalizePort(process.argv[2]);

conf.server.port=port;

var app = require('../gameserver/gameapp');
var debug = require('debug')('enclosure.io:gameserver');
var http = require('http');

app.set('port', port);

/**
 * Get port from environment and store in Express.
 */



/**
 * Listen on provided port, on all network interfaces.
 */

app.listen(port, function() {
    debug('Express server listening on port ' + port);
});

/**
 * Normalize a port into a number, string, or false.
 */

function normalizePort(val) {
  var port = parseInt(val, 10);

  if (isNaN(port)) {
    // named pipe
    return val;
  }

  if (port >= 0) {
    // port number
    return port;
  }

  return false;
}
