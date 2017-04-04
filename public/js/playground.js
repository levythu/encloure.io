var OutSider={};
$(function() {
    OutSider.ShowWelcome=function() {
        $("#welcomeScreen").css("top", "0%");
    };
    OutSider.HideWelcome=function() {
        $("#welcomeScreen").css("top", "-110%");
    };
});
