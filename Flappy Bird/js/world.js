var framerate = 30;
var intervalId;

var canvas = document.getElementById("world");
var ctx = canvas.getContext('2d');
ctx.fillStyle = "aqua";

/*--------------- OBSTACLES ----------- */

var obstacleSpeed = 3;
var obstacleSpawnCounter = 0;
var obstacleSpawnRate = 50; //1000 / framerate --> 1 obstacle / second

var obstacleList = [];

//Height is 400px. If you want at least half of it to be open, make the obstacle occupy 200px.
function Obstacle() {
    this.lengthTop = Math.round(Math.random() * 100 + 1); //max length is 100
    this.lengthBot = 200 - this.lengthTop;
}

function createObstacle() {
    var obstacle = new Obstacle();

    //top left corner of bottom obstacle
    ctx.fillRect(980, 400 - obstacle.lengthBot, 20, obstacle.lengthBot);

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

        yCoordinate = obstacle[2] === "bot" ? 400 - obstacle[1] : 0;
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
        if (400 - bird.positionY - 20 < obstacle[1]) {
            return true;
        }
    } else {
        if (bird.positionY < obstacle[1]) {
            return true;
        }
    }
    return false;
}

function checkCollission() {
    var obstacle, collided = false;

    for (var i = 1; i < obstacleList.length; i++) { //could be improved by only checking the "first" 4
        obstacle = obstacleList[i];

        collided = intersectRect(obstacle);

        if (collided) {
            clearInterval(intervalId);
            alert("You collided. Game Over");
        }
    }
}

function updateStats() {
    ctx.clearRect(bird.positionX, bird.positionY, 20, 20);

    bird.speedY += gravity;
    bird.positionY += bird.speedY;

    //Don't go over the top
    bird.positionY = 0 > bird.positionY ? 0 : bird.positionY;
    //Don't fall through the ground
    bird.positionY = Math.min(bird.positionY, 380);

    //Don't let gravity stack speed when on ground
    if (bird.positionY === 380) {
        bird.speedY = 0;
    }

    ctx.fillStyle = "white";
    ctx.fillRect(bird.positionX, bird.positionY, 20, 20);
    ctx.fillStyle = "aqua";
}

function initGameLoop() {
    intervalId = setInterval(function () {
        updateStats();
        obstacleSpawnCounter = obstacleSpawnCounter % obstacleSpawnRate;
        if (obstacleSpawnCounter === 0) {
            createObstacle();
        }
        obstacleSpawnCounter++;
        moveObstacles();
        checkCollission();
    }, framerate);
}

function setup() {
    initGameLoop();
}

document.addEventListener('DOMContentLoaded', setup, false);
document.onkeydown = function (e) {
    e = e || window.event;
    var charCode = e.keyCode;
    if (charCode === 32) { //if space
        bird.jump();
    }
};