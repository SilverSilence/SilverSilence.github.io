var AbstractMovements = function() {
    //Will be overwritten
};

AbstractMovements.prototype.setPositionUpdate = function(element, moveName, direction, gravity) {
    switch(moveName) {
        case 'airHockeyMove':
        case 'balanceBoardMove':
            element.updatePosition = Controller.setNextNoZonedPosition;
            break;
        default:
            if (direction) {
                element.updatePosition = direction === 'vertical' ? Controller.setVerticalPosition : Controller.setHorizontalPosition;
            } 
            else { //Note: for now, only 2D has gravity
                if (gravity) {
                    element.updatePosition = Controller.setNextZonedPosition;
                    element.setHorizontalPosition = Controller.setHorizontalPositionIncludingGravity;
                    element.setVerticalPosition = Controller.setVerticalPositionIncludingGravity;
                } 
                else {
                    element.updatePosition = Controller.setNextZonedPosition;
                    element.setHorizontalPosition = Controller.setHorizontalPosition;
                    element.setVerticalPosition = Controller.setVerticalPosition;
                }
            }
        }
};

AbstractMovements.prototype.setMoveType = function(element, moveType, direction) {
    if (!moveType) {
        moveType = 
        {
            name : 'constantMove',
            settings : {
                moveData: {
                    speed: 5,
                },
                zone: {
                    type: 'angles',
                    vertical: [-10,10],
                    horizontal: [-15,15]
                }
            }
        };
    }
    
    var _settings = moveType.settings;
    
    if (moveType.name === "mapSliderGallery" && element.id === "the_ball_ID") { //Note: what if ID specified?
        //set movetype if specified or go to default
        element.move = this.movements[_settings.moveData.moveName].move || this.movements.constantMove.move;
    } else {
        //Set moveType
        element.move = this.movements[moveType.name].move || this.movements.constantMove.move;
        
        if (moveType.name === 'balanceBoardMove') { //Note: what about 1d?
            return; //No need for all the stuff below
        }
    }
    
    if (_settings && !_settings.moveData)
        _settings.moveData = {}; //Allow for defaults
    if (_settings && _settings.moveData) { //Note: The movedata should not be checked, otherwise we have no defaults?
        //Set speed
        element.originalSpeed = _settings.moveData['speed'] || 0 ; //Note is zero clever as default speed?
        element.currentSpeed = _settings.moveData['speed'] || 0;
        element.speedX = element.originalSpeed;
        element.speedY = element.originalSpeed;
        //set acceleration
        element.originalAcceleration = _settings.moveData['acceleration'] || 0;
        element.currentAcceleration = _settings.moveData['acceleration'] || 0;
        element.accelerationX = element.originalAcceleration;
        element.accelerationY = element.originalAcceleration;
        //set deceleration
        element.originalDeceleration = moveType.settings.moveData['deceleration'] || 0;
        element.currentDeceleration = moveType.settings.moveData['deceleration'] || 0;
        element.decelerationX = element.originalDeceleration;
        element.decelerationY = element.originalDeceleration;
        
        if (direction) { //Note does this belong here?
            element.direction = direction !== 'horizontal' ? 'top' : 'left'; //Note: only one movement type uses this
            element.number = direction === 'horizontal' ? 0 : 1; //Used for right access of acceleration
            element.speed = direction === 'horizontal' ? 'speedX' : 'speedY';
        }
    }
};

/*
Info:
    y-axis / gamma: left-to-right (left being negative)
    x-axis / beta: front-to-back (back being negative)
    alpha: compass direction
*/    


var Movements1D = function() {
    //Add 1d movements here (overwrite from abstract class)
    this.movements = {
        twoZonedMove: {
            move: function(zoneData, index) {
                if(index) {
                    this[this.speed] += this.currentAcceleration;
                    this[this.speed] = this[this.speed] > 50 ? 50 : this[this.speed];
                } else {
                    this[this.speed] = this.originalSpeed;
                }
            }
        },
        
        /*
            This movement is used when the gallery as non-uniformly sized elements.
            So we retrieve the size and jump by 1 element.
        */
        stepMove: {
            move: function(zoneData) {
                //TODO implement
            }
        },
        /*
            This movement type counts the number of elements and divides the slider
            into equally many parts. Then it them onto each other, the ball centering the
            image it's currently on. TODO: that's not true at all... ^^'
        */
        mapSliderGallery: {
            move: function(zoneData) {
                var ballPositionPX = parseFloat(Controller.the_ball.style[this.direction]);
                //Note: room for performance?
                var divisor = (Controller.containerSize[Controller.side] - Controller.ballSize[Controller.side]);
                var ballPercentage = ballPositionPX / divisor;
                
                //Note: this would be maxTop... performance?
                this.style[this.direction] = ((Controller.frameSize[Controller.side] - Controller.gallerySize[Controller.side]) * ballPercentage) + "px";
            }
        },
        
        /*
            This movement type ignores device acceleration and angle but adds a constant
            acceleration to the speed as long as the device is tilted in the same
            direction. On stop, the speed is reset.
        */
        staticAccelerationMove: {
            move: function(zoneData) {
                if (zoneData === null) {
                    this[this.speed] = this.originalSpeed;
                } else {
                    //Add acceleration
                    this[this.speed] += this.currentAcceleration;
                }
            }
        },         
        
        /*
            This movement is the same as above but for uniformly-sized elements.
            It should thus be more performant because the step size stays the same.
        */
        uniformMove: {
            move: function(element, event) {
                //TODO implement
            }
        },
        
        constantMove : {
            move : function(zoneData) {
                
            }
        },
        
        dynamicAccelerationMove : {
            move : function(zoneData) {
                 //Note: when setting this to 1D, gallery should still scroll when ball hits border
                var accelerations = this.getAcceleration(this.event);
                //TODO check which acceleration is needed
                var acceleration = Math.abs(accelerations[this.number]);

                if (zoneData === null) {
                    this[this.speed] = this.originalSpeed;
                    this.currentAcceleration = this.originalAcceleration;
                } else {
                    this[this.speed] += acceleration;
                }
            }
        }
    };
};

var Movements2D = function() {
    //Add 2d movements here (overwrite from abstract class)
    this.movements = {
        
        //TODO add this to 1D
        balanceBoardMove: {
            move: function(zoneData) {
                var angles = Controller.getAngles();
                var left = angles[0];
                var top = angles[1];
                
                this.speedX = left*0.7;
                this.speedY = (top - Controller.calibrationAngle)*0.7; //usually, people don't hold it straight flat. Thus, add threshold to balance it out
            }
        },
        
        
        /*
            ... weird movement type :P
            This movement type is similar to the static and dynamic acceleration but unlike the others, the ball
            doesn't stop immediately. Instead, it decellerates when there's "no movement". Still buggy...
        */
        //TODO rename
        airHockeyMove: {
            move: function(zoneData) {
                //Get acceleration
                var acceleration = this.getAcceleration(this.event);
                //Allow for negatives here
                //TODO replace with filter
                var x = Math.abs(acceleration[0]) > 0.5 ? acceleration[0] : 0;
                var y = Math.abs(acceleration[1]) > 0.5 ? acceleration[1] : 0;
                
                //Check where the ball is (going)
                if (zoneData.left === null) {
                    this.accelerationX = this.originalAcceleration;
                    this.speedX *= this.currentDeceleration;
                } else {
                    this.accelerationX = x;
                    this.speedX += this.accelerationX;
                }
                
                if (zoneData.top === null) {
                    this.accelerationY = this.originalAcceleration;
                    this.speedY *= this.currentDeceleration;
                } else {
                    this.accelerationY = y;
                    this.speedY += this.accelerationY;
                }
            }
        },
        
        
        
        /*
            This movement type takes device acceleration into account (NOT rotationrate!) as well as any
            specified by the developer.
            TODO: make a new movement where the acceleration
            is not cumulative.
        */
        dynamicAccelerationMove : {
            move: function(zoneData) {
                //Note: when setting this to 1D, gallery should still scroll when ball hits border
                var acceleration = this.getAcceleration(this.event);
                var accelerationX = Math.abs(acceleration[0]);
                var accelerationY = Math.abs(acceleration[1]);
                
                if (zoneData.left === null) {
                    this.speedX = this.originalSpeed;
                    this.accelerationX = this.originalAcceleration;
                } else {
                    this.accelerationX += accelerationX;
                    this.speedX += this.accelerationX;
                }
                
                if (zoneData.top === null) {
                    this.speedY = this.originalSpeed;
                    this.accelerationY = this.originalAcceleration;
                } else {
                    this.accelerationY += accelerationY;
                    this.speedY += this.accelerationY;
                }
            }
        },
        
        /*
            This movement type ignores device acceleration, angle and any acceleration
            specified by the developer. Thus, the speed is constant in all situations.
        */
        constantMove: {
            move: function(zoneData) {

            }
        },

        /*
            This movement looks at the ratio of the current angle and the range of the angles. 
            It then maps these percentages onto the element's 'top' or 'left' properties. 
            Thus achieving a direct mapping to the position in the container.
        */
        //TODO think of a descriptive name
        mappedContainerMove: {
            move: function(zoneData) {
                var relativeLeft, relativeTop;
                
                //Maximal position percentages for the ball to stay within container
                var maxTop = this.maxTopPercent;
                var maxLeft = this.maxLeftPercent;

                var angles = Controller.getAngles();
                var gamma = angles[0];
                var beta = angles[1];
                
                var zoneV = this.zone.vertical;
                var zoneH = this.zone.horizontal;
                    
                var leftStyle = parseFloat(this.style.left);
                var topStyle = parseFloat(this.style.top);
                
                //TODO use threshold checkers instead
                
                //Horizontal range
                if (gamma < zoneH[0])
                    this.style.left = "0%";
                else if (gamma <= zoneH[1] ) {
                    relativeLeft = (gamma - zoneH[0]) / this.zone['rangeH'] *100;
                    this.style.left = Math.min(maxLeft,relativeLeft) + "%";
                }
                else {
                    this.style.left = maxLeft + "%";
                }
                
                //Vertical range
                if (beta < zoneV[0])
                    this.style.top = "0%";
                else if (beta <= zoneV[1] ) {
                    relativeTop = (beta - zoneV[0])/ this.zone['rangeV'] *100;
                    this.style.top = Math.min(maxTop, relativeTop) + "%";
                }
                else {
                    this.style.top = maxTop + "%";
                }
            },
        },
        
        positionControlWithGravity : {
            move: function(moveData) {
                var relativeLeft, relativeTop;
                
                //Maximal position percentages for the ball to stay within container
                //TODO precompute and store these values
                var maxTop = 100.0 - Controller.ballSize.height / Controller.containerSize.height * 100.0;
                var maxLeft = 100.0 - Controller.ballSize.width / Controller.containerSize.width * 100.0;

                var angles = Controller.getAngles();
                var gamma = angles[0];
                var beta = angles[1];
                
                var zoneV = this.zone.vertical;
                var zoneH = this.zone.horizontal;
                    
                var leftStyle = parseFloat(this.style.left);
                var topStyle = parseFloat(this.style.top);
                
                //Horizontal range
                if (gamma < zoneH[0])
                    leftStyle = this.minLeft;
                else if (gamma <= zoneH[1] ) {
                    relativeLeft = (gamma - zoneH[0]) / this.zone['rangeH'];
                    leftStyle = this.maxLeft * relativeLeft;
                }
                else {
                    leftStyle = this.maxLeft;
                }
                
                //Vertical range
                if (beta < zoneV[0])
                    topStyle = this.minTop;
                else if (beta <= zoneV[1] ) {
                    relativeTop = (beta - zoneV[0])/ this.zone['rangeV'];
                    topStyle = this.maxTop * relativeTop;
                }
                else {
                    topStyle = this.maxTop;
                }
                
                //simulate future position
                var virtualObj = { 
                    offsetTop: topStyle,
                    offsetBottom: (maxTop+this.offsetHeight-topStyle),
                    offsetHeight: this.offsetHeight, 
                    offsetRight: (maxLeft+this.offsetWidth-leftStyle),
                    offsetLeft: leftStyle, 
                    offsetWidth: this.offsetWidth,
                };
                
                var collidedWith = this.collidedWith;
                
                if (!(collidedWith && Controller.detectCollision(collidedWith,virtualObj))) {
                    if ( this.lastTop && 
                        (Math.abs(leftStyle - this.lastLeft) > this.offsetWidth ||
                         Math.abs(topStyle - this.lastTop) > this.offsetHeight)) 
                    {
                        this.lastLeft = null;
                        this.lastTop = null;
                        this.style.top = topStyle + "px";
                        this.style.left = leftStyle + "px";
                    } else if (!this.lastTop) {
                        this.style.top = topStyle + "px";
                        this.style.left = leftStyle + "px";
                    }
                } else {
                    if (!this.lastTop) {
                        this.lastTop = topStyle;
                        this.lastLeft = leftStyle;
                    }
                    this.style.left = collidedWith.offsetLeft + "px";
                    this.style.top = collidedWith.offsetTop + "px";
                }
            }
        },
        
        /*
            This movement type ignores device acceleration and angle but adds a constant
            acceleration to the speed as long as the device is tilted in the same
            direction. On stop, the speed is reset.
        */
        staticAccelerationMove: {
            move: function(zoneData) {

                //check if there was no movement
                if (zoneData.left === null) {
                    this.speedX = this.originalSpeed;
                    this.accelerationX = this.originalAcceleration;
                } else {
                    //TODO might have to adapt/decrease acceleration or set limits
                    this.speedX += this.accelerationX;
                }
                
                if (zoneData.top === null) {
                    this.speedY = this.originalSpeed;
                    this.accelerationY = this.originalAcceleration;
                } else {
                    this.speedY += this.accelerationY;
                }
            }
        },            
    };
};

//Inherit methods from AbstractMovements to Movements2d
Movements2D.prototype = Object.create(AbstractMovements.prototype);
Movements1D.prototype = Object.create(AbstractMovements.prototype);