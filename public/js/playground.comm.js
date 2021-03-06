var globalConf;

var N={};
var _URL={};

// Events triggered:
//      - gm-init: The game is inited and all the parameters are stored in globalConf;

$(function(){
    var params={};
    var specifyRoom=true;
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

    var numberOfFinding=0;
    var forceCreate=5;
    function findOneRoom() {
        numberOfFinding++;
        var API="/gm/getserver";
        if (numberOfFinding>=forceCreate) {
            $("#loadingCaption").text("Seems most rooms are busy, we are creating a room for you instead...");
            API+="?forcecreate=true";
        } else {
            $("#loadingCaption").text("Finding one available room...");
        }

        console.log("Finding rooms...")
        $.get(API, function(data) {
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
                if (specifyRoom) {
                    $("#loadingCaption").text("☹ Fail to join this room. You can wait a while, or create a room instead.");
                } else {
                    $("#loadingCaption").text("☹ Fail to join the room, we are trying to get another one...");
                    setTimeout(findOneRoom, 500);
                }
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
                    connection.close();
                    if (specifyRoom) {
                        $("#loadingCaption").text("☹ "+globalConf.profile._fail+". You can wait a while & refresh, or create a room instead.");
                        console.log("Encounter with fail: "+globalConf.profile._fail);
                    }
                    else {
                        $("#loadingCaption").text("☹ "+globalConf.profile._fail+". We are trying to get another one...");
                        console.log("Encounter with fail: "+globalConf.profile._fail);
                        setTimeout(findOneRoom, 500);
                    }
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

    function Start() {
        if (params.endpoint==null) {
            specifyRoom=false;
            findOneRoom();
        } else {
            connectTo(params.endpoint);
        }
    }
    if (window.localStorage.tutorial==null) window.localStorage.tutorial="3";
    var nowTime=-(-window.localStorage.tutorial);
    if (nowTime>0) {
        Tutorial.Draw();
        setTimeout(function() {
            Tutorial.Show(function() {
                var nowTime2=-(-window.localStorage.tutorial);
                window.localStorage.tutorial=""+(--nowTime2);
                Tutorial.Erase();
                Start();
            });
        }, 500)
    } else {
        Tutorial.Erase();
        Start();
    }


});
