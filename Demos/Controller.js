//A controller to store all the utility functions
//I keep it as an object instead of a class because we really only need one
'use strict';

var Controller = {
//--------------- VARIABLES -------------- //

    containerSize: {
        height: null,
        width: null
    },
    
    zone: {
        type: null, //angles, acceleration, rotationrate
        vertical: null, 
        horizontal: null
    },
    
    //Stored on deviceorientation event
    currentAngles: {
        left: null,
        top: null
    },

    gallerySize: {
        height: null,
        width: null
    },
    
    ballSize: {
        height: null,
        width: null
    },
    
    frameSize: {
        left: null,
        top: null,
        height: null,
        width: null
    },
    
    the_ball : null,
    the_container: null,
    the_gallery : null,
    images : null,
    borders : null, // [top, bottom] or [left, right]
    posSide : null, //top or left
    frameOffsetMiddle : null,
    direction : null, //vertical or horizontal or null
    side: null, //width or height
    selectedImg : { img: null, index: null},
    restrictorType: null,
    //Stores which operation we have to execute when updating the position
    sign: { left: null, top: null},
    
    centerPoints : [], //array of points marking center of elements
    gravityRadius : 250, //px
    gravityForce: 5,
    inGravityField : true,
    gravDiffX: null,
    gravDiffY: null,
    
//--------------- FUNCTIONS -------------- //
    //Used to store '+' and '-'
    operators: {
        '+': function(a, b) { return a + b },
        '-': function(a, b) { return a - b },
    },
    
    setupController : function(settings, imageSelector, direction) {
        this.direction = direction;
        
        this.setKeepInContainer(direction);
        
        this.setupGravity(settings);
        
        this.setSide(direction);
        
        this.setBorders(direction);
        
        this.setImageSelector(imageSelector);
    },
    
    isPortrait : function() {
        return window.matchMedia("(orientation: portrait)").matches;
    },
    
    setupGravity : function(settings) {
        if (settings.gravity !== null || settings.gravity !== undefined) {
            var _gravity = settings.gravity;
            
            if (_gravity instanceof Boolean && _gravity === true) {
                //TODO: implement this, currently not used
            }
            else if (_gravity instanceof Array) {
                this.gravityForce = _gravity[0];
                this.gravityRadius = _gravity[1];
            }
            
            else if (_gravity === "auto") {
                //Note: for now, keep as it is
            }
            else {
                this.inGravityField = false;
            }
        }
        this.checkInteraction = this.inGravityField ? this.checkInteractionWithGravity : this.checkInteraction;
    },
    
    //Note: bad name
    setupBall : function(the_ball, container, settings ) {
        this.the_ball = the_ball;
        this.the_container = container;
        
        this.storeBallData(the_ball);
        this.storeContainerSize(container);
    }, //Note: bad name,
    
    //Note: bad name
    setupGallery : function(gallery, settings, callback, direction) {
        this.the_gallery = gallery;
        this.storeGalleryData(gallery);
        this.storeFrameData(gallery.parentNode);
        this.img_callback = callback;
        var frameData = this.frameSize;
        //Compute the middle of the frame to compare image position with
        var frameOffsetMiddle = direction === 'vertical' ? frameData.top + frameData.height / 2 : frameData.left + frameData.width / 2;
        this.frameOffsetMiddle = frameOffsetMiddle;
        this.offsetFromViewport = frameOffsetMiddle + frameData[this.borders[0]];
        
        //Get images and store them
        var images = gallery.children;
        this.images = images;
        
        for (var imgIndex = 0; imgIndex < images.length; imgIndex++) {
            images[imgIndex].index = imgIndex;
        }

        var currentImg; var imgSize;
        
        //Set callback on each image
        //TODO what if there is no callback?
        for (var i = 0; i < images.length; i++) {
            currentImg = images[i];
            imgSize = currentImg.getBoundingClientRect();
            
            //find first selection, apply callback
            //TODO only do this if we have 'centerSelector'
            if (imgSize[this.borders[0]] < this.offsetFromViewport && this.offsetFromViewport < imgSize[this.borders[1]] ) {
                this.selectedImg.img = currentImg;
                this.selectedImg.index = i;
                if (callback)
                    this.img_callback(currentImg);
            }
        }
    },
        
    storeGravityCenters : function(elements) {
        var point = {};
        var element, position;
        for (var i = 0; i < elements.length; i++) {
            element = elements[i];
            point = this.getCenterPoint(element);
            this.centerPoints.push(point);
        }
    },
    
    setImageSelector : function(imageSelector) {
        if (imageSelector) {
            this.selectImage = this[imageSelector];
        }
    },
    
    setSide : function(direction) {
        Controller.side = direction !== 'horizontal' ? 'height' : 'width';
    },
    
    setBorders : function(direction) {
        Controller.borders = direction === 'vertical' ? ['top', 'bottom'] : ['left', 'right'];
    },
    
    setKeepInContainer : function(direction) {
        if (!direction) {
            this.keepInContainer = this.keepElementInContainer;
        } else if (direction === "vertical") {
            this.keepInContainer = this.keepInContainerVertical;
        } else {
            this.keepInContainer = this.keepInContainerHorizontal;
        }
    },
    
    
    //Stores the zone or intialises it.
    setThreshold: function(element, zone, isLayered) {
        element.zone = {};
        Controller.calibrationAngle = this.currentAngles.top;
        if (zone !== undefined) {
            if (zone.vertical && isLayered) {
                element.zone.vertical = [[],[]];
                element.zone.vertical[0].push(this.currentAngles.top + zone.vertical[0][0]);
                element.zone.vertical[0].push(this.currentAngles.top + zone.vertical[0][1]);
                element.zone.vertical[1].push(this.currentAngles.top + zone.vertical[1][0]);
                element.zone.vertical[1].push(this.currentAngles.top + zone.vertical[1][1]);
            }
            else if (zone.vertical) { //convert
                element.zone.vertical = [];
                element.zone.vertical.push(this.currentAngles.top + zone.vertical[0]);
                element.zone.vertical.push(this.currentAngles.top + zone.vertical[1]);
            }
            if (zone.horizontal)
                element.zone.horizontal = zone.horizontal;
        } else {
            //Defaults
            //Note: does this make sense? What about noZone movements?
            element.zone = {
                type: 'angles',
                vertical: [-10,10],
                horizontal: [-20,20],
            };
        }
        //Note: can be optimized here (see ifs)
        //Precomputing some useful data
        if (zone.type === 'angles') {
            if (zone.vertical) {
                element.zone['rangeV'] = zone['vertical'][1] - zone['vertical'][0];
            }
            if (zone.horizontal) {
                element.zone['rangeH'] = zone['horizontal'][1] - zone['horizontal'][0];
            }
        } else {
            //TODO stuff for non-angle type
        }
    },
    
    setThresholdChecker : function(element, direction, layered) {
        if (layered && direction) {
            element.checkThreshold = Controller.checkLayeredThreshold;
        }
        else if (direction) {
            element.checkThreshold = direction === 'vertical' ? Controller.checkThresholdVertical : Controller.checkThresholdHorizontal;
        } else {
            element.checkThreshold = Controller.checkThreshold;
            element.checkThresholdHorizontal = Controller.checkThresholdHorizontal;
            element.checkThresholdVertical = Controller.checkThresholdVertical;
        }
    },
    
    //Restrictor is the type of the zone. We need to retrieve the correct data for comparison
    setRestrictorType: function(element, type, isPortrait) {
        this.restrictorType = type;
        if (isPortrait) {
            switch(type) {
                case 'angles':
                    element.getRestrictorData = Controller.getAngles;
                    break;
                case 'acceleration':
                    element.getRestrictorData = Controller.getDeviceAcceleration;
                    break;
                case 'rotationrate':
                    element.getRestrictorData = Controller.getRotationRate;
                    break;
                case 'accelerationIncludingGravity':
                    element.getRestrictorData = Controller.getAccelerationIncludingGravity;
                    break;
                default:
                    alert("Some error with restrictor type:" + type);
                    break;
            }
        } else {
            switch(type) {
                case 'angles':
                    element.getRestrictorData = Controller.getAngles;
                    break;
                case 'acceleration':
                    element.getRestrictorData = Controller.getDeviceAccelerationLandscape;
                    break;
                case 'rotationrate':
                    element.getRestrictorData = Controller.getRotationRateLandscape;
                    break;
                case 'accelerationIncludingGravity':
                    element.getRestrictorData = Controller.getAccelerationIncludingGravityLandscape;
                    break;
                default:
                    alert("Some error with restrictor type:" + type);
                    break;
            }
        }
    },

    getDeviceAcceleration: function(event) {
        return [
            event.acceleration.x,
            event.acceleration.y
        ]
    },

    getDeviceAccelerationLandscape: function(event) {
        return [
            event.acceleration.y,
            event.acceleration.x
        ]
    },

    getRotationRate: function(event) {
        return [
            event.rotationRate.beta, //Note: why on earth are the names swapped here???
            event.rotationRate.alpha
        ]
    },

    getRotationRateLandscape: function(event) {
        return [
            event.rotationRate.alpha,
            event.rotationRate.beta //Note: why on earth are the names swapped here???
        ]
    },

    getAngles: function() {
        return [
            Controller.currentAngles.left,
            Controller.currentAngles.top
        ]
    },

    getAccelerationIncludingGravity: function(event) {
        var accWithGravity = event.accelerationIncludingGravity;
        return [
            accWithGravity.x,
            accWithGravity.y
        ]
    },

    getAccelerationIncludingGravityLandscape: function(event) {
        var accWithGravity = event.accelerationIncludingGravity;
        return [
            accWithGravity.y,
            accWithGravity.x
        ]
    },
    
    checkLayeredThreshold : function(restrictorData) {
        //Note: this could probably be optimized
        var result = { toDirection: null, index: 0};
        //Check outer zone first
        if (restrictorData[this.number] < this.zone[Controller.direction][1][0]) { //zone = { vertical : [[x1,x2],[x3,x4]]}
            Controller.sign[this.direction] = this.signs[0];
            result.toDirection = true;
            result.index = 1;
            return result;
        } else if (restrictorData[this.number] > this.zone[Controller.direction][1][1]) {
            Controller.sign[this.direction] = this.signs[1];
            result.toDirection = false;
            result.index = 1;
            return result;
        //Check inner zone
        } else if (restrictorData[this.number] < this.zone[Controller.direction][0][0]) {
            Controller.sign[this.direction] = this.signs[0];
            result.toDirection = true;
            result.index = 0;
            return result;
        } else if (restrictorData[this.number] > this.zone[Controller.direction][0][1]) {
            Controller.sign[this.direction] = this.signs[1];
            result.toDirection = false;
            result.index = 0;
            return result;
        } else {
            return result;
        }
    },
    
    //In 2D: check if we go to the left, right, or none (same with up/down)
    checkThreshold: function(restrictorData) {
        var result = { left: null, top: null};
        result.left = this.checkThresholdHorizontal(restrictorData);
        result.top = this.checkThresholdVertical(restrictorData);
        return result;
    },

    //compares current restrictor data with zone and chooses the correct sign for position update
    checkThresholdHorizontal: function(restrictorData) { 
        //going left
        if (restrictorData[0] < this.zone.horizontal[0]) {
            Controller.sign.left = this.signs[0];
            return true;
        }
        //going right
        else if (restrictorData[0] > this.zone.horizontal[1]) {
            Controller.sign.left = this.signs[1];
            return false;
        }
        //going nowhere
        return null;
    },
    
    //compares current restrictor data with zone and chooses the correct sign for position update
    checkThresholdVertical: function(restrictorData) {
        //going up
        if (restrictorData[1] < this.zone.vertical[0]) {
            Controller.sign.top = this.signs[0];
            return false;
        }
        //going down
        else if (restrictorData[1] > this.zone.vertical[1]) {
            Controller.sign.top = this.signs[1];
            return true;
        }
        //going nowhere
        return null;
    },
    
    //Called when we initialize the ball.
    //Precomputes useful values to make some checks faster.
    //Also, chooses the correct function to keep element in container
    setBallPositionLimit : function(container, direction) {
        //Store the min/max top and left properties (in px) the ball can have.
        //Useful because it saves many computations and thus improves performance
        //Note: what about percentages? What about 1d movement --> room for performance boost
        if (!direction) {
            this.the_ball.minLeft = 0;
            this.the_ball.minLeftPercent = 0;
            this.the_ball.minTop = 0;
            this.the_ball.minTopPercent = 0;
            this.the_ball.maxTop = (container.clientHeight - this.ballSize.height);
            this.the_ball.maxTopPercent = 100.0 - this.the_ball.clientHeight / container.clientHeight * 100.0;
            this.the_ball.maxLeft = (container.clientWidth - this.ballSize.width);
            this.the_ball.maxLeftPercent = 100.0 - this.the_ball.clientWidth / container.clientWidth * 100.0;
        }
        else if (direction === 'vertical') {
            this.the_ball.minTop = 0;
            this.the_ball.maxTop = (container.clientHeight - this.ballSize.height);
            
            this.the_ball.maxPosition = this.the_ball.maxTop;
            this.the_ball.minPosition = this.the_ball.minTop;
        }
        else { //horizontal
            this.the_ball.minLeft = 0;
            this.the_ball.maxLeft = (container.clientWidth - this.ballSize.width);
            
            this.the_ball.maxPosition = this.the_ball.maxLeft;
            this.the_ball.minPosition = this.the_ball.minLeft;
        }
    },
 
    storeContainerSize: function(container) {
         //Store container size (without borders and margin)
        this.containerSize.height = container.clientHeight;
        this.containerSize.width = container.clientWidth;
        
        var containerData = container.getBoundingClientRect();
        this.containerSize.top = containerData.top;
        this.containerSize.left = containerData.left;
        this.containerSize.right = containerData.right;
        this.containerSize.bottom = containerData.bottom;
    },
    
    storeBallData: function() {
        //Store ball size (without borders and margin)
        this.ballSize.height = this.the_ball.clientHeight;
        this.ballSize.width = this.the_ball.clientWidth;
        
        var ballData = this.the_ball.getBoundingClientRect();
        this.ballSize.top = ballData.top;
        this.ballSize.left = ballData.left;
        
    },
    
    storeGalleryData : function(gallery) {
        //Store ball size (without borders and margin)
        this.gallerySize.height = gallery.clientHeight;
        this.gallerySize.width = gallery.clientWidth;
        
        var galleryData = gallery.getBoundingClientRect();
        this.gallerySize.top = galleryData.top;
        this.gallerySize.left = galleryData.left;
        this.gallerySize.right = galleryData.right;
        this.gallerySize.bottom = galleryData.bottom;
    },
    
    storeFrameData : function(frame) {
        //Store ball size (without borders and margin)
        this.frameSize.height = frame.clientHeight;
        this.frameSize.width = frame.clientWidth;
    
        var frameData = frame.getBoundingClientRect()
        this.frameSize.left = frameData.left;
        this.frameSize.top = frameData.top;
        this.frameSize.right = frameData.right;
        this.frameSize.bottom = frameData.bottom;
    },
    
    
    /*
        Similar to 'setBallPositionLimit'.
        Also, stores frame and gallery size (for whatever reason this is here).
    */
    setGalleryPositionLimit : function(frame, direction, center) {
        var frameData = this.frameSize;
        var galleryData = this.gallerySize;

        //Note: this 'if' should never be the case
        if (!direction) {
            this.the_gallery.minLeft = 0;
            this.the_gallery.minTop = 0;
            this.the_gallery.maxTop = (frameData.height - galleryData.height);
            this.the_gallery.maxLeft = (frameData.width - galleryData.width);
        }
        else if (direction === 'vertical') {
            if (center) {
                this.the_gallery.minTop = -galleryData.height + this.frameOffsetMiddle + Controller.images[Controller.images.length -1].clientHeight / 2 ;
                this.the_gallery.minPosition = this.the_gallery.minTop;
                this.the_gallery.maxTop = this.frameOffsetMiddle - this.images[0].clientHeight / 2;
                this.the_gallery.maxPosition = this.the_gallery.maxTop;
            } else {
                //Usually, this should be negative in a vertical gallery
                //because we expect the frame to have a smaller height than the gallery
                var diff =  (frameData.height - galleryData.height);
                if (diff < 0) {
                    this.the_gallery.minTop = diff - 10;
                    this.the_gallery.maxTop = 0;
                    this.the_gallery.minPosition = this.the_gallery.minTop;
                    this.the_gallery.maxPosition = this.the_gallery.maxTop;
                } else {
                    this.the_gallery.maxTop = diff + 10;
                    this.the_gallery.minTop = 0;
                    this.the_gallery.minPosition = this.the_gallery.minTop;
                    this.the_gallery.maxPosition = this.the_gallery.maxTop;
                }
            }
            
        }
        else { //horizontal
            //Note: why don't we need a diff here? --> do testing with few images
            if (center) {
                this.the_gallery.minLeft = -galleryData.width + this.frameOffsetMiddle + Controller.images[Controller.images.length -1].clientWidth / 2 ;
                this.the_gallery.minPosition = this.the_gallery.minLeft;
                this.the_gallery.maxLeft = this.frameOffsetMiddle - Controller.images[0].clientWidth / 2;
                this.the_gallery.maxPosition = this.the_gallery.maxLeft;
            } else {
                this.the_gallery.minLeft = -galleryData.width + frameData.width - 10;
                this.the_gallery.minPosition = this.the_gallery.minLeft;
                this.the_gallery.maxLeft = 0;
                this.the_gallery.maxPosition = this.the_gallery.maxLeft;
            }
        }
    },
    
    //Takes a classname or object and applies all rules in an inline-manner.
    setStyleCSS : function (element, properties) {
        var property, index;
        //Note Assumes that the container is not static...

        //check if we received a class name
        if (typeof properties === "string") {
            //give element the class and let browser to the rendering
            element.className = properties;
            var styleSheetRules = this.getAllCssRules(element);
            properties = {};
            //Source: https://stackoverflow.com/questions/12059284/get-text-between-two-rounded-brackets
            var regex =  /\{(.*)\}/;
            var rules;
            rules = styleSheetRules[0].match(regex)[1].split(';');
            for (index = 0; index < rules.length-1; index++) {
                property = rules[index].split(':');
                properties[property[0].slice(1)] = property[1].slice(1);
            }
        }
        //apply rules (makes them inline)
        for (property in properties) {
            element.style[property] = properties[property];
        }
        
        //initialize if 'left' and 'top' were not specified.
        if (!element.style.left) {
            element.style.left = element.offsetLeft + "px";
        }
        if (!element.style.top) {
            element.style.top = element.offsetTop + "px";
        }
    },
    
    //Source: https://stackoverflow.com/questions/2952667/find-all-css-rules-that-apply-to-an-element
    getAllCssRules: function(element) {
        var sheets = document.styleSheets, o = [];
        element.matches = element.matches || element.webkitMatchesSelector || element.mozMatchesSelector || element.msMatchesSelector || element.oMatchesSelector;
        for (var i in sheets) {
            var rules = sheets[i].rules || sheets[i].cssRules;
            for (var r in rules) {
                if (element.matches(rules[r].selectorText)) {
                    o.push(rules[r].cssText);
                }
            }
        }
        return o;
    },
    
    //If the ball was positioned with '%' unit, this converts it into px
    mapPercentagePositionToPx : function(element, container) {
        var containerData = container.getBoundingClientRect();

        //if it has percentage in 'top' property
        if (~element.style.top.indexOf('%')) {
            var elementPercentageT = parseInt(element.style.top) || 0;
            element.style.top = (containerData.height / 100 * elementPercentageT - element.offsetHeight / 2) + "px";
        }

        //if it has percentage in 'left' property
        if(~element.style.left.indexOf('%')) {
            var elementPercentageL = parseInt(element.style.left) || 0;
            if (elementPercentageL === 0)
                element.style.left = '0px';
            else
                element.style.left = (containerData.width / 100 * elementPercentageL - element.offsetWidth / 2) + "px";
        }
    },
    
    elementUpdate : function(event) {
        this.event = event;
        var zoneData = this.checkThreshold(this.getRestrictorData(event));
        this.move(zoneData);
        this.updatePosition(zoneData);
    },
    
    elementUpdateWithInteraction : function(event) {
        this.event = event;
        var zoneData = this.checkThreshold(this.getRestrictorData(event));
        this.move(zoneData);
        Controller.checkInteraction(this);
        this.updatePosition(zoneData);
    },
    
    elementLayeredUpdate : function(event) {
        this.event = event;
        var zoneAndIndex = this.checkThreshold(this.getRestrictorData(event));
        this.move(zoneAndIndex.toDirection, zoneAndIndex.index);
        this.updatePosition(zoneAndIndex.toDirection);
    },
    
    setVerticalPositionIncludingGravity : function(zoneDataTop) {
        var elementPosition = Controller.getElementPositionInt(this);
        
        //Vertical
        if (Controller.inGravityField) {
            var speedY = this.speedY + Controller.forceToApplyY;
            this.nextPosition.top = Controller.operators[Controller.gravDiffY](elementPosition.top, speedY);
        }
        if (zoneDataTop !== null) {
            this.nextPosition.top = Controller.operators[Controller.sign.top](elementPosition.top, this.speedY);
        }
    },
    
    //Computes the next vertical position if we're not in a 'stop-zone'
    setVerticalPosition : function(zoneDataTop) {
        var elementPosition = Controller.getElementPositionInt(this);
        
        if (zoneDataTop !== null) {
            this.nextPosition.top = Controller.operators[Controller.sign.top](elementPosition.top, this.speedY);
        }
    },
    
    
    setHorizontalPositionIncludingGravity : function(zoneDataLeft) {
        var elementPosition = Controller.getElementPositionInt(this);

        //Horizontal
        if (Controller.inGravityField) {
            var speedX = this.speedX + Controller.forceToApplyX;
            this.nextPosition.left = Controller.operators[Controller.gravDiffX](elementPosition.left, speedX);
        }
        if (zoneDataLeft !== null) {
            this.nextPosition.left = Controller.operators[Controller.sign.left](elementPosition.left, this.speedX);
        }
    },
    
    //Computes the next horizontal position if we're not in a 'stop-zone'
    setHorizontalPosition : function(zoneDataLeft) {
        var elementPosition = Controller.getElementPositionInt(this);
        
        if (zoneDataLeft !== null) {
            this.nextPosition.left = Controller.operators[Controller.sign.left](elementPosition.left, this.speedX);
        }
    },
    
    //Applies movement no matter what 'zone' we're in.
    setNextNoZonedPosition: function(zoneData) {
        var elementPosition = Controller.getElementPositionInt(this);
        //Note: what about 1d??
        if (Controller.inGravityField) { //Note: What about no gravity ever?
            Controller.applyGravity(this, this.diff_x, this.diff_y);
            this.speedX = Controller.operators[Controller.gravDiffX](this.speedX, Controller.forceToApplyX);
            this.speedY = Controller.operators[Controller.gravDiffY](this.speedY, Controller.forceToApplyY);
        }
        //Horizontal
        this.nextPosition.left = elementPosition.left + this.speedX;
        //Vertical
        this.nextPosition.top = elementPosition.top + this.speedY;
    },
    
    setNextZonedPosition : function(zoneData) {
        this.setVerticalPosition(zoneData.top);
        this.setHorizontalPosition(zoneData.left);
    },
    
    
    //Updates position only if the element stays within vertical boundaries
    keepInContainerVertical : function(element) {
        var nextPosition = element.nextPosition;
        
        //Check top update
        if (nextPosition.top >= element.minTop && nextPosition.top <= element.maxTop) {
            element.style.top = nextPosition.top + "px";
        } else {
            //TODO test if this could be removed
            element.style.top = (nextPosition.top >= element.minTop ? element.maxTop : element.minTop) + "px";
        }
    },
    
    //Updates position only if the element stays within horizontal boundaries
    keepInContainerHorizontal : function(element) {
        var nextPosition = element.nextPosition;

        //Check left update
        if (nextPosition.left >= element.minLeft && nextPosition.left <= element.maxLeft) {
            element.style.left = nextPosition.left + "px";
        } else {
            //TODO test if this could be removed
            element.style.left = (nextPosition.left >= element.minLeft ? element.maxLeft : element.minLeft) + "px";
        }
    },
    
    getElementPositionInt : function (element) {
        var result =
            {
                left: parseInt(element.style.left,10),
                top: parseInt(element.style.top,10)
            };
        return result;
    },
    
    swapAxes : function() {
        //check dimension
        if (this.zone.vertical && this.zone.horizontal) {
            var tmpV = this.zone.vertical;
            var tmpH = this.zone.horizontal;
            this.zone.vertical = tmpH;
            this.zone.horizontal = tmpV;
        } else if (this.zone.vertical) {
            
        } else {
            
        }
    },
    
    getCenterPoint : function(element) {
        var point = {};
        var data = element.getBoundingClientRect();
        point.left = data.left + data.width / 2;
        point.top = data.top + data.height / 2;
        return point;
    },
    
    //for 2d checks
    keepElementInContainer : function (element) {
        this.keepInContainerHorizontal(element);
        this.keepInContainerVertical(element);
    },


    //Takes two elements and decides if they overlap. Returns true when that is the case
    detectCollision : function (el1, el2) {
//Source: https://stackoverflow.com/questions/9607252/how-to-detect-when-an-element-over-another-element-in-javascript
        el1.offsetBottom = el1.offsetTop + el1.offsetHeight;
        el1.offsetRight = el1.offsetLeft + el1.offsetWidth;
        el2.offsetBottom = el2.offsetTop + el2.offsetHeight;
        el2.offsetRight = el2.offsetLeft + el2.offsetWidth;

        return !((el1.offsetBottom < el2.offsetTop) ||
                 (el1.offsetTop > el2.offsetBottom) ||
                 (el1.offsetRight < el2.offsetLeft) ||
                 (el1.offsetLeft > el2.offsetRight))
        ;
    },
    
    applyGravity : function(element, diff_x, diff_y) {
        
        var relativeDistanceX = Math.abs(diff_x) / this.gravityRadius;
        var relativeDistanceY = Math.abs(diff_y) / this.gravityRadius;
        
        this.forceToApplyX = this.gravityForce * (1-relativeDistanceX);
        this.forceToApplyY = this.gravityForce * (1-relativeDistanceY);
//        element.speedX = diff_x > 0 ? element.speedX - this.forceToApplyX : element.speedX + this.forceToApplyX;//diff_x;
//        element.speedY = diff_y > 0 ? element.speedY - this.forceToApplyY : element.speedY + this.forceToApplyY;//diff_y;
    },
        
    /* element should be the indicator, index of currently inspected unmovable object */
    detectGravityField : function(element, index) {
        //TODO implement detectGravityField
        var elementCenterPoint = this.getCenterPoint(element);
        var elemLeft = elementCenterPoint.left;
        var elemTop = elementCenterPoint.top;
        
        var objectCenterPoint = this.centerPoints[index];
        var objLeft = objectCenterPoint.left;
        var objTop = objectCenterPoint.top;
        
        var diff_x = elemLeft - objLeft;
        var diffXSquare = Math.pow(diff_x,2);
        element.diff_x = diff_x;
        
        var diff_y = elemTop - objTop;
        var diffYSquare = Math.pow(diff_y,2);
        element.diff_y = diff_y;
        
        this.gravDiffX = diff_x > 0 ? '-' : '+';
        this.gravDiffY = diff_y > 0 ? '-' : '+';
        
        var radiusSqaure = Math.pow(this.gravityRadius,2); //Note: can improve performance by storing radius^2
        
        var distance = radiusSqaure - (diffXSquare + diffYSquare);
        
        if (distance < 0 || (diffXSquare < 100 && diffYSquare < 100)) {
            this.inGravityField = false;
            return false;
        }
        else {
            this.applyGravity(element, diff_x, diff_y);
            this.inGravityField = true;
            this.gravityIndex = index;
            return true;
        }
    },
    
    centerOnCollision : function(element) {
        element.style.left = element.collidedWith.offsetLeft + "px";
        element.style.top = element.collidedWith.offsetTop + "px";
    },
    
    
    //---------- IMAGE SELECTORS ------------//
    
    viewportMap : function() {
        var _ball = this.the_ball;
        var ballPosition = this.getElementPositionInt(_ball);
        var styleValue = ballPosition[this.borders[0]];

        _ball.onBorder = (styleValue === _ball.minPosition) || (styleValue === _ball.maxPosition);
        
        if (!this.onBorder) {
        //Get all images visible in frame
            var imagesInViewport = [];
            //Get first image
            var currentImage, imageData;
            for(var i = 0; i < this.images.length; i++) {
                currentImage = this.images[i];
                imageData = currentImage.getBoundingClientRect();
                if (this.imageIsInFrame(imageData)) {
                    imagesInViewport.push(currentImage);
                }
            }

            var nrOfImagesInFrame = imagesInViewport.length;
            var fraction = 1 / nrOfImagesInFrame;

            var ballPositionPX = parseFloat(_ball.style[this.borders[0]] + _ball.style[this.side]);
            var divisor = (this.containerSize[this.side] - this.ballSize[this.side]);
            var ballPercentage = ballPositionPX / divisor;
            for (var i = nrOfImagesInFrame-1; i > -1; i--) {
                if (ballPercentage >= fraction*i) {
                    currentImage = imagesInViewport[i];
                    if (this.selectedImg.img === currentImage)
                        return;
                    this.selectedImg.img = currentImage;
                    this.selectedImg.index = currentImage.index;
                    this.img_callback(currentImage);
                    return;
                }
            }
        }
    },
    
    imageMap : function() {
        var side = this.borders[0];
        var ballPositionPX = parseFloat(this.the_ball.style[side]);
        //Note: room for performance? --> store value of divisor
        //Note: used in mappedSliderGallery --> function?
        var divisor = (this.containerSize[this.side] - this.ballSize[this.side]);
        var ballPercentage = ballPositionPX / divisor;
        
        //Note: store for performance
        var numberOfPics = this.images.length;
        var fraction = 1 / numberOfPics;

        var _the_gallery = this.the_gallery;
        var side = Controller.borders[0];
        //Find current selected image
        //TODO improve efficiency if needed
        //TODO can I make transition smooth instead of jump?
        for (var i = numberOfPics-1; -1 < i; i--) {
            if (ballPercentage >= fraction*i) {
                var img = this.images[i];
                
                //Center image
                var offsets = img.getBoundingClientRect();
                var positionInt = this.getElementPositionInt(this.the_gallery);
                var nextPosition = (positionInt[side] - (offsets[side] - this.offsetFromViewport + offsets.width / 2));
                
                if (nextPosition >= this.the_gallery.minPosition && nextPosition <= this.the_gallery.maxPosition) {
                    _the_gallery.style[side] = nextPosition + "px";
                } else {
                    _the_gallery.style[side] = (nextPosition >= _the_gallery.minPosition ? _the_gallery.maxPosition : _the_gallery.minPosition) + "px";
                }
                //Note: I think this one applies multiple callbacks?
                //--> if so, compare index to current selected one
                if (img === this.selectedImg.img)
                    return;
                this.img_callback(img);
                this.selectedImg.img = img;
                this.selectedImg.index = i;
                return;
            }
        }
    },
    
    //TODO think of something to keep moving and select border images
    centerSelector : function() {
        //Note: might be more efficient to store position of current image and update with the speed.
        //--> Allows us not have to call getBoundingClientRect() all the time.
        var img = this.selectedImg.img;
        var index = this.selectedImg.index;
        var positionData = img.getBoundingClientRect();
        //Note: this probably fails if the speed is so high that one can jump over images.
        
        //Test current image
        if (this.imageIsSelected(positionData)) { //chosen, callback already applied
            return;
        }
        //Test next image
        if (index+1 < this.images.length) { //bound check
            img = this.images[index+1];
            positionData = img.getBoundingClientRect();
            if (this.imageIsSelected(positionData)) { //in center
                this.img_callback(img);
                this.selectedImg.img = img;
                this.selectedImg.index = index+1;
                return;
            }
        }
        //Test previous image    
        if (index > 0) { //bound check
            img = Controller.images[index-1];
            positionData = img.getBoundingClientRect();

            if (this.imageIsSelected(positionData)) { //in center
                this.img_callback(img);
                this.selectedImg.img = img;
                this.selectedImg.index = index-1;
                return;
            }
        }
        
        //Speed was to big and we skipped an image --> test them all
        for(index = 0; index < this.images.length; index++) {
            img = this.images[index];
            positionData = img.getBoundingClientRect();
            if (this.imageIsSelected(positionData)) { //in center
                this.img_callback(img);
                this.selectedImg.img = img;
                this.selectedImg.index = index;
                return;
            }
        }
    },
    
    imageIsInFrame : function(positionData) {
        var _borders = this.borders;
        var side = _borders[0]; //top or left
        var side2 = _borders[1]; //bottom or right accordingly
        var _frameData = this.frameSize;
                //if bottom or right is in frame            //if left or top is inside frame
        return (positionData[side2] >= _frameData[side] && _frameData[side2] > positionData[side]);
    },
        
    imageIsSelected : function(positionData) {
        return (positionData[this.borders[0]] < this.offsetFromViewport && this.offsetFromViewport < positionData[this.borders[1]]);
    },
    
    checkForCollision : function(element, obj) {
        if (this.detectCollision(element, obj)){ //on enter
            if (obj.collision) //performance, apply callback only once
                return;
            //Apply callback function
            obj.collision = true;
            element.collidedWith = obj;
            element.elementCallback(obj);
        } else if (obj.collision === true) {
            obj.collision = false;
            element.collidedWith = null;
            element.exitCallback(obj);
        }        
    },
    
    checkForCollisionWithCentering : function(element, obj) {
        if (this.detectCollision(element, obj)){ //on enter
            if (obj.collision) //performance, apply callback only once
                return;
            //Apply callback function
            obj.collision = true;
            element.collidedWith = obj;
            this.centerOnCollision(element);
            element.elementCallback(obj);
        } else if (obj.collision === true) {
            obj.collision = false;
            element.collidedWith = null;
            element.exitCallback(obj);
        }    
    },
    
    checkInteractionWithGravity : function(element) {
        //Variable declarations
        var obj;
        
        this.inGravityField = false;
        //iterate through elements with which the ball interacts and check for collision
        for(var i = 0; i < element.interactors.length; i++) {
            //Get current object
            obj = element.interactors[i];
            
            if (!this.detectGravityField(element, i)) {
                continue; //Note: always true --> if we're not even in the gravity field, we don't have to check for collision
            }
                
            //Collision detection logic
            this.checkForCollisionWithCentering(element, obj);
        };        
    },
    
    //Checks if the element collides with an interactor and if so, executes the callback
    checkInteraction : function (element) {
        //Variable declarations
        var obj;
        
//        Controller.inGravityField = false;
        //iterate through elements with which the ball interacts and check for collision
        for(var i = 0; i < element.interactors.length; i++) {
            //Get current object
            obj = element.interactors[i];
            
            //Collision detection logic
            this.checkForCollision(element, obj);
        };
    },
};