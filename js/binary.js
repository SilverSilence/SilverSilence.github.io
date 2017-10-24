var binaryCanvas = document.getElementById("binary_bar");
function startBinaryHeader(){
    //Set intrinsic Canvas size
    
    let rect = binaryCanvas.getBoundingClientRect();
    binaryCanvas.width = rect.width;
    binaryCanvas.height = rect.height;
    
    //Add custom properties
    binaryCanvas.centerTextHeight = binaryCanvas.height / 2;
    binaryCanvas.appendNewRandomNumber = appendNewRandomNumber;
    binaryCanvas.textToWrite = "";
    binaryCanvas.overFlowMargin = 50;
    binaryCanvas.appendNewRandomNumber();

    //Get and setup context for drawing
    let binaryCtx = binaryCanvas.getContext('2d');
    binaryCtx.font = '35px Josefin Sans';
    binaryCtx.textBaseline = 'hanging';
    
    startDrawingLoop();
}

function startDrawingLoop() {
    let interValID = setInterval(updateStep, 200);
}

function cutText(text){
    if (text.length > 128) {
        return text.slice(0, 128);
    }
    return text;
}

function clearCanvas(context){
    context.clearRect(0, 0, binaryCanvas.width, binaryCanvas.height);
}

function writeTextToCanvas(context){
    context.fillText(binaryCanvas.textToWrite, 0, binaryCanvas.centerTextHeight);
}

function updateStep(){
    binaryCanvas.appendNewRandomNumber();
    binaryCanvas.textToWrite = cutText(binaryCanvas.textToWrite);
    
    let binaryCtx = binaryCanvas.getContext("2d");
    clearCanvas(binaryCtx);
    writeTextToCanvas(binaryCtx);
}


function appendNewRandomNumber(){
    let randomNumber = Math.round(Math.random()).toString();
    binaryCanvas.textToWrite = randomNumber + binaryCanvas.textToWrite;
}


startBinaryHeader();