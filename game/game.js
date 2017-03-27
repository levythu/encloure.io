var conf=require("../settings");
var Map=require("./map.duo");
var getname=require("./stupidNameGenerator");

var CONTROL_DIR={
    "u":    [0, -1],
    "d":    [0,  1],
    "l":    [-1, 0],
    "r":    [1 , 0],
}
var STAND_STILL=[0, 0];
var CONTRADICT_DIR={
    "u":    "d",
    "d":    "u",
    "l":    "r",
    "r":    "l",
};
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
function NewGame(server, gameConf=conf.game.defaultMap) {
    var game={};
    var player={};

    // for timing
    var startPoint;
    var nextPoint;
    var interval=1000/conf.game.RPS;

    // other per class states
    var colorChoosen=0;

    game.position={};
    game.map=Map(gameConf.MapSize[0], gameConf.MapSize[1]);
    if ("map" in gameConf) {
        game.map.DigestObstacleMap(gameConf.map);
    }
    game.userOnline=0;
    // id is a string and playerProfile is its profile to be initialized
    game.JoinNewPlayer=function(id, playerProfile) {
        if (game.userOnline>=gameConf.MaxPlayer) {
            playerProfile._fail="Sadly, the room is full :(";
            return;
        }

        var resTuple=game.map.FindSpawnPlace();
        if (resTuple==null) {
            // no place to spawn
            playerProfile._fail="The room is dominated and there's no place to spawn!";
            return;
        }
        game.userOnline++;

        player[id]=playerProfile;
        playerProfile.x=resTuple[0];
        playerProfile.y=resTuple[1];
        playerProfile.d=STAND_STILL;
        playerProfile.standFrame=conf.game.player.standingFrame;
        playerProfile.color=PALLET[colorChoosen];
        playerProfile.speed=conf.game.player.speed;
        playerProfile.shouldMove=playerProfile.speed;
        if (playerProfile.nick==null) playerProfile.nick=getname();
        colorChoosen=(colorChoosen+1)%PALLET.length;

        game.map.SpawnNew(playerProfile.x, playerProfile.y, -(-id));

        var newJoin={};
        newJoin[id]=playerProfile;
        var now=(new Date()).getTime();
        server.Broadcast({
            join: newJoin,
            _epic: now,
        });
        server.Send(id, {
            join: player,
            maprever: game.map._r,
            map: ("map" in gameConf?gameConf.map:null),
            _init: true,
            _epic: now,
        });
        playerProfile.lastMoveTime=now;
    };
    // id is a string and obj is a js-object
    game.onControl=function(id, obj) {
        if (id in player) {
            if (obj.dir in CONTROL_DIR) {
                if (player[id].d===CONTROL_DIR[CONTRADICT_DIR[obj.dir]]) return;
                player[id].nextd=CONTROL_DIR[obj.dir];
            }
        }
    }

    game.onTick=function() {
        var now=(new Date()).getTime();
        var newMove={};
        var shouldBC=false;
        var floodList={};
        var die={};
        for (i in player) {
            var prof=player[i];
            if ("nextd" in prof) {
                prof.d=prof.nextd;
                delete prof.nextd;
            }

            if (prof.d===STAND_STILL && prof.standFrame<=0) {
                prof.d=CONTROL_DIR.r;
            } else if (prof.standFrame>0) {
                prof.standFrame--;
            }

            prof.shouldMove--;
            if (prof.shouldMove>0) continue;
            prof.shouldMove=prof.speed;
            shouldBC=true;

            prof.x=prof.x+prof.d[0];
            if (prof.x<0) {
                die[i]=true;
                continue;
            } else if (prof.x>=gameConf.MapSize[0]) {
                die[i]=true;
                continue;
            }
            prof.y=prof.y+prof.d[1];
            if (prof.y<0) {
                die[i]=true;
                continue;
            } else if (prof.y>=gameConf.MapSize[1]) {
                die[i]=true;
                continue;
            }

            newMove[i]={
                x: prof.x,
                y: prof.y,
            };
            var idnum=-(-i);
            var v=game.map.c[prof.x][prof.y];
            if (v==idnum) {
                floodList[v]=true;
            } else if (v==game.map.NO_OCCUPATION) {
                game.map.Set(prof.x, prof.y, idnum+game.map.DIM_GAP);
            } else if (v>=game.map.DIM_GAP && v<game.map.DIM_GAP*2) {
                // walk in someone.
                var victim=v-game.map.DIM_GAP;
                die[victim]=true;
                if (player[victim].x===prof.x && player[victim].y===prof.y) {
                    // a head-to-head collosion! both die
                    die[i]=true;
                } else if (victim!=idnum) {
                    game.map.Set(prof.x, prof.y, idnum+game.map.DIM_GAP);
                }
            } else if (v>=0 && v<game.map.DIM_GAP) {
                game.map.Set(prof.x, prof.y, idnum+game.map.DIM_GAP);
            } else if (v==game.map.SOFT_OBSTACLE || v==game.map.HARD_OBSTACLE) {
                die[i]=true;
            }

            prof.lastMoveTime=now;
        }
        for (var i in die) {
            game.map.DeleteColor(-(-i));
            delete player[i];
            game.userOnline--;
        }
        for (var i in floodList) {
            game.map.FloodFill(i);
        }

        if (shouldBC) {
            newMove._epic=now;
            server.Broadcast({
                move: newMove,
                enclose: floodList,
                die: die,
                _epic: now,
            });
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
