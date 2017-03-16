var globalConf;

// Events triggered:
//      - gm-init: The game is inited and all the parameters are stored in globalConf;

$(function(){
    var endpointURL=new URL("/live", window.location.href);
    endpointURL.protocol="ws:";
    var connection = new WebSocket(endpointURL.href);
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
            res=JSON.parse(e);
        } catch (err) {
            onError();
            return;
        }
        if (!hasInitiated) {
            hasInitiated=true;
            globalConf=res;
            $("body").trigger("gm-init");
        }
        console.log(res);
    };
});
