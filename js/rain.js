var drops = [];

function setup() {
    var myCanvas = createCanvas(1000,800);
    myCanvas.parent("rain_canvas");
    for(var i = 0; i < 500; i++) {
        var drop = new Drop();
        drop.reset();
        drops.push(drop);
    }
    frameRate(60);
}

function draw() {
    background(0);
    for(var i = 0; i < drops.length; i++) {
        drops[i].display();
        drops[i].fall();
    }
}