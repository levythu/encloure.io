var conf=require("../settings");
var map=require("./map.duo");

var CONTROL_DIR={
    "u":    [0, -1],
    "d":    [0,  1],
    "l":    [-1, 0],
    "r":    [1 , 0],
}
var PALLET=conf.PALLET;

// # Server to Client communication:
//  - The first packet must be game info
//  - From the 2nd one, it follows the rule:
//
// {
//     join: {
//         "someUserId": {id: "someUserId", x: 123, y: 456, d:[dx, dy], color: "#00beef"},
//         ...
//     },
//
//     // move will only be presented once within one tick
//     move: {
//         "someUserId": {x: newX, y: newY},
//         ...
//     }
// }

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
    game.map=map(conf.game.MapSize[0], conf.game.MapSize[1]);
    // id is a string and playerProfile is its profile to be initialized
    game.JoinNewPlayer=function(id, playerProfile) {
        player[id]=playerProfile;
        playerProfile.x=Math.floor(Math.random()*conf.game.MapSize[0]);
        playerProfile.y=Math.floor(Math.random()*conf.game.MapSize[1]);
        playerProfile.d=CONTROL_DIR.r;
        playerProfile.color=PALLET[colorChoosen];
        playerProfile.speed=conf.game.player.speed;
        playerProfile.shouldMove=playerProfile.speed;
        colorChoosen=(colorChoosen+1)%PALLET.length;

        var newJoin={};
        newJoin[id]=playerProfile;
        server.Broadcast({
            join: newJoin,
        });
        server.Send(id, {
            join: player,
        });
    };
    // id is a string and obj is a js-object
    game.onControl=function(id, obj) {
        if (obj.dir in CONTROL_DIR) {
            player[id].d=CONTROL_DIR[obj.dir];
        }
    }

    var lastMove=0;
    game.onTick=function() {
        var newMove={};
        var shouldBC=false;
        for (i in player) {
            var prof=player[i];

            prof.shouldMove--;
            if (prof.shouldMove>0) continue;
            prof.shouldMove=prof.speed;
            shouldBC=true;

            prof.x=prof.x+prof.d[0];
            if (prof.x<0) prof.x=0;
            else if (prof.x>=conf.game.MapSize[0]) prof.x=conf.game.MapSize[0]-1;
            prof.y=prof.y+prof.d[1];
            if (prof.y<0) prof.y=0;
            else if (prof.y>=conf.game.MapSize[1]) prof.y=conf.game.MapSize[1]-1;
            newMove[i]={
                x: prof.x,
                y: prof.y,
            };
        }
        lastMove++;
        if (shouldBC) {
            newMove._delta=lastMove;
            server.Broadcast({
                move: newMove,
            });
            lastMove=0;
        }

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
