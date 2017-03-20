
var mp;

$(function(){
    var mainCanvas=$("#mainCanvas")[0].getContext("2d");
    var persistCanvas=$("#persistCanvas")[0].getContext("2d");
    var CANVAS_WIDTH, CANVAS_HEIGHT;      // in pixel!
    var players={};
    // `moves` is a stack, recording all the pending moves from the last render point (decided by FPS)
    var moves=[];
    var map;

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
    function digestMove(mv, persistWholeRenderRequired=true) {
        var needFlood=false;
        var floodList={};
        for (var i in mv) {
            if (!(i in players)) continue;

            var v=map.c[mv[i].x][mv[i].y];
            if (v==players[i].idnum) {
                needFlood=true;
                floodList[v]=true;
            } else if (v==map.NO_OCCUPATION) {
                persistCanvas.save();
                persistCanvas.fillStyle=players[i].color[1];
                persistCanvas.fillRect(mv[i].x*10, mv[i].y*10, 10, 10);
                persistCanvas.restore();

                map.Set(mv[i].x, mv[i].y, players[i].idnum+map.DIM_GAP);
            }
            players[i].x=mv[i].x;
            players[i].y=mv[i].y;
            players[i].ox=mv[i].x;
            players[i].oy=mv[i].y;
        }
        if (needFlood) {
            map.FloodFill(floodList);
            if (persistWholeRenderRequired) renderPersistMapWhole();
        }
    }
    function renderFrame() {
        if (moves.length>1) {
            // TODO handle all the hops
            for (var c=0; c<moves.length-1; c++) {
                digestMove(moves[c], c==moves.length-2);
            }
            moves=[moves[moves.length-1]];
        }
        mainCanvas.save();
        mainCanvas.clearRect(0,0,CANVAS_WIDTH,CANVAS_HEIGHT);
        for (var i in players) {
            var player=players[i];
            mainCanvas.fillStyle=player.color[3];
            mainCanvas.fillRect(player.x*10-1, player.y*10, 10, 11);
            mainCanvas.fillStyle=player.color[0];
            mainCanvas.fillRect(player.x*10, player.y*10, 10, 10);
        }
        mainCanvas.restore();
        if (moves.length>0) {
            var terminate=false;
            for (var i in moves[0]) {
                var player=players[i];
                if (player==null) continue;
                if (!("sx" in moves[0][i])) {
                    moves[0][i].sx=(moves[0][i].x-player.x)*globalConf.RPS/moves[0]._delta/globalConf.FPS;
                    moves[0][i].sy=(moves[0][i].y-player.y)*globalConf.RPS/moves[0]._delta/globalConf.FPS;
                    moves[0][i].rest=Math.ceil(globalConf.FPS*moves[0]._delta/globalConf.RPS);
                }
                player.x+=moves[0][i].sx;
                player.y+=moves[0][i].sy;
                moves[0][i].rest--;
                if (moves[0][i].rest<=0) terminate|=true;
            }
            if (terminate) {
                digestMove(moves[0]);
                moves.pop();
            }
        }
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
        if ("join" in obj) {
            for (var i in obj.join) {
                players[i]=obj.join[i];
                players[i].idnum=fromIDtoNumID(i);
                players[i].ox=players[i].x;
                players[i].oy=players[i].y;

                persistCanvas.save();
                persistCanvas.fillStyle=players[i].color[2];
                persistCanvas.fillRect(players[i].ox*10, players[i].oy*10, 10, 10);
                persistCanvas.restore();

                map.Set(players[i].ox, players[i].oy, players[i].idnum);
            }
        }
        if ("move" in obj) {
            moves.push(obj.move);
        }
    });
});
