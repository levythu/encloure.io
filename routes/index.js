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

router.get('/playground', function(req, res){
  res.sendFile('playground.html', {
        root: './public/'
    }, function(err) {
        if (err) {
            console.log(err);
        }
    });
});

module.exports = router;
