$(function(){
    var KEY_UP=38;
    var KEY_DOWN=40;
    var KEY_LEFT=37;
    var KEY_RIGHT=39;
    var KEY_SPACE=32;
    var KEY_ENTER=13;
    var KEY_A=65;
    var KEY_S=83;
    var KEY_D=68;
    var KEY_Q=81;
    var KEY_W=87;
    var KEY_E=69;
    var KEY_CTRL=17;

    var lastTime=0;
    function sendWord(word) {
        var now=(new Date()).getTime();
        if (now-lastTime<=1000) return;
        lastTime=now;
        N.send({hey: word});
    }

    function keyboardHook(e) {
        var keyPressed=e.keyCode;
        switch (keyPressed) {
        case KEY_LEFT:
            N.send({dir: "l"});
            break;
        case KEY_RIGHT:
            N.send({dir: "r"});
            break;
        case KEY_UP:
            N.send({dir: "u"});
            break;
        case KEY_DOWN:
            N.send({dir: "d"});
            break;
        case KEY_SPACE:
            N.send({sprint: 1});
            break;
        case KEY_ENTER:
            if (window.__isDead===true) {
                window.location.reload();
            }
            break;
        case KEY_A:
            sendWord("Hey!");
            break;
        case KEY_S:
            sendWord("Good Game");
            break;
        case KEY_D:
            sendWord("I'm Sorry");
            break;
        case KEY_Q:
            sendWord("😂😂😂");
            break;
        case KEY_W:
            sendWord("😡😡😡");
            break;
        case KEY_E:
            sendWord("😏😏😏");
            break;
        case KEY_CTRL:
            if (window.localStorage.word2Say && window.localStorage.word2Say.length>0) {
                sendWord(window.localStorage.word2Say);
                break;
            }
        default:
            return;
        }
        return false;
    }

    $("body").on("gm-init", function() {
        document.onkeydown=keyboardHook;
    });

});
