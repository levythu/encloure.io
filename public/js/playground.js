var OutSider={};
$(function() {
    OutSider.ShowWelcome=function() {
        $("#welcomeScreen").css("top", "0%");
    };
    OutSider.HideWelcome=function() {
        $("#welcomeScreen").css("top", "-110%");
    };
    OutSider.ShowDeath=function() {
        $("#welcomeScreen .center").css("visibility", "hidden");
        $("#ScoreScreen").css("visibility", "visible");
        OutSider.ShowWelcome();
    };
    OutSider.GetBack=function() {
        if (_URL.params.type==="user")
            window.location="/user/play";
        else
            window.location="/quickgame";
    };

    $("#welcomeScreen .center").css("visibility", "hidden");
    $("#LoadingScreen").css("visibility", "visible");
});
