class Drop {
    constructor() {
        this.reset();
    }
    
    display() {
        stroke(255);
        strokeWeight(this.thickness);
        line(this.x, this.y, this.x, this.y + this.len);
    }

    fall() {
        this.y += this.speed;
        this.speed += this.gravity;
        if (this.y > height) {
            this.reset();
        }
    }

    reset() {
        this.z = random(20); //0 close, 20 far
        this.gravity = map(this.z, 0, 20, 0.05, 0);
        this.speed = map(this.z, 0, 20, 15, 5);
        this.thickness = map(this.z, 0, 20, 3, 1);
        this.len = map(this.z, 0, 20, 20, 10);
        this.y = random(-200, -100);
        this.x = random(width);
    }
}
