var globalConf;

var N={};

// Events triggered:
//      - gm-init: The game is inited and all the parameters are stored in globalConf;

$(function(){
    var connection = new WebSocket("ws://aws.levy.at:2333/");
    var hasInitiated=false;

    function onError() {
        // TODO
    }

    connection.onopen = function() {
        hasInitiated=false;
    };

    connection.onerror = function(error) {
        console.log('WebSocket Error ' + error);
        onError();
    };

    connection.onmessage = function(e) {
        var res;
        try {
            res=JSON.parse(e.data);
        } catch (err) {
            onError();
            return;
        }
        if (!hasInitiated) {
            hasInitiated=true;
            globalConf=res;
            $("body").trigger("gm-init");
        } else {
            $("body").trigger("gm-msg", [res]);
        }
    };

    N.send=function(obj) {
        connection.send(JSON.stringify(obj));
    };
});
