
var count=0;

function liveHandler(ws, req) {
    var thisCount=(count++);
    console.log("Client "+thisCount+" connects.");
    ws.on("message", function(msg) {
        ws.send(msg);
    });
    ws.on("close", function(msg) {
        console.log("Client "+thisCount+" disconnects.");
    });
};

module.exports=liveHandler;
