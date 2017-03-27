
var mp;

$(function(){
    var Queue=window._extension.Queue;
    var renderAmplification=30;
    var marginForCanvas=50;

    var mainCanvas=$("#mainCanvas")[0].getContext("2d");
    var persistCanvas=$("#persistCanvas")[0].getContext("2d");
    var persistCanvasShadow=$("#persistCanvasShadow")[0].getContext("2d");
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

    function renderScoreboard() {
        var result=map.CollectEnclosure();
        var sort=[];
        for (var i=0; i<5; i++) {
            var best=-1;
            var colorid=-1;
            for (var color in result) {
                if (result[color]>best) {
                    best=result[color];
                    colorid=color;
                }
            }
            if (colorid==-1) break;
            else {
                sort.push([colorid, best]);
                delete result[colorid];
            }
        }
        $("#scoreboard").css("visibility", "visible")
                        .html("");
        for (var i=0; i<sort.length; i++) {
            var ratio=sort[i][1]/(globalConf.MapSize[0]*globalConf.MapSize[1]-map.obstacleCount);
            var relativeRatio=Math.floor(100*(sort[0][1]==0?1/sort.length:sort[i][1]/sort[0][1]));
            var theplayer=players[sort[i][0]];
            var newNode=$('<div class="scoreboardEntry"><span class="txt"></span></div>');
            if (relativeRatio<10) relativeRatio=10;
            newNode.css("left", (100-relativeRatio)+"%")
                   .css("width", relativeRatio+"%")
                   .css("background-color", theplayer.color[0])
                   .css("color", theplayer.color[4])
                   .css("box-shadow", "0 7px 0 "+theplayer.color[3]);
            newNode.find(".txt").text(theplayer.nick+" - "+Math.floor(ratio*1000)/10+"%");
            $("#scoreboard").append(newNode);
        }
    }

    function renderPersistMapWhole(renderEmpty=false, xstart=0, xend=globalConf.MapSize[0]-1, ystart=0, yend=globalConf.MapSize[1]-1, renderObstacle=false) {
        persistCanvas.save();
        persistCanvasShadow.save();
        for (var i=xstart; i<=xend; i++) {
            for (var j=ystart; j<=yend; j++) {
                if (map.c[i][j]>=0) {
                    var id=fromNumIDtoID(map.c[i][j] % map.DIM_GAP);
                    var dim=Math.floor(map.c[i][j] / map.DIM_GAP);
                    if (id in players) {
                        if (dim==0) {
                            persistCanvas.fillStyle=players[id].color[2];
                            persistCanvas.fillRect(i*renderAmplification, j*renderAmplification-6, renderAmplification, renderAmplification);
                            persistCanvasShadow.fillStyle=players[id].color[3];
                            persistCanvasShadow.fillRect(i*renderAmplification, j*renderAmplification, renderAmplification, renderAmplification);
                        } else {
                            persistCanvas.clearRect(i*renderAmplification, j*renderAmplification-6, renderAmplification, renderAmplification);
                            persistCanvasShadow.fillStyle=players[id].color[1];
                            persistCanvasShadow.fillRect(i*renderAmplification, j*renderAmplification, renderAmplification, renderAmplification);
                        }
                    }
                } else if (map.c[i][j]==map.NO_OCCUPATION && renderEmpty) {
                    persistCanvas.clearRect(i*renderAmplification, j*renderAmplification-6, renderAmplification, renderAmplification);
                    persistCanvasShadow.clearRect(i*renderAmplification, j*renderAmplification, renderAmplification, renderAmplification);
                } else if (map.c[i][j]<=map.HARD_OBSTACLE && renderObstacle) {
                    persistCanvas.fillStyle="#607D8B";
                    persistCanvas.fillRect(i*renderAmplification, j*renderAmplification-6, renderAmplification, renderAmplification);
                    persistCanvasShadow.fillStyle=(j==globalConf.MapSize[1]-1?"#607D8B":"#263238");
                    persistCanvasShadow.fillRect(i*renderAmplification, j*renderAmplification, renderAmplification, renderAmplification);
                }
            }
        }
        persistCanvas.restore();
        persistCanvasShadow.restore();
    }
    function digestMove(mv, persistWholeRenderRequired=true, now=null) {
        if (now==null) now=(new Date()).getTime();
        persistCanvasShadow.save();
        for (var i in mv) {
            var player=players[i];
            if (player==null) continue;

            var v=map.c[mv[i].x][mv[i].y];
            if (v==map.NO_OCCUPATION) {
                persistCanvas.clearRect(mv[i].x*renderAmplification, mv[i].y*renderAmplification-6, renderAmplification, renderAmplification);
                persistCanvasShadow.fillStyle=player.color[1];
                persistCanvasShadow.fillRect(mv[i].x*renderAmplification, mv[i].y*renderAmplification, renderAmplification, renderAmplification);
                map.Set(mv[i].x, mv[i].y, player.idnum+map.DIM_GAP);
            } else if (v>=map.DIM_GAP && v<map.DIM_GAP*2) {
                var victim=v-map.DIM_GAP;
                if (victim!=player.idnum) {
                    map.Set(mv[i].x, mv[i].y, player.idnum+map.DIM_GAP);
                }
            } else if (v>=0 && v<map.DIM_GAP && v!=player.idnum) {
                persistCanvas.clearRect(mv[i].x*renderAmplification, mv[i].y*renderAmplification-6, renderAmplification, renderAmplification);
                persistCanvasShadow.fillStyle=player.color[1];
                persistCanvasShadow.fillRect(mv[i].x*renderAmplification, mv[i].y*renderAmplification, renderAmplification, renderAmplification);

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
        persistCanvasShadow.restore();

        var wantRender=false;
        var hasDelete=false;
        var idie=false;
        if ("_die" in mv) {
            for (var i in mv._die) {
                map.DeleteColor(-(-i));
                delete players[i];
                if (i===globalConf.profile.id) idie=true;
                if (persistWholeRenderRequired) wantRender=true;
                hasDelete=true;
            }
        }
        if (("_enclose" in mv) && JSON.stringify(mv._enclose)!==JSON.stringify({})) {
            for (var i in mv._enclose) {
                if (map.FloodFill(i))
                    if (persistWholeRenderRequired) wantRender=true;
            }

        }
        if (idie) {
            N.close();
            alert("Hey dude, you DIED!");
        }
        if (wantRender) renderPersistMapWhole(hasDelete);
    }

    function adjustZoom(posInCanvasToCenter/*[x, y]*/) {
        var width=$("#container").width();
        var height=$("#container").height();
        var basex=width/2-posInCanvasToCenter[0];
        var basey=height/2-posInCanvasToCenter[1];
        $(".movingCanvas").css("left", basex)
                          .css("top", basey);

        $("#mainCanvas").css("left", basex-marginForCanvas)
                        .css("top", basey-marginForCanvas);
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
        mainCanvas.clearRect(0, 0, CANVAS_WIDTH+2*marginForCanvas, CANVAS_HEIGHT+2*marginForCanvas);
        for (var i in players) {
            var player=players[i];
            mainCanvas.fillStyle=player.color[2];
            mainCanvas.fillRect(player.x*renderAmplification+marginForCanvas,
                                player.y*renderAmplification+marginForCanvas,
                                renderAmplification,
                                renderAmplification);
            mainCanvas.fillStyle=player.color[0];
            mainCanvas.fillRect(player.x*renderAmplification+marginForCanvas,
                                (player.y*renderAmplification-6+marginForCanvas),
                                renderAmplification,
                                renderAmplification);
        }
        for (var i in players) {
            var player=players[i];
            mainCanvas.textAlign="center";
            mainCanvas.font="17px Helvetica";
            mainCanvas.fillStyle=player.color[3];
            var basex=player.x*renderAmplification+renderAmplification/2;
            mainCanvas.fillText(player.nick, basex+marginForCanvas, (player.y*renderAmplification-14)+marginForCanvas);
        }
        mainCanvas.restore();

        if (globalConf.profile.id in players) {
            adjustZoom([players[globalConf.profile.id].x*renderAmplification, players[globalConf.profile.id].y*renderAmplification]);
        }
    }

    $("body").on("gm-init", function() {
        CANVAS_WIDTH=globalConf.MapSize[0]*renderAmplification;
        CANVAS_HEIGHT=globalConf.MapSize[1]*renderAmplification;
        map=window._extension.NewMap(globalConf.MapSize[0], globalConf.MapSize[1]);
        mp=map;
        $(".kernelCanvas").attr("width",  CANVAS_WIDTH)
                          .attr("height", CANVAS_HEIGHT)
                          .css("width", CANVAS_WIDTH)
                          .css("height", CANVAS_HEIGHT);
        $("#mainCanvas").attr("width",  CANVAS_WIDTH+2*marginForCanvas)
                        .attr("height", CANVAS_HEIGHT+2*marginForCanvas)
                        .css("width", CANVAS_WIDTH+2*marginForCanvas)
                        .css("height", CANVAS_HEIGHT+2*marginForCanvas);
        if (typeof(globalConf.profile._fail)=="string") {
            N.close();
            alert(globalConf.profile._fail);
        }
    });

    var inited=false;
    $("body").on("gm-msg", function(e, obj) {
        var now=(new Date()).getTime();
        if ("_init" in obj) {
            setInterval(renderFrame, 1000/globalConf.FPS);
            inited=true;
            setInterval(renderScoreboard, 1000);
        }
        if (!inited) return;
        if ("join" in obj) {
            for (var i in obj.join) {
                players[i]=obj.join[i];
                players[i].idnum=fromIDtoNumID(i);
                players[i].ox=players[i].x;
                players[i].oy=players[i].y;
                players[i].dx=0;
                players[i].dy=0;
                players[i].moves=new Queue();

                if (obj._init!==true) {
                    map.SpawnNew(players[i].ox, players[i].oy, players[i].idnum);
                    renderPersistMapWhole(false, players[i].ox-1, players[i].ox+1, players[i].oy-1, players[i].oy+1);
                }

            }
            if (obj._init===true) {
                startServerEpic=obj._epic;
                startLocalEpic=now;
            }
        }
        var needRender=false;
        if ("maprever" in obj) {
            map._ChangeColorRever(obj.maprever);
            needRender=true;
        }
        if (obj.map!=null) {
            map.DigestObstacleMap(obj.map);
            needRender=true;
        }
        if (needRender) renderPersistMapWhole(false, 0, globalConf.MapSize[0]-1, 0, globalConf.MapSize[1]-1, true);
        if ("die" in obj) {
            obj.move._die=obj.die;
        }
        if ("enclose" in obj) {
            obj.move._enclose=obj.enclose;
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
