var rand=require("../utils/randomGen");
var server=require("../game/server");
var conf=require("../settings");

var request=require("request");

exports.token=rand.GenerateRandomString(100);

exports.LaunchGame=function(callback, roomMap, player) {
    server.NewServer(function(gamep, theserver) {
        console.log("Launched new game at "+gamep);
        callback(gamep, theserver);
    }, roomMap, player);

}
exports.UpdatePlayer=function(endpoint, playerCount, delta) {
    request.post(conf.server.masterEndPoint+"/gm/updatePlayerNum", {form: {
        endpoint: endpoint,
        num: delta,
        abs: playerCount,
        secret: conf.server.masterSecret,
    }}, function(err) {
        if (err) console.error(err);
    });
}
exports.SubmitHistory=function(token, history, endpoint) {
    request.post(conf.server.masterEndPoint+"/gm/persistGameHistory", {form: {
        token: token,
        percentage: history.bestPercentage,
        time: history.timeLives,
        kill: history.numbersKill,
        secret: conf.server.masterSecret,
        endpoint: endpoint,
    }}, function(err) {
        if (err) console.error(err);
    });
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
