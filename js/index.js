window.onload = function () {
    
    //Variables
    var sliderID;
    var imageTag = document.getElementsByClassName("slide")[0];
    var index = 0;
    var pathPrefix = "resources/images/slide_show/";
    var endings = [".jpg", ".jpg", ".jpg", ".jpg", ".png", ".jpg", ".png", ".jpg", ".jpg", ".png", ".png",".jpg",".jpg",]
    
    
    //Change image every 2 seconds
    sliderID= setInterval(function() {
        index = 1 + (index % 13);
        imageTag.src = pathPrefix + index + endings[index-1];
    }, 10000);
    
}