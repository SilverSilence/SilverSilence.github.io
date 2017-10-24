function startBinaryHeader(){
    //Sets intrinsic Canvas size
    let binaryCanvas = document.getElementById("binary_bar");
    let rect = binaryCanvas.getBoundingClientRect();
    binaryCanvas.width = rect.width;
    binaryCanvas.height = rect.height;
    binaryCanvas.counterToNextNumber
    //Get context for drawing
    let binaryCtx = binaryCanvas.getContext('2d');
    
    binaryCtx.font = '20px Josefin Sans';
    binaryCtx.textBaseline = 'top';
    binaryCtx.fillText("Test", 0, binaryCanvas.height/2);
}

function startDrawingLoop() {
    let interValID = setInterval(updateCanvas(), 1000/70);
}

function updateCanvas(){

}



startBinaryHeader();