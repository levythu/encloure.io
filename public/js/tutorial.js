var Tutorial={};
$(function() {
    Tutorial.Draw=function() {
        $("head").append($('<link rel="stylesheet" type="text/css" />').attr("href", "/css/effect.css"));
        $("head").append($('<link rel="stylesheet" type="text/css" />').attr("href", "/css/tutorial.css"));
        $("body").append($('<div id="tutorialContainer" class="transit_in_background nonexist">').html(`
            <div id="tutorialContainer-inner" class="transit_in_position">
                <img src="/img/tutorial/1.png"></img>
                <img src="/img/tutorial/2.png"></img>
                <img src="/img/tutorial/3.png"></img>
                <img src="/img/tutorial/4.png"></img>
                <img src="/img/tutorial/5.png"></img>
                <div id="tutorialContainer-right">
                    <a class="gameButton" href="javascript:Tutorial.Never()">Never Show Again</a>
                </div>
            </div>
        `));

        $("#tutorialContainer").click(Tutorial.Hide);
        $("#tutorialContainer-inner").click(function(e){e.stopPropagation()});
    }

    var timeout=0;
    var callback=null;
    Tutorial.Show=function(cb, time=-1) {
        $("#tutorialContainer").removeClass("nonexist")
                               .css("background", "rgba(0,0,0,0.5)");
        $("#tutorialContainer-inner").css("top", "10%");
        callback=cb;
        if (time>=0) timeout=setTimeout(Tutorial.Hide, time);
    }
    Tutorial.Hide=function() {
        $("#tutorialContainer-inner").css("top", "-110%");
        $("#tutorialContainer").css("background", "transparent");
        setTimeout(function(){
            $("#tutorialContainer").addClass("nonexist")
            if (callback) {
                setTimeout(callback, 0);
                callback=null;
            }
        }, 500);
        if (timeout!=0) {
            clearTimeout(timeout);
            timeout=0;
        }
    }
    Tutorial.Never=function() {
        window.localStorage.tutorial="0";
        Tutorial.Hide();
    }
    Tutorial.Erase=function() {
        $("#tutorialContainer").remove();
    }
});
