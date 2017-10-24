var binaryCanvas = document.getElementById("binary_bar");
function startBinaryHeader(){
    //Set intrinsic Canvas size
    
    let rect = binaryCanvas.getBoundingClientRect();
    binaryCanvas.width = rect.width;
    binaryCanvas.height = rect.height;
    
    //Add custom properties
    binaryCanvas.counterToNextNumber = 0;
    binaryCanvas.updateTimeCounter = updateTimeCounter;
    binaryCanvas.centerTextHeight = binaryCanvas.height / 2;
    binaryCanvas.appendNewRandomNumber = appendNewRandomNumber;
    binaryCanvas.textToWrite = "";
    binaryCanvas.updateStep = updateStep;
    binaryCanvas.isLengthBelowMargin = isLengthBelowMargin;
    binaryCanvas.overFlowMargin = 50;
    binaryCanvas.appendNewRandomNumber();
    
    //Get and setup context for drawing
    let binaryCtx = binaryCanvas.getContext('2d');
    binaryCtx.font = '35px Josefin Sans';
    binaryCtx.textBaseline = 'hanging';
    
    startDrawingLoop();
}

function startDrawingLoop() {
    let interValID = setInterval(updateStep, 1000/70);
}

function updateTimeCounter(){
    binaryCanvas.counterToNextNumber++;
    if(binaryCanvas.counterToNextNumber === 60) {
        binaryCanvas.counterToNextNumber = -30;
    }
}

function cutText(text){
    if (text.length > 20) {
        return text.slice(0, 20);
    }
    return text;
}

function updateStep(){
    binaryCanvas.updateTimeCounter();
    if (binaryCanvas.isLengthBelowMargin()){
        binaryCanvas.appendNewRandomNumber();
    }
    binaryCanvas.textToWrite = cutText(binaryCanvas.textToWrite);
    console.log("text to write:", binaryCanvas.textToWrite);
    console.log("counter:", binaryCanvas.counterToNextNumber);
    let binaryCtx = binaryCanvas.getContext("2d");
    binaryCtx.font = '35px Josefin Sans';
    binaryCtx.textBaseline = 'hanging';
    binaryCtx.lineWidth = 3;
    binaryCtx.fillText = (binaryCanvas.textToWrite, 200, binaryCanvas.centerTextHeight);
}

function isLengthBelowMargin(){
    let canvasWidth = parseInt(getComputedStyle(binaryCanvas).width + binaryCanvas.overFlowMargin);
    let textWidth = binaryCanvas.getContext("2d").measureText(binaryCanvas.textToWrite).width;
    let result = canvasWidth > textWidth;
    console.log(canvasWidth, textWidth, result);
    return result;     
}


function isTimeToSpawnNextNumber(){
    return binaryCanvas.counterToNextNumber === 0;
}


function appendNewRandomNumber(){
    let randomNumber = Math.round(Math.random()).toString();
    binaryCanvas.textToWrite = randomNumber + binaryCanvas.textToWrite;
}


startBinaryHeader();