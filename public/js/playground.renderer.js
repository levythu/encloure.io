$(function(){
    var mainCanvas=$("#mainCanvas")[0].getContext("2d");
    var persistCanvas=$("#persistCanvas")[0].getContext("2d");
    var WIDTH, HEIGHT;
    var players={};
    var moves=[];
    var map;

    function digestMove(mv) {
        for (var i in mv) {
            if (!(i in players)) continue;

            persistCanvas.save();
            persistCanvas.fillStyle=players[i].color[1];
            var l=Math.min(players[i].x, mv[i].x);
            var r=Math.max(players[i].x, mv[i].x);
            var u=Math.min(players[i].y, mv[i].y);
            var d=Math.max(players[i].y, mv[i].y);
            persistCanvas.fillRect(l*10, u*10, (r-l+1)*10, (d-u+1)*10);
            persistCanvas.restore();

            players[i].x=mv[i].x;
            players[i].y=mv[i].y;
        }
    }
    function renderFrame() {
        if (moves.length>1) {
            // TODO handle all the hops
            for (var c=0; c<moves.length-1; c++) {
                digestMove(moves[c]);
            }
            moves=[moves[moves.length-1]];
        }
        mainCanvas.save();
        mainCanvas.clearRect(0,0,WIDTH,HEIGHT);
        for (var i in players) {
            var player=players[i];
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
                    moves[0][i].sx=(moves[0][i].x-player.x)*globalConf.RPS/globalConf.FPS;
                    moves[0][i].sy=(moves[0][i].y-player.y)*globalConf.RPS/globalConf.FPS;
                    moves[0][i].rest=Math.ceil(globalConf.FPS/globalConf.RPS);
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
        WIDTH=globalConf.MapSize[0]*10;
        HEIGHT=globalConf.MapSize[1]*10;
        map=window._extension.NewMap(WIDTH, HEIGHT);
        $(".kernelCanvas").attr("width",  WIDTH)
                          .attr("height", HEIGHT);
        setInterval(renderFrame, 1000/globalConf.FPS);
    });

    $("body").on("gm-msg", function(e, obj) {
        if ("join" in obj) {
            for (var i in obj.join) {
                players[i]=obj.join[i];
            }
        }
        if ("move" in obj) {
            moves.push(obj.move);
        }
    });


});
