var conf=require("../settings");
var game=require("./game");
var WebSocket=require("ws");

function NewServer(callback, gameConf=conf.game.defaultMap) {
    var count=0;
    var clients={};

    var server={};
    var g=game.NewGame(server, gameConf);
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
        } catch (e) {
            return;
        }
        g.onControl(client.profile.id, obj);
    }
    server.onDisconnect=function(client) {

    }

    var wss = new WebSocket.Server({ port: 0 }, function() {
        callback("ws://"+conf.server.hostname+":"+wss._server.address().port);
    });
    wss.on('connection', function(ws) {
        var thisCount=""+(count++);
        console.log("Client #"+thisCount+" connects.");

        var client={
            ws: ws,
            ready:   false,
            msgPend: [],
            profile: {
                id: thisCount,
            },
        };
        clients[thisCount]=client;
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
