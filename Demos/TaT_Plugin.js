/*TODO:
    - calibration and dynamic angles? :/
    - discuss direction change (slow down, or instant turn?)
    - probably discard some parameters (not so easy to make optional parameters, especially if it's more than one)
        --> could let them pass an object as last parameter and check if settings are defined/passed on
*/

window.TiltAndTap = (function () {
    'use strict';

    //--------- Private Variables ------// 
    
    //The element that moves around
    var the_ball, the_gallery;
    //Our instance of the MovementClass
    var moveInstance;
    //A function storing all necessary functions to execute depending on the application
    var onMotionEvent;

    //Used for optimization.
    //Note: probably suited better in the controller?
    var isPortraitglobal = true;
    
    //
    var intervalID, event, updateRate = 20, touchCount = 0;

    //--------- Utility Functions -------//

    function setAccelerationType(element, accelerationType, isPortrait) {
        element.accelereationType = accelerationType;
        if (isPortrait) {
            switch (accelerationType) {
                 case 'angles': //Note taking angles might be a bit extreme... maybe take a fraction of it?
                    element.getAcceleration = Controller.getAngles;
                    break;
                case 'acceleration':
                    element.getAcceleration = Controller.getDeviceAcceleration;
                    break;
                case 'rotationrate':
                    element.getAcceleration = Controller.getRotationRate;
                    break;
                case 'accelerationIncludingGravity':
                    element.getAcceleration = Controller.getAccelerationIncludingGravity;
                    break;
                default: //Note: maybe check if this is a good idea?
                    element.getAcceleration = Controller.getDeviceAcceleration;
                    break;
            }
        } else {
            switch (accelerationType) {
                case 'angles': //Note taking angles might be a bit extreme... maybe take a fraction of it?
                    return Controller.getAngles;
                    break;
                case 'acceleration':
                    return Controller.getDeviceAccelerationLandscape;
                    break;
                case 'rotationrate':
                    return Controller.getRotationRateLandscape;
                    break;
                case 'accelerationIncludingGravity':
                    return Controller.getAccelerationIncludingGravityLandscape;
                    break;
                default: //Note: maybe check if this is a good idea?
                    return Controller.getDeviceAccelerationLandscape;
            }
        }
    };

    function orientationChangeHandler() {
        var isPortrait = Controller.isPortrait();
        if (isPortrait === isPortraitglobal)
            return;
        isPortraitglobal = isPortrait;
        the_ball.setAccelerationType(the_ball.accelerationType, isPortrait);
        //TODO check if defined (ball and gallery)
        Controller.setBallPositionLimit(Controller.the_container, Controller.direction);
        Controller.setGalleryPositionLimit(Controller.the_gallery.parentNode, Controller.direction, Controller.imageSelector === Controller.centerSelector);
         if (isPortrait) {
            window.removeEventListener('deviceorientation', orientationHandlerLandscapePos, false);
            window.removeEventListener('deviceorientation', orientationHandlerLandscapeNeg, false);
            window.addEventListener('deviceorientation', orientationHandlerPortrait, false);
         } else {
            window.removeEventListener('deviceorientation', orientationHandlerPortrait, false);
            if (window.orientation === 90) {
                window.addEventListener('deviceorientation', orientationHandlerLandscapePos, false);
            } else {
                window.addEventListener('deviceorientation', orientationHandlerLandscapeNeg, false);
            }
         }
    };
    
    function calibrate(event){ //TODO rename
        //store angles in controller
        if (Controller.isPortrait()) { //TODO test this
            orientationHandlerPortrait(event);
        } else {
            Controller.currentAngles.left = event.beta;
            Controller.currentAngles.top = event.gamma;
        }
    };
    
    
    //TODO: for some odd reason, the touchCount stuff is buggy (purpose is to be multitouch resistant)
    function setupListeners(tap) {
        setInterval(orientationChangeHandler, 500); //Note: what's the best in terms of performance here? Should it even be considered?
        if (tap) { //Tap required for movement.
                document.addEventListener('touchstart', function() {
                    if (touchCount === 0) {
                        applyEventListeners();
                    }
                    touchCount++;
                }, false);
                document.addEventListener('touchend', function() {
                    if (touchCount === 1) {
                        detachEventListeners();
                    }
                    touchCount--;
                }, false);
        } else if (tap === false) { //Tap stops all movement
            document.addEventListener('touchstart', function() {
                if (touchCount === 1) {
                    detachEventListeners();
                }
                touchCount--;
            }, false );
            document.addEventListener('touchend', function() {
                if (touchCount === 0) {
                    applyEventListeners();
                }
                touchCount++;
            } , false);
        } else {
            applyEventListeners();
        }//null or undefined --> always move
    };
    
    //Triggered when device is moved. Calls the 'move' function
    function motionHandler(event) {
//        onMotionEvent(event);
        event = event;
    };
    
    //Triggered when device moves.
    //This data is used to check if the angle is big enough to move
    function orientationHandlerPortrait(event) {
//        TODO swap for ios?
        Controller.currentAngles['left'] = event.gamma;
        Controller.currentAngles['top'] = event.beta;
    };
    
    function orientationHandlerLandscapePos(event) { //swapped angles.
        Controller.currentAngles['left'] = event.beta;
        Controller.currentAngles['top'] = event.gamma*-1;
    };
    
    function orientationHandlerLandscapeNeg(event) { //swapped angles.
        Controller.currentAngles['left'] = event.beta;
        Controller.currentAngles['top'] = event.gamma;
    };
    
    //Solely used for phone debugging
    function phoneOut(string) {
        //debug code
        var container = document.getElementById("container");
        if (container.nextElementSibling) {
            var element = document.createElement('div');
            element.innerHTML = string;
            container.parentNode.appendChild(element);
        }
    };
    
    function applyEventListeners() {
        //Add listeners for motion and orientation
        window.addEventListener('devicemotion', motionHandler, false);
//        if (Controller.isPortrait()) {
            window.addEventListener('deviceorientation', orientationHandlerPortrait, false);
//        } else {
//            if (window.orientation === 90)
//                window.addEventListener('deviceorientation', orientationHandlerLandscapePos, false);
//            else
//                window.addEventListener('deviceorientation', orientationHandlerLandscapeNeg, false);
//        }
        intervalID = setInterval(onMotionEvent, updateRate);
    };
    
    function detachEventListeners() {
        window.removeEventListener('devicemotion', motionHandler);
        window.removeEventListener('deviceorientation');
        clearInterval(intervalID);
    };

    //Checks if the requires events are supported
    function testEventSupport() {
        //check event support
        if (window.DeviceOrientationEvent && window.DeviceMotionEvent) {
            console.log("both supported");
        }
        else {
            alert("Your device does not support the required events.");
        }
    };
    
    function initBall(css, container, moveType, direction, interaction) {
        //Create element
        the_ball = document.createElement("div");
        
        //Assign ID
        //Note: changing this, breaks cctat
        the_ball.id = "the_ball_ID";

        //Debug function for phone
        the_ball.debug = phoneOut;

        var isLayered = moveType.name === 'twoZonedMove';
        
        //TODO add different type support (dom/string)
        //Appends the element to the container
        container.appendChild(the_ball);
        
        //Apply the styling to the ball
        Controller.setStyleCSS(the_ball,css); //Note: should this be moved to TaT?
        
        //Set style in pixel unit (or initialize if nothing given)
        Controller.mapPercentagePositionToPx(the_ball, container);
        
        //Set the movetype
        moveInstance.setMoveType(the_ball, moveType, direction);
        
        //Set accelerationType
        if (moveType.settings.moveData && moveType.settings.moveData.accelerationType) {
            setAccelerationType(the_ball, accelType, Controller.isPortrait());
        }
        
        //Set restrictorType
        Controller.setRestrictorType(the_ball, moveType.settings.zone.type, Controller.isPortrait());
        
        //Set thresholdchecker
        Controller.setThresholdChecker(the_ball, direction, isLayered);
        
        //Set zone
        Controller.setThreshold(the_ball, moveType.settings.zone, isLayered);
        
        //Init nextPosition attribute
        the_ball.nextPosition = { 'left': null, 'top': null };
        the_ball.signs = ['-', '+'];
        
        //Init function to set NextZonedPosition
        moveInstance.setPositionUpdate(the_ball, moveType.name, direction, moveType.settings.gravity);
        
        //Store ball size etc
        Controller.setupBall(the_ball, container, moveType.settings);
        
        //Set position Limits
        Controller.setBallPositionLimit(container, direction);
        
        
        if (isLayered) {
            the_ball.update = Controller.elementLayeredUpdate;
            
        } else if (interaction) {
            the_ball.update = Controller.elementUpdateWithInteraction
        } else {
            the_ball.update = Controller.elementUpdate;
        }
        
    };
    
    function initGallery(gallery, moveType, callback, direction) {
        the_gallery = gallery;
        //Note: do i need this?
        if (!gallery.id) {
            the_gallery.id = "the_gallery_ID";
        }
        
        Controller.setupGallery(gallery, moveType.settings, callback, direction);
        
        var isLayered = moveType.name === 'twoZonedMove';
        
        //Set 'getAcceleration'
        var accelType = moveType.settings.moveData.accelerationType;
        setAccelerationType(the_gallery, accelType, Controller.isPortrait());
        
         //Set restrictorType
        var zone = moveType.settings.zone;
        Controller.setRestrictorType(the_gallery, zone.type, Controller.isPortrait());
        
        //Set thresholdchecker
        Controller.setThresholdChecker(the_gallery, direction, isLayered);
        
        //Set zone
        Controller.setThreshold(the_gallery, zone, isLayered);
        
        //TODO make a new one for the_gallery
        Controller.setStyleCSS(the_gallery,null);
        
        //Note: room for optimization?(one direction)
        the_gallery.nextPosition = { 'left': null, 'top': null };
        if (moveType.moveParallel && moveType.moveParallel === true) {
            the_gallery.signs = ['-', '+'];
        } else {
            the_gallery.signs = ['+', '-'];
        }
        
        //Set function that updates next position
        moveInstance.setPositionUpdate(the_gallery, moveType.name, direction);
        
        //Set movetype
        moveInstance.setMoveType(the_gallery, moveType, direction);
        
        the_gallery.update = isLayered ? Controller.elementLayeredUpdate : Controller.elementUpdate;
    };
    

    /*
        Depending on what constructor is called, we need different functions in the update.
        This function checks the movement type and the application and initialises the function accordingly.
    */
    function initMotionFunctions(moveType, application, interacts) {
        //Note: actually the same as slider gallery...
        if (moveType.name === 'mapSliderGallery') { 
            onMotionEvent = function(event) { 
                Controller.keepInContainer(the_ball);
                Controller.keepInContainer(the_gallery);
                the_ball.update(event);
                the_gallery.update(event);
                Controller.selectImage();
            };
            return;
        }
        
        if (moveType.name === "mappedContainerMove" || moveType.name === "positionControlWithGravity") {
            if (interacts) {
                onMotionEvent = function(event) {
                    Controller.checkInteraction(the_ball);
                    the_ball.move(event);
                }
            } else {
                onMotionEvent = the_ball.move;
            }
            return;
        }
        
        switch(application) {
            case 'TwoDimensionalTilt':
                if (interacts) {
                    onMotionEvent = function(event) { 
                        //Controller.checkInteraction(the_ball); 
                        Controller.keepInContainer(the_ball);
                        the_ball.update(event);
                    };
                } else {
                    onMotionEvent = function(event) { 
                        Controller.keepInContainer(the_ball);
                        the_ball.update(event);
                    };
                }
                break;
            case 'sliderGallery':
                if (moveType.imageSelector) {
                    switch (moveType.imageSelector) {
                        case "imageMap":
                            onMotionEvent = function(event) {
                                Controller.keepInContainer(the_ball);
                                the_ball.update(event);
                                Controller.selectImage();
                            };
                            break;
                        case "centerSelector":
                            onMotionEvent = function(event) {
                                Controller.keepInContainer(the_ball);
                                Controller.keepInContainer(the_gallery);
                                the_ball.update(event);
                                the_gallery.update(event);
                                Controller.selectImage();
                            };
                            break;
                        case "viewportMap":
                            onMotionEvent = function(event) {
                                the_ball.update(event);
                                Controller.keepInContainer(the_ball);
                                if (the_ball.onBorder) { //Note: inefficient?
                                    the_gallery.update(event);
                                    Controller.keepInContainer(the_gallery);
                                }
                                Controller.selectImage();
                            };
                            break;
                    }
                } else { //no image selector
                    onMotionEvent = function(event) {
                        Controller.keepInContainer(the_ball);
                        Controller.keepInContainer(the_gallery);
                        the_ball.update(event);
                        the_gallery.update(event);
                    };
                }
                break;
            case 'gallery':
                onMotionEvent = function(event) { 
                    //TODO check if there is image selection
                    Controller.keepInContainer(the_gallery);
                    the_gallery.update(event);
                    Controller.selectImage();
                };
                break;
            default:
                alert("could not define application");
                break;
        }
    };
    
    function overrideEventPrototype() {
//        var isSafari = Object.prototype.toString.call(window.HTMLElement).indexOf('Constructor') > 0;
//        var EventTarget = isSafari ? window.Element : window.EventTarget;
        EventTarget.prototype.addEventListenerBase = EventTarget.prototype.addEventListener;
        EventTarget.prototype.addEventListener = function(type, listener) {
            if(!this.EventList) { this.EventList = []; }
            this.addEventListenerBase.apply(this, arguments);
            if(!this.EventList[type]) { this.EventList[type] = []; }
            var list = this.EventList[type];
            for(var index = 0; index != list.length; index++)
            {
                if(list[index] === listener) { return; }
            }
            list.push(listener);
        };

        EventTarget.prototype.removeEventListenerBase = EventTarget.prototype.removeEventListener;
        EventTarget.prototype.removeEventListener = function(type, listener)
        {
            if(!this.EventList) { this.EventList = []; }
            if(listener instanceof Function) { this.removeEventListenerBase.apply(this, arguments); }
            if(!this.EventList[type]) { return; }
            var list = this.EventList[type];
            for(var index = 0; index != list.length;)
            {
                var item = list[index];
                if(!listener)
                {
                    this.removeEventListenerBase(type, item);
                    list.splice(index, 1); continue;
                }
                else if(item === listener)
                {
                    list.splice(index, 1); break;
                }
                index++;
            }
            if(list.length == 0) { delete this.EventList[type]; }
        };
    };

    
//---------------- Gallery ----------------------- //
    
    TiltAndTap.prototype.Gallery = function(gallery, moveType, callback, tap) {
        var sliderMove, galleryMove, direction;
        overrideEventPrototype();
        
        testEventSupport();
        
        //Calibrate
        window.addEventListener('deviceorientation', function(event) {
            //gets angles
            calibrate(event);
            //removes all listeners on deviceorientation
            window.removeEventListener('deviceorientation');
            
            //This is the 1D constructor, thus dimension is 1D
            moveInstance = new Movements1D();

            direction = moveType.settings.zone.vertical ? 'vertical' : 'horizontal';

            initGallery(gallery, moveType, callback, direction);
            Controller.setupController(moveType.settings, moveType.imageSelector, direction);


            var _imageSelector = moveType.imageSelector;
            if (_imageSelector === 'centerSelector') {
                Controller.setGalleryPositionLimit(gallery.parentNode, direction, true);
            } else {
                Controller.setGalleryPositionLimit(gallery.parentNode, direction, false);
            } 

            initMotionFunctions(moveType, 'gallery');
            
            //now set up original listeners
            setupListeners(tap);
        });
        intervalID = setInterval(onMotionEvent, updateRate);        
    };
    
    
//---------------- SliderGallery ----------------------- //    
    
    TiltAndTap.prototype.SliderGallery = function(ballCSS, container, gallery, moveType, callback, tap) {
        var sliderMove, galleryMove, direction;
        overrideEventPrototype();
        
        testEventSupport();
        
        
        //Calibrate
        window.addEventListener('deviceorientation', function(event) {
            //gets angles
            calibrate(event);
            //removes all listeners on deviceorientation
            window.removeEventListener('deviceorientation');
            
            //This is the 1D constructor, thus dimension is 1D
            moveInstance = new Movements1D();

            if (moveType.sliderMove && moveType.galleryMove) {
                sliderMove = moveType.sliderMove;
                galleryMove = moveType.galleryMove;
            } else {
                sliderMove = moveType;
                galleryMove = moveType;
            }

            direction = moveType.settings.zone.vertical ? 'vertical' : 'horizontal';

            Controller.setupController(galleryMove.settings, moveType.imageSelector, direction);

            initBall(ballCSS, container, sliderMove, direction);
            initGallery(gallery, galleryMove, callback, direction);


            var _imageSelector = moveType.imageSelector;
            if (_imageSelector === 'centerSelector') {
                Controller.setGalleryPositionLimit(gallery.parentNode, direction, true);
            } else {
                Controller.setGalleryPositionLimit(gallery.parentNode, direction, false);
            } 

            initMotionFunctions(moveType, 'sliderGallery');
            
            //now set up original listeners
            setupListeners(tap);
        });
        intervalID = setInterval(onMotionEvent, updateRate);
    };
    
    

//---------------- BALL 2D ----------------------- //    
    
    //Instantiate TwoDimensionalTilt
    TiltAndTap.prototype.TwoDimensionalTilt = function (css, container, moveType, tap, elements, callback, exitCallback) {
        overrideEventPrototype();
        
        testEventSupport();
        
        window.addEventListener('deviceorientation', function(event) {
             //gets angles
            calibrate(event);
            //removes all listeners on deviceorientation
            window.removeEventListener('deviceorientation');
            
            //This is the 2D constructor, thus dimension is 2d
            moveInstance = new Movements2D();

            //Create and position the_ball div element
            initBall(css, container, moveType, null, callback || exitCallback);
            Controller.setupController(moveType.settings, elements);
            Controller.storeGravityCenters(elements);

            //Store elements and callback with which 'the_ball' interacts
            the_ball.interactors = elements;
            the_ball.elementCallback = callback;
            the_ball.exitCallback = exitCallback;

            initMotionFunctions(moveType, 'TwoDimensionalTilt', callback || exitCallback);
            setupListeners(tap);
            
        });
        intervalID = setInterval(onMotionEvent, updateRate);
    };
});