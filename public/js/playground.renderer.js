$(function(){
    var mainCanvas=$("#mainCanvas")[0].getContext("2d");
    var WIDTH, HEIGHT;
    var players={};

    function renderFrame() {
        mainCanvas.save();
        mainCanvas.clearRect(0,0,WIDTH,HEIGHT);
        for (var i in players) {
            var player=players[i];
            if (i===globalConf.profile.id) {
                mainCanvas.fillStyle="rgb(255, 0, 0)";
            } else {
                mainCanvas.fillStyle="rgb(0, 0, 0)";
            }
            mainCanvas.fillRect(player.x*10, player.y*10, 10, 10);
            player.x+=player.d[0]*globalConf.RPS/globalConf.FPS;
            player.y+=player.d[1]*globalConf.RPS/globalConf.FPS;
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
    });


});
