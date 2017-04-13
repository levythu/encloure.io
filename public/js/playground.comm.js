var globalConf;

var N={};
var _URL={};

// Events triggered:
//      - gm-init: The game is inited and all the parameters are stored in globalConf;

$(function(){
    var params={};
    function parseHash() {
        params={};
        _URL.params=params;
        var hash=window.location.hash.substring(1);
        var tp=hash.split('&');
        for (var i=0; i<tp.length; i++) {
            if (tp[i]==0) continue;
            var kv=tp[i].split('=');
            var k=decodeURIComponent(kv[0]);
            var v=decodeURIComponent(kv[1]);
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
        $("#loadingCaption").text("Finding one available room...");
        console.log("Finding rooms...")
        $.get("/gm/getserver", function(data) {
            params.endpoint=data;
            window.location.hash=generateHash();
            connectTo(data);
        }).fail(function() {
            $("#loadingCaption").text("☹ Sorry, we cannot pinpoint a available room. Please try later.");
        });
    }
    function connectTo(data) {
        $("#loadingCaption").text("Connecting to the gameserver...");
        var connection = new WebSocket(data);
        var hasInitiated=false;

        function onError() {
            // TODO
        }

        // TODO dont't restart in non-quickgame mode
        connection.onopen = function() {
            hasInitiated=false;
            var toPost={_init: true};
            toPost.token=params.token;
            toPost.type=params.type;
            connection.send(JSON.stringify(toPost));
        };

        connection.onerror = function(error) {
            if (!hasInitiated) {
                $("#loadingCaption").text("☹ Fail to join the room, we are trying to get another one...");
                setTimeout(findOneRoom, 500);
                return;
            }
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
                    // TODO room-full info will be alerted... not correct
                    $("#loadingCaption").text("☹ "+globalConf.profile._fail+". We are trying to get another one...");
                    console.log("Encounter with fail: "+globalConf.profile._fail);
                    setTimeout(findOneRoom, 500);
                    return;
                }

                hasInitiated=true;
                $("#loadingCaption").text("Here we go!");
                setTimeout(function() {
                    OutSider.HideWelcome();
                }, 500);
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
    parseHash();
    if (params.endpoint==null) {
        findOneRoom();
    } else {
        connectTo(params.endpoint);
    }
});
