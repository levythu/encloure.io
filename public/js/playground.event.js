$(function(){
    var KEY_UP=38;
    var KEY_DOWN=40;
    var KEY_LEFT=37;
    var KEY_RIGHT=39;
    var KEY_SPACE=32;

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
            //N.send({sprint: 1});
            break;
        default:
            return;
        }
        return false;
    }

    $("body").on("gm-init", function() {
        document.onkeydown=keyboardHook;
    });

});
