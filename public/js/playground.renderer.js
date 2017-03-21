
var mp;

$(function(){
    var Queue=window._extension.Queue;

    var mainCanvas=$("#mainCanvas")[0].getContext("2d");
    var persistCanvas=$("#persistCanvas")[0].getContext("2d");
    var CANVAS_WIDTH, CANVAS_HEIGHT;      // in pixel!
    var players={};
    var map;

    var startServerEpic=0;
    var startLocalEpic=0;
    var moves=new Queue();

    function fromIDtoNumID(id) {
        return parseInt(id);
    }
    function fromNumIDtoID(numid) {
        return ""+numid;
    }
    function renderPersistMapWhole() {
        for (var i=0; i<globalConf.MapSize[0]; i++) {
            for (var j=0; j<globalConf.MapSize[1]; j++) {
                if (map.c[i][j]>=0) {
                    var id=fromNumIDtoID(map.c[i][j] % map.DIM_GAP);
                    var dim=Math.floor(map.c[i][j] / map.DIM_GAP);
                    if (id in players) {
                        persistCanvas.save();
                        persistCanvas.fillStyle=players[id].color[dim==0?2:1];
                        persistCanvas.fillRect(i*10, j*10, 10, 10);
                        persistCanvas.restore();
                    }
                }
            }
        }
    }
    function digestMove(mv, persistWholeRenderRequired=true, now=null) {
        var needFlood=false;
        var floodList={};
        if (now==null) now=(new Date()).getTime();
        persistCanvas.save();
        for (var i in mv) {
            var player=players[i];
            if (player==null) continue;

            var v=map.c[mv[i].x][mv[i].y];
            if (v==player.idnum) {
                needFlood=true;
                floodList[v]=true;
            } else if (v==map.NO_OCCUPATION) {
                persistCanvas.fillStyle=player.color[1];
                persistCanvas.fillRect(mv[i].x*10, mv[i].y*10, 10, 10);

                map.Set(mv[i].x, mv[i].y, player.idnum+map.DIM_GAP);
            }
            player.x=mv[i].x;
            player.y=mv[i].y;
            player.ox=mv[i].x;
            player.oy=mv[i].y;
            while (player.moves.GetLen()>0 && player.moves.Peak()._epic<=mv[i]._epic)
                player.moves.DeQueue();
            if (player.moves.GetLen()>0) {
                var tm=player.moves.Peak();
                var nOfFPS=(tm._epic-startServerEpic+startLocalEpic-now)/1000*globalConf.FPS+globalConf.RPSLag*globalConf.FPS/globalConf.RPS;
                player.dx=(tm.x-player.x)/nOfFPS;
                player.dy=(tm.y-player.y)/nOfFPS;
            } else {
                player.dx=0;
                player.dy=0;
            }

        }
        persistCanvas.restore();
        if (needFlood) {
            map.FloodFill(floodList);
            if (persistWholeRenderRequired) renderPersistMapWhole();
        }
    }

    function renderFrame() {
        var now=(new Date()).getTime();
        var renderUntil=now-startLocalEpic+startServerEpic-globalConf.RPSLag*1000/globalConf.RPS;

        while (moves.GetLen()>0 && moves.Peak()._epic<=renderUntil) {
            digestMove(moves.DeQueue(), true, now);
        }

        for (var i in players) {
            var player=players[i];
            player.x+=player.dx;
            player.y+=player.dy;
        }

        mainCanvas.save();
        mainCanvas.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
        for (var i in players) {
            var player=players[i];
            mainCanvas.fillStyle=player.color[3];
            mainCanvas.fillRect(player.x*10-1, player.y*10, 10, 11);
            mainCanvas.fillStyle=player.color[0];
            mainCanvas.fillRect(player.x*10, player.y*10, 10, 10);
        }
        mainCanvas.restore();
    }

    $("body").on("gm-init", function() {
        CANVAS_WIDTH=globalConf.MapSize[0]*10;
        CANVAS_HEIGHT=globalConf.MapSize[1]*10;
        map=window._extension.NewMap(globalConf.MapSize[0], globalConf.MapSize[1]);
        mp=map;
        $(".kernelCanvas").attr("width",  CANVAS_WIDTH)
                          .attr("height", CANVAS_HEIGHT);
        setInterval(renderFrame, 1000/globalConf.FPS);
    });

    $("body").on("gm-msg", function(e, obj) {
        var now=(new Date()).getTime();
        if ("join" in obj) {
            for (var i in obj.join) {
                players[i]=obj.join[i];
                players[i].idnum=fromIDtoNumID(i);
                players[i].ox=players[i].x;
                players[i].oy=players[i].y;
                players[i].dx=0;
                players[i].dy=0;
                players[i].moves=new Queue();

                persistCanvas.save();
                persistCanvas.fillStyle=players[i].color[2];
                persistCanvas.fillRect(players[i].ox*10, players[i].oy*10, 10, 10);
                persistCanvas.restore();

                map.Set(players[i].ox, players[i].oy, players[i].idnum);
            }
            if (obj._init===true) {
                startServerEpic=obj._epic;
                startLocalEpic=now;
            }
        }
        if ("move" in obj) {
            moves.EnQueue(obj.move);
            for (var i in obj.move) {
                if (i in players) {
                    obj.move[i]._epic=obj._epic;
                    players[i].moves.EnQueue(obj.move[i]);
                    if (players[i].moves.GetLen()==1) {
                        var tm=players[i].moves.Peak();
                        var nOfFPS=(tm._epic-startServerEpic+startLocalEpic-now)/1000*globalConf.FPS+globalConf.RPSLag*globalConf.FPS/globalConf.RPS;
                        players[i].dx=(tm.x-players[i].x)/nOfFPS;
                        players[i].dy=(tm.y-players[i].y)/nOfFPS;
                    }
                }
            }
        }
    });
});
