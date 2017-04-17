var conf=require("../settings");
var Map=require("./map.duo");
var getname=require("./stupidNameGenerator");
var gm=require("../gameserver/gamemanager");

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
function NewGame(server, gameConf, playerConf) {
    var game={};
    var player={};

    // for timing
    var startPoint;
    var nextPoint;
    var interval=1000/conf.game.RPS;

    // other per class states
    var colorChoosen=0;

    game.isRunning=false;
    game.position={};
    game.map=Map(gameConf.MapSize[0], gameConf.MapSize[1]);
    if ("map" in gameConf) {
        game.map.DigestObstacleMap(gameConf.map);
    }
    game.userOnline=0;

    game.refreshStatistics=function() {
        var result=game.map.CollectEnclosure();
        for (var i in result) {
            if (!(i in player)) continue;
            var ratio=result[i]/(gameConf.MapSize[0]*gameConf.MapSize[1]-game.map.obstacleCount);
            if (player[i].statistics.bestPercentage<ratio) player[i].statistics.bestPercentage=ratio;
        }
        if (game.isRunning) setTimeout(game.refreshStatistics, 1000);
    }

    // id is a string and playerProfile is its profile to be initialized
    game.JoinNewPlayer=function(id, playerProfile) {
        if (game.userOnline>=gameConf.MaxPlayer) {
            playerProfile._fail="Sadly, the room is full :(";
            return;
        }

        var resTuple=game.map.FindSpawnPlace(game.map.SpawnPlace);
        if (resTuple==null) {
            // no place to spawn
            playerProfile._fail="The room is dominated and there's no place to spawn!";
            return;
        }
        game.userOnline++;
        gm.UpdatePlayer(game.endpoint, game.userOnline, 1);

        player[id]=playerProfile;
        playerProfile.x=resTuple[0];
        playerProfile.y=resTuple[1];
        playerProfile.d=STAND_STILL;
        playerProfile.standFrame=playerConf.standingFrame;
        playerProfile.color=PALLET[colorChoosen];
        playerProfile.speed=playerConf.speed;
        playerProfile.sprintDistance=playerConf.sprintDistance;
        playerProfile.sprintCD=playerConf.sprintCD;
        playerProfile.remainingsprintCD=0;
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
        playerProfile.statistics={
            bestPercentage: 0,
            numbersKill: 0,
            timeSpawned: now,
        };
    };
    // id is a string and obj is a js-object
    game.onControl=function(id, obj) {
        if (id in player) {
            if (obj.dir in CONTROL_DIR) {
                if (player[id].d===CONTROL_DIR[CONTRADICT_DIR[obj.dir]]) return;
                player[id].nextd=CONTROL_DIR[obj.dir];
            }
            if (obj.sprint) {
                if (player[id].remainingsprintCD===0) player[id].sprinting=true;
            }
        }
    }

    game.decideDirection=function(x, y) {
        var choice="udlr";
        var stp=Math.floor(Math.random()*4);
        for (var i=0; i<4; i++) {
            var tx=x+CONTROL_DIR[choice[(stp+i)%4]][0]*2;
            var ty=y+CONTROL_DIR[choice[(stp+i)%4]][1]*2;
            if (tx<0 || ty<0 || tx>=gameConf.MapSize[0] || ty>=gameConf.MapSize[1]) continue;
            if (game.map.Get(tx, ty)<game.map.NO_OCCUPATION) continue;
            return choice[(stp+i)%4];
        }
        return choice[stp];
    }
    game.onTick=function() {
        var now=(new Date()).getTime();
        var newMove={};
        var shouldBC=false;
        var floodList={};
        var die={};
        var enableSprint={};
        for (i in player) {
            var prof=player[i];
            if ("nextd" in prof) {
                prof.d=prof.nextd;
                delete prof.nextd;
            }

            if (prof.d===STAND_STILL && prof.standFrame<=0) {
                prof.d=CONTROL_DIR[game.decideDirection(prof.x, prof.y)];
            } else if (prof.standFrame>0) {
                prof.standFrame--;
            }

            if (prof.remainingsprintCD>0) {
                prof.remainingsprintCD--;
                if (prof.remainingsprintCD==0) {
                    enableSprint[prof.id]=true;
                    shouldBC=true;
                }
            }

            prof.shouldMove--;
            if (prof.shouldMove>0) continue;
            prof.shouldMove=prof.speed;
            shouldBC=true;

            function _mv() {
                prof.x=prof.x+prof.d[0];
                if (prof.x<0) {
                    die[i]=true;
                    return;
                } else if (prof.x>=gameConf.MapSize[0]) {
                    die[i]=true;
                    return;
                }
                prof.y=prof.y+prof.d[1];
                if (prof.y<0) {
                    die[i]=true;
                    return;
                } else if (prof.y>=gameConf.MapSize[1]) {
                    die[i]=true;
                    return;
                }

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
                        if (prof.remainingsprintCD>0) {
                            prof.remainingsprintCD=0;
                            enableSprint[prof.id]=true;
                        }
                        prof.statistics.numbersKill++;
                        game.map.Set(prof.x, prof.y, idnum+game.map.DIM_GAP);
                    }
                } else if (v>=0 && v<game.map.DIM_GAP) {
                    game.map.Set(prof.x, prof.y, idnum+game.map.DIM_GAP);
                } else if (v==game.map.SOFT_OBSTACLE || v==game.map.HARD_OBSTACLE) {
                    die[i]=true;
                }
            }

            if (prof.sprinting===true) {
                prof.sprinting=false;
                prof.remainingsprintCD=prof.sprintCD;
                var intermediatePos=[];
                for (var step=0; step<prof.sprintDistance; step++) {
                    _mv();
                    if (die[i]===true) break;
                    else intermediatePos.push([prof.x, prof.y]);
                }
                newMove[i]={
                    x: prof.x,
                    y: prof.y,
                    i: intermediatePos,
                };
            } else {
                _mv();
                newMove[i]={
                    x: prof.x,
                    y: prof.y,
                };
            }

            prof.lastMoveTime=now;
        }
        for (var i in die) {
            server.Send(player[i].id, {
                statistics: {
                    bestPercentage: player[i].statistics.bestPercentage,
                    numbersKill: player[i].statistics.numbersKill,
                    timeLives: now-player[i].statistics.timeSpawned,
                }
            });
            game.map.DeleteColor(-(-i));
            delete player[i];
            game.userOnline--;
            gm.UpdatePlayer(game.endpoint, game.userOnline, -1);
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
                sprint: enableSprint,
                _epic: now,
            });
        }

        nextPoint+=interval;
        var nowPoint=(new Date()).getTime();
        while (nextPoint<nowPoint) {
            console.warn("CPU cannot catch up with refreshing rate, consider lowering your RPS...");
            nextPoint+=interval;
        }
        if (game.isRunning) setTimeout(game.onTick, nextPoint-nowPoint);
    }
    game.Start=function() {
        startPoint=(new Date()).getTime();
        nextPoint=startPoint+interval;
        game.isRunning=true;
        setTimeout(game.onTick, nextPoint-startPoint);
        setTimeout(game.refreshStatistics, 1000);
    };
    game.Stop=function() {
        game.isRunning=false;
    }

    return game;
}

exports.NewGame=NewGame;
