$(function(){
    var mainCanvas=$("#mainCanvas")[0].getContext("2d");

    $("body").on("gm-init", function() {
        $("#mainCanvas").attr("width",  globalConf.MapSize[0])
                        .attr("height", globalConf.MapSize[1]);
    });
});
