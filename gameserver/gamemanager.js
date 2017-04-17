var rand=require("../utils/randomGen");
var server=require("../game/server");
var conf=require("../settings");

var request=require("request");

exports.token=rand.GenerateRandomString(100);

exports.LaunchGame=function(callback, roomMap, player) {
    server.NewServer(function(gamep) {
        console.log("Launched new game at "+gamep);
        callback(gamep);
    }, roomMap, player);

}

function disconnectMaster(err) {
    request.post(conf.server.masterEndPoint+"/gm/unregister", {form: {
        endpoint: "http://"+conf.server.hostname+":"+conf.server.port,
        secret: conf.server.masterSecret,
    }}, function() {
        console.error(err);
        console.log("Successfully unregistered with master, now exiting...");
        process.exit(-1);
    });
}
function connectMaster() {
    request.post(conf.server.masterEndPoint+"/gm/register", {form: {
        endpoint: "http://"+conf.server.hostname+":"+conf.server.port,
        token: exports.token,
        secret: conf.server.masterSecret,
    }}, function(err, response, body) {
        if (err || Math.floor(response.statusCode/100)!==2) {
            throw "Not able to register to master: "+err;
        }
        console.log("Successfully registered with master.");
        process.on('SIGINT', disconnectMaster);
        //catches uncaught exceptions
        process.on('uncaughtException', disconnectMaster);
    });
}

connectMaster();
