let binaryCanvas = document.getElementById("binary_bar");
let parent = document.getElementsByClassName("nav_container")[0];
binaryCanvas.height = parent.getBoundingClientRect().height;
binaryCanvas.width = parent.getBoundingClientRect().width;

let binaryCtx = binaryCanvas.getContext('2d');
let numberHeight = (binaryCanvas.height - 10)+"px" ;

binaryCtx.font = numberHeight;
binaryCtx.strokeText("Test");
