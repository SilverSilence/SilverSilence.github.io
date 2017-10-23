var framerate = 30;
var intervalId;

var canvas = document.getElementById("world");
var ctx = canvas.getContext('2d');
var canvasHeight = 800;
var obstacleWidth = 20;
ctx.fillStyle = "aqua";

/*--------------- OBSTACLES ----------- */

var obstacleSpeed = 3;
var obstacleSpawnCounter = 0;
var obstacleSpawnRate = 70; //1000 / framerate --> 1 obstacle / second

var obstacleList = [];

//Height is 400px. If you want at least half of it to be open, make the obstacle occupy 200px.
function Obstacle() {
    this.lengthTop = Math.round(Math.random() * 500 + 1); //max length is 500
    this.lengthBot = 600 - this.lengthTop;
}

function createObstacle() {
    var obstacle = new Obstacle();

    //top left corner of bottom obstacle
    ctx.fillRect(980, canvasHeight - obstacle.lengthBot, 20, obstacle.lengthBot);

    //position of top obstacle (right corner)
    ctx.fillRect(980, 0, 20, obstacle.lengthTop);

    obstacleList.unshift([980, obstacle.lengthBot, "bot"]);
    obstacleList.unshift([980, obstacle.lengthTop, "top"]);
}

function moveObstacles() {
    var nextPosition;
    var obstacle, yCoordinate;
    for (var i = 0; i < obstacleList.length; i++) {
        obstacle = obstacleList[i];

        yCoordinate = obstacle[2] === "bot" ? canvasHeight - obstacle[1] : 0;
        ctx.clearRect(obstacle[0], yCoordinate, 20, obstacle[1]);

        //update position
        obstacle[0] -= obstacleSpeed;
        if (obstacle[0] < 0) {
            obstacleList.splice(i, 1);
        } else {
            ctx.fillRect(obstacle[0], yCoordinate, 20, obstacle[1]);
        }
    }
}

/*----------------- BIRD -------------- */

function Bird() {
    this.speedY = 0.0;
    this.positionY = 0.0;
    this.positionX = 100; //easier access than over css. It's equal to margin
}

Bird.prototype.jump = function () {
    this.speedY = -10.0;
};

var bird = new Bird(); //could have been made with a singleton but doesn't matter all that much.

/*----------------- WORLD -------------- */
var gravity = 1;

function intersectRect(obstacle) {

    //check x
    if (obstacle[0] > bird.positionX + 20) { //to the right
        return false;
    }
    if (obstacle[0] + 20 < bird.positionX) { //to the left
        return false;
    }
    
    var isBot = obstacle[2] === "bot";
    
    if (isBot) {
        if (canvasHeight - bird.positionY - 20 < obstacle[1]) {
            return true;
        }
    } else {
        if (bird.positionY < obstacle[1]) {
            return true;
        }
    }
    return false;
}

function showButton(button) {
    button.style["z-index"] = 1;
    button.style.display = "block";
}

function hideButton(button){
    button.style["z-index"] = -1;
    button.style.display = "none";
}


function checkCollissionWithObstacle() {
    var obstacle, collided = false;

    for (var i = 1; i < obstacleList.length; i++) { //could be improved by only checking the "first" 4
        obstacle = obstacleList[i];

        collided = intersectRect(obstacle);

        if (collided) {
            clearInterval(intervalId);
            console.log("Cleared interval with id:" + intervalId + " from game Flappy.")
            alert("You collided. Game Over");
            let button = document.getElementById("start_flappy");
            showButton(button);
            bird = new Bird();
            obstacleList = [];
            obstacleSpawnCounter = 0;
            break;
        }
    }
    return collided;
}

function updateStats() {
    ctx.clearRect(bird.positionX, bird.positionY, 20, 20);

    bird.speedY += gravity;
    bird.positionY += bird.speedY;

    //Don't go over the top
    bird.positionY = 0 > bird.positionY ? 0 : bird.positionY;
    //Don't fall through the ground
    bird.positionY = Math.min(bird.positionY, canvasHeight - 20);

    //Don't let gravity stack speed when on ground
    if (bird.positionY >= canvasHeight - 20) {
        bird.speedY = 0;
    }

    ctx.fillStyle = "white";
    ctx.fillRect(bird.positionX, bird.positionY, 20, 20);
    ctx.fillStyle = "aqua";
}

function step() {
    updateStats();
    obstacleSpawnCounter = obstacleSpawnCounter % obstacleSpawnRate;
    if (obstacleSpawnCounter === 0) {
        createObstacle();
    }
    obstacleSpawnCounter++;
    moveObstacles();
    let collided = checkCollissionWithObstacle();
}

function initGameLoopFlappy() {
    intervalId = setInterval(step, framerate);
    console.log("Started Interval with ID:" + intervalId);
}

function setupButton() {
    let button = document.getElementById("start_flappy");
    showButton(button);
    button.onclick = function() {
        hideButton(button);
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        initGameLoopFlappy();
    }
}

setupButton();

function flappyControls(e) {
    var charCode = (typeof e.which == "number") ? e.which : e.keyCode;
    if (charCode === 32) { //if space
        bird.jump();
    }
};