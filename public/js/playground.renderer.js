$(function(){
    var mainCanvas=$("#mainCanvas")[0].getContext("2d");
    var WIDTH, HEIGHT;
    var players={};
    var moves=[];

    function renderFrame() {
        mainCanvas.save();
        mainCanvas.clearRect(0,0,WIDTH,HEIGHT);
        if (moves.length>1) {
            // TODO handle all the hops
            for (var i in moves[moves.length-2]) {
                if (!(i in players)) continue;
                players[i].x=moves[moves.length-2][i].x;
                players[i].y=moves[moves.length-2][i].y;
            }
            moves=[moves[moves.length-1]];
        }
        for (var i in players) {
            var player=players[i];
            mainCanvas.fillStyle=player.color;
            mainCanvas.fillRect(player.x*10, player.y*10, 10, 10);
        }
        mainCanvas.restore();
        if (moves.length>0) {
            for (var i in moves[0]) {
                var player=players[i];
                if (player==null) continue;
                if (!("sx" in moves[0][i])) {
                    moves[0][i].sx=(moves[0][i].x-player.x)*globalConf.RPS/globalConf.FPS;
                    moves[0][i].sy=(moves[0][i].y-player.y)*globalConf.RPS/globalConf.FPS;
                }
                player.x+=moves[0][i].sx;
                player.y+=moves[0][i].sy;
            }
        }
    }

    $("body").on("gm-init", function() {
        WIDTH=globalConf.MapSize[0]*10;
        HEIGHT=globalConf.MapSize[1]*10;
        $("#mainCanvas").attr("width",  WIDTH)
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
