/*--------- Variables --------- */
var firstGame = true;
var score = 0;
var rows = 20;
var columns = 30;
var fieldSize = rows * columns;
var directions = {
    38: "up",
    40: "down",
    37: "left",
    39: "right"
};

function Snake() {
    this.direction= "up";
    this.queue= [];
    this.ids= [];
    this.head= {};
    this.tail= {};
}

var snake = new Snake();

var colors;
var gameLoop;
var foodField;
var ateFood;
var tat;
var squareSize = 30;
var stepSpeed = 150;

/*-------------- Game Functions ---------- */

function addFieldToBody(field) {
    snake.queue.unshift(field);
    snake.ids.unshift(field.id);
    field.classList.add("snake");
}

function setupHead(field) {
    field.classList.add("head");
    snake.head = field;
    addFieldToBody(field);
}

function setupTail(field) {
    field.classList.add("tail");
    snake.tail = field;
    addFieldToBody(field);
}

function getFieldById(id) {
    return snake.queue[id];
}

function makeTail() {
    var newLast = snake.queue[snake.queue.length - 1];
    newLast.classList.add("tail");
    snake.tail = newLast;
}

function removeTail() {
    snake.queue.pop();
    snake.ids.pop();
    snake.tail.classList.remove("tail");
    snake.tail.classList.remove("snake");
    makeTail();
}


function removeHead() {
    snake.queue[0].classList.remove("head");
}

function makeHead(field) {
    addFieldToBody(field);
    snake.queue[0].classList.add("head");
    snake.head = field;
}

/*-------------- Setup Functions ---------- */

function bodyWidth() {
    var width = columns * squareSize;
    let container = document.getElementsByClassName("snake_container")[0];
    container.style["max-width"] = width + "px";
}

function initSnake() {
    snake = new Snake();
    var center = document.getElementById(Math.floor((fieldSize + columns) / 2));
    setupHead(center);
    setupTail(center);
    snake.queue.pop(); //remove duplicate
    snake.ids.pop(); //remove duplicate
}

function removeFoodClass() {
    foodField.classList.remove("food");
}

function createFood() {
    var fieldId;
    while (true) {
        fieldId = Math.floor(Math.random() * (fieldSize + 1));
        if (!snake.ids.includes(fieldId.toString())) {
            break;
        }
    }
    if (foodField) {
        removeFoodClass();
    }
    foodField = document.getElementById(fieldId);
    foodField.classList.add("food");
}

function getNextHead() {
    var nextHead;
    var head = snake.head;
    switch (snake.direction) {
    case "up":
        nextHead = document.getElementById(parseInt(head.id) - columns);
        break;
    case "down":
        nextHead = document.getElementById(parseInt(head.id) + columns);
        break;
    case "left":
        nextHead = document.getElementById(parseInt(head.id) - 1);
        break;
    case "right":
        nextHead = document.getElementById(parseInt(head.id) + 1);
        break;
    default:
        alert("Direction error.");
        break;
    }
    return nextHead;
}

function moveSnake(nextHead) {
    removeHead();
    makeHead(nextHead);
    if (!ateFood) {
        removeTail();
    }
}


/*
Not in use
*/
function colorSnake() {
    for (var i = 1; i < snake.queue.length; i++) {
        snake.queue[i].style["background-color"] = "rgb(" + colors[0] + "," + (colors[1] + i) + "," + colors[2] + ")";
    }
}

function checkCollision() {
    if ((snake.queue.length > 1 && snake.ids.lastIndexOf(snake.head.id) > 0)) {
        clearInterval(gameLoop);
        alert("You collided. Game Over.\nYour score was: " + score);
        score = 0;
        toggleButton();
    }
    var dir = snake.head.getAttribute("dir");
    if (dir && dir === snake.direction) {
        clearInterval(gameLoop);
        alert("You collided with border. Game Over.\nYour score was: " + score);
        score = 0;
        toggleButton();
    }
}

function checkFood(nextHead) {
    ateFood = nextHead.id === foodField.id;
    if (ateFood) {
        score++;
        removeFoodClass();
        createFood();
    }
}

function initGameLoop() {
    gameLoop = setInterval(function () {
        checkCollision();
        var nextHead = getNextHead();
        checkFood(nextHead);
        moveSnake(nextHead);
        //        colorSnake();
    }, stepSpeed);
}

//Not in use
function getBaseColor() {
    var rgb = window.getComputedStyle(snake.head).color;
    colors = rgb.replace("rgb(", '').replace(")", '').split(', ');
    colors[0] = parseInt(colors[0]);
    colors[1] = parseInt(colors[1]);
    colors[2] = parseInt(colors[2]);
}

/*

Tilt and Tap Code

*/
function left() {
    snake.direction = "left";
    console.log(snake.direction);
}

function right() {
    snake.direction = "right";
    console.log(snake.direction);
}

function up() {
    snake.direction = "up";
    console.log(snake.direction);
}

function down() {
    snake.direction = "down";
    console.log(snake.direction);
}


function setupTat() {
    tat = new tiltandtap({
        tiltLeft: {
            callback: left
        },
        tiltRight: {
            callback: right
        },
        tiltUp: {
            callback: up
        },
        tiltRight: {
            callback: down
        },
    });
}

function toggleButton() {
    let button = document.getElementById("start_snake");
    if (button.style.display === "none") {
        button.style.display = "block";
    } else {
        button.style.display = "none";
        let board = document.getElementsByClassName("snake_container")[0];
        while (board.children.length > 1) {
            board.removeChild(board.lastChild);
        }
        setup();
    }
}

function setupStartGameButton() {
    let button = document.getElementById("start_snake");
    button.style.display = "block";
    button.onclick = toggleButton;
}

function setup() {
    bodyWidth();
    drawField();
    markBorder();
    initSnake();
    setupTat();
    getBaseColor();
    createFood();
    initGameLoop();
};

function markBorder() {
    var fields = document.getElementsByClassName("field");
    for (var i = 0; i < fieldSize; i++) {
        if (i < columns) {
            fields[i].setAttribute("dir", "up");
        } else if (i % columns === 0) {
            fields[i].setAttribute("dir", "left");
        } else if (i % columns === (columns - 1)) {
            fields[i].setAttribute("dir", "right");
        } else if (i > fieldSize - rows) {
            fields[i].setAttribute("dir", "down");
        }
    }
}

function drawField() {
    let container = document.getElementsByClassName("snake_container")[0];
    for (var i = 0; i < fieldSize; i++) {
        var div = document.createElement("div");
        div.id = i;
        div.setAttribute("row", Math.floor(i / rows));
        div.setAttribute("column", i % columns + 1);
        div.classList.add("field");
        div.style.width = squareSize + "px";
        div.style.height = squareSize + "px";
        container.appendChild(div);
    }
}


//Desktop Controls
document.onkeydown = function(e) {
    e = e || window.event;
    var charCode = (typeof e.which == "number") ? e.which : e.keyCode;
    if([37,38,39,40].includes(parseInt(charCode))) {
        e.preventDefault();
        snake.direction = directions[charCode.toString()];
    }
};

bodyWidth();
drawField();
setupStartGameButton();