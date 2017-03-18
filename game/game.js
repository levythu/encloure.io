var conf=require("../settings");

var CONTROL_DIR={
    "u":    [0, -1],
    "d":    [0,  1],
    "l":    [-1, 0],
    "r":    [1 , 0],
}
var PALLET=[
    "#E53935",
    "#D81B60",
    "#8E24AA",
    "#3F51B5",
    "#2196F3",
    "#009688",
    "#4CAF50",
    "#FFC107",
    "#FB8C00",
    "#FF5722",
    "#607D8B",
];

// server is a server object from server.js
function NewGame(server) {
    var game={};
    var player={};

    // for timing
    var startPoint;
    var nextPoint;
    var interval=1000/conf.game.RPS;

    // other per class states
    var colorChoosen=0;

    game.position={};
    // id is a string and playerProfile is its profile to be initialized
    game.JoinNewPlayer=function(id, playerProfile) {
        player[id]=playerProfile;
        playerProfile.x=Math.floor(Math.random()*conf.game.MapSize[0]);
        playerProfile.y=Math.floor(Math.random()*conf.game.MapSize[1]);
        playerProfile.d=CONTROL_DIR.r;
        playerProfile.color=PALLET[colorChoosen];
        colorChoosen=(colorChoosen+1)%PALLET.length;
    };
    // id is a string and obj is a js-object
    game.onControl=function(id, obj) {
        if (obj.dir in CONTROL_DIR) {
            player[id].d=CONTROL_DIR[obj.dir];
        }
    }
    game.onTick=function() {
        for (i in player) {
            var prof=player[i];
            prof.x=(prof.x+prof.d[0]+conf.game.MapSize[0])%conf.game.MapSize[0];
            prof.y=(prof.y+prof.d[1]+conf.game.MapSize[1])%conf.game.MapSize[1];
        }
        server.Broadcast(player);
        nextPoint+=interval;
        var nowPoint=(new Date()).getTime();
        while (nextPoint<nowPoint) {
            console.warn("CPU cannot catch up with refreshing rate, consider lowering your RPS...");
            nextPoint+=interval;
        }
        setTimeout(game.onTick, nextPoint-nowPoint);
    }
    game.Start=function() {
        startPoint=(new Date()).getTime();
        nextPoint=startPoint+interval;
        setTimeout(game.onTick, nextPoint-startPoint);
    };

    return game;
}

exports.NewGame=NewGame;
