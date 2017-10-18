let combinations = {
    0: [],
    1: [],
    2: [],
    3: [],
    4: [],
    5: [],
    6: [],
    7: [],
    8: [],
    9: [],
    10: [],
    11: [],
    12: [],
};

function subsetSum(numbers, target, partial) {
    var s, n, remaining;
  
    partial = partial || [];
  
    // sum partial
    s = partial.reduce(function (a, b) {
      return a + b;
    }, 0);
  
    // check if the partial sum is equals to target
    if (s === target) {
      combinations[target].push(partial);
    }
  
    if (s >= target) {
      return;  // if we reach the number why bother to continue
    }
  
    for (var i = 0; i < numbers.length; i++) {
      n = numbers[i];
      remaining = numbers.slice(i + 1);
      subsetSum(remaining, target, partial.concat([n]));
    }
};

for (let i = 0; i < 13; i++) {
    subsetSum([1,1,2,3,5],i);
}

function setStateOfBox(box) {
    let selMin = box.selectedForMinute;
    let selHour = box.selectedForHour;
    if (selMin && selHour) {
        box.state = "both";
    } else if (selMin) {
        box.state = "minute";
    } else if (selHour) {
        box.state = "hour"
    } else {
        box.state = "neutral";
    }
}

let boxes = document.getElementsByClassName("clock_item");

for (let box of boxes){
    box.selectedForMinute = false;
    box.selectedForHour = false;
    setStateOfBox(box);
}


let clockElem = document.getElementsByClassName("fibonacci_clock")[0];

let stateToColor = {
    "neutral": "white",
    "minute":  "green", 
    "hour":    "red",
    "both":    "blue", 
}


//Checks if the clock needs to be updated every minute
function runClock() {
    let now = new Date();
    let timeToNextTick = (60 - now.getSeconds()) * 1000 - now.getMilliseconds();
    setTimeout(function() {
        updateClockDisplay(now);
        runClock();
    }, timeToNextTick);
};

function updateClockDisplay(now) {
    resetColorsAndState();
    updateMinuteColors(now);
    updateHourColors(now);
};

function resetColorsAndState() {
    for (let box of boxes) {
        box.selectedForHour = false;
        box.selectedForMinute = false;
        box.state = "neutral";
        changeColorOfBox(box);
    }
};

function updateMinuteColors(now){
    let minutes = now.getMinutes();
    let targetValue = Math.floor(minutes / 5);
    
    let indices = targetValue ? getIndicesOfBoxesToHighlight(targetValue) : [];
    for (let index of indices){
        boxes[index].selectedForMinute = true;
        setStateOfBox(boxes[index]);
    }
    changeColorOfBoxesGivenIndices(indices);
}

function updateHourColors(now){
    let hours = now.getHours();
    let targetValue = hours > 12 ? hours - 12 : hours;
    
    let indices = hours ? getIndicesOfBoxesToHighlight(targetValue) : [];
    for (let index of indices){
        boxes[index].selectedForHour = true;
        setStateOfBox(boxes[index]);
    }
    changeColorOfBoxesGivenIndices(indices);
}

function changeColorOfBoxesGivenIndices(indices) {
    for(let index of indices) {
        changeColorOfBox(boxes[index]);
    }
}

function changeColorOfBox(box){
    box.style.backgroundColor = stateToColor[box.state];
}

function getIndicesOfBoxesToHighlight(targetValue){
    //Get combination and with it the boxes that have to change color:
    let possibleCombinations = combinations[targetValue].slice();
    //Pick a possible combination randomly
    let indices = possibleCombinations[Math.floor(Math.random()*possibleCombinations.length)].slice();

    //check if both 1-boxes are needed
    if (new Set(indices) !== indices) {
        indices[0] = 0;
    }
    var boxIndices = indices.map((x) => x == 5 ? 4 : x);
    return boxIndices;
};
updateClockDisplay(new Date());
runClock();