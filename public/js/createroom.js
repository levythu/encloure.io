function loadImage() {
  var map = document.getElementById("mapselect").value;
  // document.getElementById("demo").innerHTML = "You selected: " + x;
  map = map.toLowerCase().replace(" ", "_");
  var src = "../maps/" + map + ".jpg";
  $("#thumbnail").attr("src",src);
}
window.onload = function() {
  loadImage();
};
