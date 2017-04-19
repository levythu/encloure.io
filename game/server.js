var conf=require("../settings");
var game=require("./game");
var WebSocket=require("ws");

var request=require("request");

function UnregisterRoom(endpoint) {
    request.post(conf.server.masterEndPoint+"/gm/unregisterRoom", {form: {
        gameEndpoint: endpoint,
        secret: conf.server.masterSecret,
    }}, function(err) {
        if (err) console.error(err);
    });
}

function NewServer(callback, gameConf, playerConf) {
    var count=0;
    var clients={};

    var server={};
    var g=game.NewGame(server, gameConf, playerConf);
    server._g=g;
    var watchDog=-1;
    var YellowCard=false;

    function checkForNoUser() {
        if (Object.keys(clients).length==0) {
            if (!YellowCard) {
                YellowCard=true
            } else {
                clearInterval(watchDog);
                console.log("Terminate game at "+server.endpoint);
                server.wss.close();
                g.Stop();
                UnregisterRoom(server.endpoint);
            }
        } else {
            YellowCard=false;
        }
    }
    server.onConnect=function(client) {
        var tConf={};
        for (i in conf.game) tConf[i]=conf.game[i];
        for (i in gameConf) tConf[i]=gameConf[i];

        g.JoinNewPlayer(client.profile.id, client.profile);
        tConf.profile=client.profile;
        tConf.timestamp=(new Date()).getTime();

        try {
            client.ws.send(JSON.stringify(tConf));
            for (var i=0; i<client.msgPend.length; i++) {
                client.ws.send(client.msgPend[i]);
            }
            client.msgPend=[];
            client.ready=true;
        } catch (e) {
            // TODO remove the dead socket
        }
    }
    server.onMessage=function(client, message) {
        var obj;
        try {
            obj=JSON.parse(message);
            if (obj._init===true) return;
        } catch (e) {
            return;
        }
        g.onControl(client.profile.id, obj);
    }
    server.onDisconnect=function(client) {

    }

    function waitForValidation(message, succ, fail) {
        var obj;
        try {
            obj=JSON.parse(message);
            if (obj.type==="user") {
                request.get(conf.server.masterEndPoint+"/auth?token="+obj.token, {}, function(err, response, body) {
                    if (err) {
                        fail();
                        return;
                    }
                    var ret=JSON.parse(body);
                    if ("username" in ret) {
                        succ({
                            nick: ret.username,
                        }, obj.token);
                    } else {
                        fail();
                    }
                });
            } else {
                succ({
                    nick: obj.token,
                }, "NOT_A_TOKEN");
            }
        } catch (e) {
            fail();
        }
    }
    var wss = new WebSocket.Server({ port: 0 }, function() {
        server.endpoint="ws://"+conf.server.hostname+":"+wss._server.address().port;
        server.wss=wss;
        g.endpoint=server.endpoint;
        watchDog=setInterval(checkForNoUser, conf.game.GraceTime);
        callback(server.endpoint, server);
    });
    server.tokenMap={};
    wss.on('connection', function(ws) {
        ws.once("message", function(msg) {
            waitForValidation(msg, function(profile, token) {
                var thisCount=""+(count++);
                console.log("Client #"+thisCount+" connects.");

                var client={
                    ws: ws,
                    ready:   false,
                    msgPend: [],
                    profile: {
                        id: thisCount,
                        nick: profile.nick,
                    },
                };
                clients[thisCount]=client;
                if (token!="NOT_A_TOKEN")
                server.tokenMap[thisCount]=token;

                ws.on("message", function(msg) {
                    // console.log(msg);
                    server.onMessage(client, msg);
                });
                ws.on("close", function(msg) {
                    console.log("Client #"+thisCount+" disconnects.");
                    server.onDisconnect(client);
                    delete clients[thisCount];
                });
                server.onConnect(client);
            }, function() {
                ws.send(JSON.stringify({
                    _fail: "Fail to validate token... will return lobby soon.",
                    _fatalFail: true,
                }));
                try {
                    ws.close();
                } catch (e) {
                    console.error(e);
                }
            });
        });
    });
    // obj is a js-object
    server.Broadcast=function(obj) {
        for (i in clients) {
            try {
                if (clients[i].ready)
                    clients[i].ws.send(JSON.stringify(obj));
                else
                    clients[i].msgPend.push(JSON.stringify(obj));
            } catch (e) {
                delete clients[i];
            }
        }
    }
    // obj is a js-object
    server.Send=function(id, obj) {
        var c=clients[id];
        if (c==null) return;
        try {
            if (c.ready)
                c.ws.send(JSON.stringify(obj));
            else
                c.msgPend.push(JSON.stringify(obj));
        } catch (e) {
            delete clients[id];
        }
    }

    g.Start();
}

exports.NewServer=NewServer;
