var rand=require("../utils/randomGen");
var server=require("../game/server");
var conf=require("../settings");

var request=require("request");

exports.token=rand.GenerateRandomString(100);

exports.LaunchGame=function(callback) {
    server.NewServer(function(gamep) {
        console.log("Launched new game at "+gamep);
        callback(gamep);
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
    });
}

connectMaster();