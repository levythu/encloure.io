var db = require("./db").db;

db.maps.remove({}, function() {
    console.log("Done");
});
