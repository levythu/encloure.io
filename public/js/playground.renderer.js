$(function(){
    var mainCanvas=$("#mainCanvas")[0].getContext("2d");
    var WIDTH, HEIGHT;
    var players={};
    var localPlayers={};

    function renderFrame() {
        mainCanvas.save();
        mainCanvas.clearRect(0,0,WIDTH,HEIGHT);
        for (var i in localPlayers) {
            var player=localPlayers[i];
            mainCanvas.fillStyle=players[i].color;
            mainCanvas.fillRect(player.x*10, player.y*10, 10, 10);
        }
        for (var i in localPlayers) {
            var player=localPlayers[i];
            player.x+=player.spf[0];
            player.y+=player.spf[1];
        }
        mainCanvas.restore();
    }

    $("body").on("gm-init", function() {
        WIDTH=globalConf.MapSize[0]*10;
        HEIGHT=globalConf.MapSize[1]*10;
        $("#mainCanvas").attr("width",  WIDTH)
                        .attr("height", HEIGHT);
        setInterval(renderFrame, 1000/globalConf.FPS);
    });

    $("body").on("gm-msg", function(e, obj) {
        players=obj;
        for (var i in players) {
            if (!(i in localPlayers)) {
                localPlayers[i]={
                    x: players[i].x,
                    y: players[i].y,
                    spf: [0, 0],
                };
            } else {
                localPlayers[i].spf[0]=(players[i].x-localPlayers[i].x)*globalConf.RPS/globalConf.FPS;
                localPlayers[i].spf[1]=(players[i].y-localPlayers[i].y)*globalConf.RPS/globalConf.FPS;
            }
        }
    });


});
