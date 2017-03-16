var conf=require("../settings");

var CONTROL_DIR={
    "u":    [0, -1],
    "d":    [0,  1],
    "l":    [-1, 0],
    "r":    [1 , 0],
}

// server is a server object from server.js
function NewGame(server) {
    var game={};
    var player={};

    game.position={};
    // id is a string and playerProfile is its profile to be initialized
    game.JoinNewPlayer=function(id, playerProfile) {
        player[id]=playerProfile;
        playerProfile.x=Math.floor(Math.random()*conf.game.MapSize[0]);
        playerProfile.y=Math.floor(Math.random()*conf.game.MapSize[1]);
        playerProfile.d=CONTROL_DIR.r;
    };
    // id is a string and obj is a js-object
    game.onControl=function(id, obj) {
        if (obj.dir in CONTROL_DIR) {
            player[id].d=CONTROL_DIR[obj.dir];
        }
    }
    game.Start=function() {
        setInterval(function() {
            for (i in player) {
                var prof=player[i];
                prof.x=(prof.x+prof.d[0]+conf.game.MapSize[0])%conf.game.MapSize[0];
                prof.y=(prof.y+prof.d[1]+conf.game.MapSize[1])%conf.game.MapSize[1];
            }
            server.Broadcast(player);
        }, 1000/conf.game.RPS);
    };

    return game;
}

exports.NewGame=NewGame;
