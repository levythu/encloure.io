var globalConf;

var N={};

// Events triggered:
//      - gm-init: The game is inited and all the parameters are stored in globalConf;

$(function(){
    var params={};
    function parseHash() {
        params={}
        var hash=window.location.hash.substring(1);
        var params=hash.split('&');
        for (var i=0; i<params.length; i++) {
            var kv=params[i].split('=');
            var k=decodeURIComponent(pair[0]);
            var v=decodeURIComponent(pair[1]);
            params[k]=v;
        }
    }
    function generateHash() {
        var result="";
        var theFirst=true;
        for (var k in params) {
            if (theFirst) {
                theFirst=false;
            } else {
                result+="&";
            }
            result+=encodeURIComponent(k)+"="+encodeURIComponent(params[k]);
        }
        return result;
    }
    function findOneRoom() {
        $.get("/gm/getserver", function(data) {
            params.endpoint=data;
            window.location.hash=generateHash();
            connectTo(data);
        }).fail(function() {
            alert("Fail to get a game.");
        });
    }
    function connectTo(data) {
        console.log("Connecting:" + data);
        var connection = new WebSocket(data);
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
                globalConf=res;
                if (typeof(globalConf.profile._fail)=="string") {
                    // TODO in speficy-room mode it may be a prompt, instead of searching another room
                    connection.close();
                    console("Encounter with fail: "+globalConf.profile._fail);
                    setTimeout(findOneRoom, 500);
                    return;
                }

                hasInitiated=true;
                $("body").trigger("gm-init");
            } else {
                $("body").trigger("gm-msg", [res]);
            }
        };

        N.send=function(obj) {
            connection.send(JSON.stringify(obj));
        };

        N.close=function() {
            try {
                connection.close();
            } catch (e) {
                console.error(e);
            }
        }
    }

    if (params.endpoint==null) {
        findOneRoom();
    }
});
