var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res) {
    if (req.session.author != undefined){
        res.redirect('user/play');
    }
    else{
        res.redirect('user/login');
    }
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

router.get('/quickgame', function(req, res) {
    res.render('quickgame', {});
});

router.post('/quickgame', function(req, res){
    var token = encodeURIComponent(req.body.name);
    var type = "quickgame";
    res.redirect('/playground#token='+token+'&type='+type);
});

module.exports = router;
