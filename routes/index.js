var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res) {
    res.sendFile('home.html', {
        root: './public/'
    }, function(err) {
        if (err) {
            console.log(err);
        }
    });
});

module.exports = router;
