function beginSlider() {
    
    //Variables
    var sliderID;
    var imageTag = document.getElementsByClassName("slide")[0];
    var index = 0;
    var pathPrefix = "resources/images/slide_show/";
    var endings = [".jpg", ".jpg", ".jpg", ".jpg", ".jpg", ".jpg", ".jpg"]
    var numberOfImages = 7;
    
    //Change image every 2 seconds
    sliderID= setInterval(function() {
        index = 1 + (index % numberOfImages);
        imageTag.src = pathPrefix + index + endings[index-1];
    }, 3000);
    
};

beginSlider();