(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
/* global THREE */

const DEFAULT_OPTIONS = {
    useImmediatePose: false
};

function App(scene, config, rendererOptions) {
    "use strict";
    var _config = {};
    config = config || _config;
    for (var kwarg in DEFAULT_OPTIONS) {
        if (config[kwarg] === undefined) _config[kwarg] = DEFAULT_OPTIONS[kwarg];
    }
    config = _config;

    scene = scene || new THREE.Scene();

    this.scene = scene;

    rendererOptions = rendererOptions || {};

    this.renderer = new THREE.WebGLRenderer(rendererOptions);
    var domElement = this.renderer.domElement;

    if (!rendererOptions.canvas) {
        document.body.appendChild(domElement);
        domElement.id = 'webgl-canvas';
    }

    this.renderer.setPixelRatio(window.devicePixelRadio);
    this.renderer.setSize(window.innerWidth, window.innerHeight);

    this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    this.camera.matrixAutoUpdate = true;

    this.vrEffect = new THREE.VREffect(this.renderer, function(error) { throw new Error(error); });

    this.vrControls = new THREE.VRControls(this.camera, function(error) { throw new Error(error); });
    this.vrControlsEnabled = true;

    // public methods:

    this.render = function () {
        if (this.vrControlsEnabled) this.vrControls.update(config.useImmediatePose);
        this.vrEffect.render(this.scene, this.camera);
    }.bind(this);

    this.toggleVRControls = function () {
        if (this.vrControlsEnabled) {
            this.vrControlsEnabled = false;
            this.camera.position.set(0, 0, 0);
            this.camera.quaternion.set(0, 0, 0, 1);
            this.camera.updateMatrixWorld();
        } else {
            this.vrControlsEnabled = true;
        }
    }.bind(this);

    this.resetVRSensor = ( function () {
        var onResetVRSensor = config.onResetVRSensor;
        var lastPosition = new THREE.Vector3();
        return function () {
            if (this.vrControlsEnabled) {
                this.vrControls.update(true);
                lastPosition.copy(this.camera.position);
                var lastRotation = this.camera.rotation.y;
                this.vrControls.resetPose();
                this.vrControls.update(true);
                if (onResetVRSensor) {
                    onResetVRSensor(lastRotation, lastPosition);
                }
            }
        };
    } )().bind(this);

    this.toggleFullscreen = function (options) {
        if (!isFullscreen()) {
            requestFullscreen(options);
            // requestPointerLock();
        } else {
            exitFullscreen();
            // releasePointerLock();
        }
    };

    this.toggleWireframe = ( function () {
        var wireframeMaterial = new THREE.MeshBasicMaterial({color: 0xeeddaa, wireframe: true});
        return function () {
            if (this.scene.overrideMaterial === wireframeMaterial) {
                this.scene.overrideMaterial = null;
            } else {
                this.scene.overrideMaterial = wireframeMaterial;
            }
        };
    } )().bind(this);

    this.toggleNormalMaterial = ( function () {
        var normalMaterial = new THREE.MeshNormalMaterial();
        return function () {
            if (this.scene.overrideMaterial === normalMaterial) {
                this.scene.overrideMaterial = null;
            } else {
                this.scene.overrideMaterial = normalMaterial;
            }
        };
    } )().bind(this);

    // WebVR setup

    this.vrDisplay = null;

    if (navigator.getVRDisplays) {
        navigator.getVRDisplays().then( function (displays) {
            if (displays.length > 0) {
                this.vrDisplay = displays[0];
            }
        }.bind(this) );
    } else {
        console.error('WebVR API is not supported');
    }

    this.toggleVR = function () {
        var vrDisplay = this.vrDisplay;
        if (vrDisplay && !vrDisplay.isPresenting && vrDisplay.capabilities.canPresent) {
            this.vrEffect.requestPresent().then( function () {
                if (vrDisplay.capabilities.hasExternalDisplay) {
                    var eyeParams = vrDisplay.getEyeParameters( 'left' );
                    this.renderer.setSize(2*eyeParams.renderWidth, eyeParams.renderHeight);
                }
                // requestPointerLock();
            }.bind(this) );
        } else if (vrDisplay && vrDisplay.isPresenting) {
            this.vrEffect.exitPresent().then( function () {
                console.log('exited VR presentation');
            } );
        }
    }.bind(this);

    // resize, fullscreen/VR listener functions and other useful functions:

    var onResize = function () {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }.bind(this);

    var onFullscreenChange = function () {
        onResize();
    };

    function isFullscreen() {
        return !!(document.fullscreenElement || document.webkitFullscreenElement || document.mozFullScreenElement);
    }

    function requestFullscreen(options) {
        if (domElement.requestFullscreen) {
            domElement.requestFullscreen(options);
        } else if (domElement.msRequestFullscreen) {
            domElement.msRequestFullscreen();
        } else if (domElement.mozRequestFullScreen) {
            domElement.mozRequestFullScreen(options);
        } else if (domElement.webkitRequestFullscreen) {
            domElement.webkitRequestFullscreen();
        } else {
            throw 'Fullscreen API is not supported';
        }
    }

    function exitFullscreen() {
        if (document.exitFullscreen) {
            document.exitFullscreen();
        } else if (document.mozCancelFullScreen) {
            document.mozCancelFullScreen();
        } else if (document.webkitExitFullscreen) {
            document.webkitExitFullscreen();
        } else {
            console.warn('exitFullscreen is not supported');
        }
    }

    // function requestPointerLock() {
    //     if (domElement.requestPointerLock) {
    //         domElement.requestPointerLock();
    //     } else if (domElement.mozRequestPointerLock) {
    //         domElement.mozRequestPointerLock();
    //     } else if (domElement.webkitRequestPointerLock) {
    //         domElement.webkitRequestPointerLock();
    //     }
    // }

    // function releasePointerLock() {
    //     if (document.exitPointerLock) {
    //         document.exitPointerLock();
    //     } else if (document.mozExitPointerLock) {
    //         document.mozExitPointerLock();
    //     } else if (document.webkitExitPointerLock) {
    //         document.webkitExitPointerLock();
    //     }
    // }

    var beforeUnload = function () {
        // stop VR presenting when exiting the app
        if (this.vrDisplay && this.vrDisplay.isPresenting) {
            this.vrEffect.exitPresent();
        }
    }.bind(this);

    // add standard event listeners

    window.addEventListener('resize', onResize, false);
    document.addEventListener(domElement.mozRequestFullScreen ? 'mozfullscreenchange' : 'webkitfullscreenchange',
        onFullscreenChange, false);
    window.addEventListener("beforeunload", beforeUnload, false);
}

module.exports = App;

},{}],2:[function(require,module,exports){
module.exports = ( function () {
    "use strict";

    const DEADZONE = 0.145;

    var gamepads;
    var buttonsPresseds = [];

    pollGamepads();

    function pollGamepads() {
        gamepads = navigator.getGamepads();
        for (var i = 0; i < gamepads.length; i++) {
            var gamepad = gamepads[i];
            if (!gamepad) continue;
            if (buttonsPresseds[i] === undefined) {
                buttonsPresseds.push([false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false]);
            }
        }
    }

    function onGamepadConnected(e) {
        console.log("Gamepad connected at index %d: %s", e.gamepad.index, e.gamepad.id);
        pollGamepads();
    }
    window.addEventListener("gamepadconnected", onGamepadConnected);

    function onGamepadDisconnected(e) {
        console.log("Gamepad disconnected from index %d: %s", e.gamepad.index, e.gamepad.id);
        var i = e.gamepad.index;
        for (var j = 0; j < buttonsPresseds[i].length; j++) {
            buttonsPresseds[i][j] = false;
        }
    }
    window.addEventListener("gamepaddisconnected", onGamepadDisconnected);

    function update(commands) {
        var values = [];
        pollGamepads();
        for (var i = 0; i < gamepads.length; ++i) {
            var gamepad = gamepads[i];
            if (!gamepad) continue;
            var buttonsPressed = buttonsPresseds[i];
            for (var j = 0; j < gamepad.buttons.length; j++) {
                if (gamepad.buttons[j].pressed && !buttonsPressed[j]) {
                    buttonsPressed[j] = true;
                    for (var name in commands) {
                        var command = commands[name];
                        if (command.commandDown && command.buttons && command.buttons.indexOf(j) !== -1) {
                            command.commandDown(j);
                        }
                    }
                } else if (!gamepad.buttons[j].pressed && buttonsPressed[j]) {
                    buttonsPressed[j] = false;
                    for (name in commands) {
                        command = commands[name];
                        if (command.commandUp && command.buttons && command.buttons.indexOf(j) !== -1) {
                            command.commandUp(j);
                        }
                    }
                }
            }
            // get all button/axes values:
            var axesValues = {};
            for (name in commands) {
                axesValues[name] = 0;
                command = commands[name];
                if (command.axes) {
                    for (j = 0; j < gamepad.axes.length; j++) {
                        var axis = gamepad.axes[j];
                        if (Math.abs(axis) > DEADZONE) {
                            if (command.axes.indexOf(j) !== -1) {
                                axesValues[name] = gamepad.axes[j];
                                break;
                            }
                        }
                    }
                } else if (command.buttons) {
                    for (j = 0; j < command.buttons.length; j++) {
                        if (gamepad.buttons[command.buttons[j]].pressed) {
                            axesValues[name] = 1;
                            break;
                        }
                    }
                }
            }
            values.push(axesValues);
        }
        return values;
    }

    return {
        update: update,
        BUTTONS: {
            A: 0,
            B: 1,
            X: 2,
            Y: 3,
            leftBumper: 4,
            rightBumper: 5,
            leftTrigger: 6,
            rightTrigger: 7,
            back: 8,
            start: 9,
            leftStick: 10,
            rightStick: 11,
            up: 12,
            down: 13,
            left: 14,
            right: 15
        },
        AXES: {
            LSX: 0,
            LSY: 1,
            RSX: 2,
            RSY: 3
        }
    };

} )();

},{}],3:[function(require,module,exports){
/* global THREE, GFXTABLET */

module.exports = ( function () {
	"use strict";
	const INCH2METERS = 0.0254;
	function GfxTablet(xRes, yRes, width, height) {
		xRes = xRes || 2560;
		yRes = yRes || 1600;
		width = width || 8.5 * INCH2METERS;
		height = height || 5.25 * INCH2METERS;
		// set up WebSocket, paintable surface for GfxTablet:
		var gfxTabletStuff = GFXTABLET.addGfxTablet(xRes, yRes);
		// create VR visuals:
		var mesh = new THREE.Mesh(new THREE.PlaneBufferGeometry(1, 1), gfxTabletStuff.paintableMaterial);
		mesh.scale.x = width;
		mesh.scale.y = height;
		var cursor = gfxTabletStuff.cursor;
		cursor.scale.x = 0.002 / width;
		cursor.scale.y = 0.002 / height;
		cursor.position.z = 0.005;
		cursor.updateMatrix();
		mesh.add(cursor);
		this.mesh = mesh;
		this.cursor = cursor;
	}
	return GfxTablet;
} )();

},{}],4:[function(require,module,exports){
/* global THREE */

module.exports = ( function () {
    "use strict";

    const INCH2METERS = 0.0254;

    function Keyboard(eventTarget, commands) {

        this.enabled = true;

        eventTarget.addEventListener("keydown", onKeyDown.bind(this), false);
        eventTarget.addEventListener("keyup", onKeyUp, false);

        var keyDown = [];
        var commandDowns = [];

        function onKeyDown(evt) {
            if (this.enabled) {
                keyDown[evt.keyCode] = true;
                if (commandDowns[evt.keyCode]) commandDowns[evt.keyCode](evt.keyCode);
            }
        }

        function onKeyUp(evt) {
            keyDown[evt.keyCode] = false;
        }

        function getState(buttons) {
            if (!this.enabled) return 0;
            for (var i = 0; i < buttons.length; i++) {
                if (keyDown[buttons[i]]) return 1;
            }
            return 0;
        }

        for (var name in commands) {
            var buttons = commands[name].buttons;
            Object.defineProperty(this, name, {
                enumerable: true,
                get: getState.bind(this, buttons)
            });
            var commandDown = commands[name].commandDown;
            if (commandDown) {
                for (var i = 0; i < buttons.length; i++) {
                    commandDowns[buttons[i]] = commandDown;
                }
            }
        }

        this.stageObject = ( function () {

            // create keyboard visuals:

            var keyboardObject = new THREE.Object3D();

            var keyMaterial = new THREE.MeshLambertMaterial({color: 0xbbbbbb});

            const keyDelta = INCH2METERS * 0.75;
            const keyHeight = INCH2METERS * 0.3;
            const keyTravel = keyHeight * 0.7;

            var regularKeyGeom = new THREE.BoxBufferGeometry(0.95 * keyDelta, keyHeight, 0.95 * keyDelta);

            var i, j; // i = 0 at upper number key row, 4 at bottom row, 5 (or -1) at function key row;
                      // j = 0 at start (left) of row, increments for each key until the end of the row.
            var row, char;
            var mesh;

            var keyMesh = {};
            // regular-sized keys:
            const REGULAR_ROWS = [
                "`1234567890-=",
                "qwertyuiop[]",
                "asdfghjkl;'",
                "zxcvbnm,./"
            ];
            for (i = 0; i < REGULAR_ROWS.length; i++) {
                row = REGULAR_ROWS[i];
                for (j = 0; j < row.length; j++) {
                    char = row[j];
                    mesh = new THREE.Mesh(regularKeyGeom, keyMaterial);
                    mesh.name = char;
                    mesh.position.z = 0.5 * keyDelta + i * keyDelta;
                    mesh.position.x = 0.5 * keyDelta + j * keyDelta;
                    keyMesh[char] = mesh;
                    keyboardObject.add(mesh);
                }
            }

            // the *crazy* bottom row:
            var controlWidth = INCH2METERS * 1.5,
                windowsWidth = controlWidth,
                altWidth     = controlWidth;
            var controlGeom = new THREE.BoxBufferGeometry(0.95 * controlWidth, keyHeight, 0.95 * keyDelta);
            var spacebarWidth = 0.95 * INCH2METERS * 4.75;
            var spacebarGeom = new THREE.BoxBufferGeometry(0.95 * spacebarWidth, keyHeight, 0.95 * keyDelta);

            mesh = new THREE.Mesh(controlGeom, keyMaterial);
            mesh.position.z = 4.5 * keyDelta;
            mesh.position.x = 0.5 * controlWidth;
            keyMesh.lcontrol = mesh;
            keyboardObject.add(mesh);

            mesh = mesh.clone();
            mesh.position.x += 0.5 * (controlWidth + windowsWidth);
            keyMesh.lwindows = mesh;
            keyboardObject.add(mesh);

            mesh = mesh.clone();
            mesh.position.x += 0.5 * (windowsWidth + altWidth);
            keyMesh.lalt = mesh;
            keyboardObject.add(mesh);

            mesh = new THREE.Mesh(spacebarGeom, keyMaterial);
            mesh.position.z = 4.5 * keyDelta;
            mesh.position.x = keyMesh.lalt.position.x + 0.5 * (altWidth + spacebarWidth);
            keyMesh.spacebar = mesh;
            keyboardObject.add(mesh);

            for (var k in keyMesh) {
                keyMesh[k].updateMatrix();
            }

            var keyDown = [];

            window.addEventListener("keydown", function (evt) {
                if (!keyDown[evt.keyCode]) {
                    var keyName = Keyboard.CODEKEYS[evt.keyCode];
                    if (keyName) keyName = keyName.toLowerCase();
                    var mesh = keyMesh[keyName];
                    if (mesh) {
                        mesh.position.y -= keyTravel;
                        mesh.updateMatrix();
                    }
                }
                keyDown[evt.keyCode] = true;
            }, false);

            window.addEventListener("keyup", function (evt) {
                if (keyDown[evt.keyCode]) {
                    var keyName = Keyboard.CODEKEYS[evt.keyCode];
                    if (keyName) keyName = keyName.toLowerCase();
                    var mesh = keyMesh[keyName];
                    if (mesh) {
                        mesh.position.y += keyTravel;
                        mesh.updateMatrix();
                    }
                }
                keyDown[evt.keyCode] = false;
            }, false);

            return keyboardObject;

        } )();

    }

    Keyboard.KEYCODES = {
        BACKSPACE: 8,
        TAB: 9,
        ENTER: 13,
        SHIFT: 16,
        CTRL: 17,
        ALT: 18,
        PAUSEBREAK: 19,
        CAPSLOCK: 20,
        ESCAPE: 27,
        SPACEBAR: 32,
        PAGEUP: 33,
        PAGEDOWN: 34,
        END: 35,
        HOME: 36,
        LEFTARROW: 37,
        UPARROW: 38,
        RIGHTARROW: 39,
        DOWNARROW: 40,
        INSERT: 45,
        DELETE: 46,
        NUMBER0: 48,
        NUMBER1: 49,
        NUMBER2: 50,
        NUMBER3: 51,
        NUMBER4: 52,
        NUMBER5: 53,
        NUMBER6: 54,
        NUMBER7: 55,
        NUMBER8: 56,
        NUMBER9: 57,
        A: 65,
        B: 66,
        C: 67,
        D: 68,
        E: 69,
        F: 70,
        G: 71,
        H: 72,
        I: 73,
        J: 74,
        K: 75,
        L: 76,
        M: 77,
        N: 78,
        O: 79,
        P: 80,
        Q: 81,
        R: 82,
        S: 83,
        T: 84,
        U: 85,
        V: 86,
        W: 87,
        X: 88,
        Y: 89,
        Z: 90,
        LEFTWINDOWKEY: 91,
        RIGHTWINDOWKEY: 92,
        SELECTKEY: 93,
        NUMPAD0: 96,
        NUMPAD1: 97,
        NUMPAD2: 98,
        NUMPAD3: 99,
        NUMPAD4: 100,
        NUMPAD5: 101,
        NUMPAD6: 102,
        NUMPAD7: 103,
        NUMPAD8: 104,
        NUMPAD9: 105,
        MULTIPLY: 106,
        ADD: 107,
        SUBTRACT: 109,
        DECIMALPOINT: 110,
        DIVIDE: 111,
        F1: 112,
        F2: 113,
        F3: 114,
        F4: 115,
        F5: 116,
        F6: 117,
        F7: 118,
        F8: 119,
        F9: 120,
        F10: 121,
        F11: 122,
        F12: 123,
        NUMLOCK: 144,
        SCROLLLOCK: 145,
        SEMICOLON: 186,
        EQUALSIGN: 187,
        COMMA: 188,
        DASH: 189,
        PERIOD: 190,
        FORWARDSLASH: 191,
        GRAVEACCENT: 192,
        OPENBRACKET: 219,
        BACKSLASH: 220,
        CLOSEBRACKET: 221,
        SINGLEQUOTE: 222
    };

    Keyboard.KEYCODES['1'] = Keyboard.KEYCODES.NUMBER1;
    Keyboard.KEYCODES['2'] = Keyboard.KEYCODES.NUMBER2;
    Keyboard.KEYCODES['3'] = Keyboard.KEYCODES.NUMBER3;
    Keyboard.KEYCODES['4'] = Keyboard.KEYCODES.NUMBER4;
    Keyboard.KEYCODES['5'] = Keyboard.KEYCODES.NUMBER5;
    Keyboard.KEYCODES['6'] = Keyboard.KEYCODES.NUMBER6;
    Keyboard.KEYCODES['7'] = Keyboard.KEYCODES.NUMBER7;
    Keyboard.KEYCODES['8'] = Keyboard.KEYCODES.NUMBER8;
    Keyboard.KEYCODES['9'] = Keyboard.KEYCODES.NUMBER9;
    Keyboard.KEYCODES['0'] = Keyboard.KEYCODES.NUMBER0;
    Keyboard.KEYCODES['-'] = Keyboard.KEYCODES.DASH;
    Keyboard.KEYCODES['='] = Keyboard.KEYCODES.EQUALSIGN;
    Keyboard.KEYCODES[';'] = Keyboard.KEYCODES.SEMICOLON;
    Keyboard.KEYCODES["'"] = Keyboard.KEYCODES.SINGLEQUOTE;
    Keyboard.KEYCODES["\\"] = Keyboard.KEYCODES.BACKSLASH;
    Keyboard.KEYCODES["["] = Keyboard.KEYCODES.OPENBRACKET;
    Keyboard.KEYCODES["]"] = Keyboard.KEYCODES.CLOSEBRACKET;
    Keyboard.KEYCODES["`"] = Keyboard.KEYCODES.GRAVEACCENT;
    Keyboard.KEYCODES["/"] = Keyboard.KEYCODES.FORWARDSLASH;
    Keyboard.KEYCODES["."] = Keyboard.KEYCODES.PERIOD;
    Keyboard.KEYCODES[","] = Keyboard.KEYCODES.COMMA;

    Keyboard.CODEKEYS = [];
    for (var k in Keyboard.KEYCODES) {
        Keyboard.CODEKEYS[Keyboard.KEYCODES[k]] = k;
    }

    Keyboard.STANDARD_COMMANDS = {
        moveForward: {buttons: [Keyboard.KEYCODES.W]},
        moveBackward: {buttons: [Keyboard.KEYCODES.S]},
        moveLeft: {buttons: [Keyboard.KEYCODES.A]},
        moveRight: {buttons: [Keyboard.KEYCODES.D]},
        moveUp: {buttons: [Keyboard.KEYCODES.E]},
        moveDown: {buttons: [Keyboard.KEYCODES.Q]},
        turnLeft: {buttons: [Keyboard.KEYCODES.LEFTARROW]},
        turnRight: {buttons: [Keyboard.KEYCODES.RIGHTARROW]},
        turnUp: {buttons: [Keyboard.KEYCODES.UPARROW]},
        turnDown: {buttons: [Keyboard.KEYCODES.DOWNARROW]},
        toggleMenu: {buttons: [Keyboard.KEYCODES.ENTER]}
    };

    return Keyboard;
} )();

},{}],5:[function(require,module,exports){
/* *********************************************************************************************

   To connect to remote Leap Motion controllers, add this to the host's Leap Motion config.json:
     "websockets_allow_remote": true

   ********************************************************************************************* */

/* global Leap, THREE, CANNON */

module.exports = ( function () {
    "use strict";

    const INCH2METERS = 0.0254;
    const LEAP2METERS = 0.001;
    const METERS2LEAP = 1000;
    const UP = THREE.Object3D.DefaultUp;
    const RIGHT = new THREE.Vector3(1, 0, 0);
    const FORWARD = new THREE.Vector3(0, 0, -1);

    const DEFAULT_OPTIONS = {
        rotation: [0, 0, 0],
        position: [0, -0.42, -0.42],
        toolLength: 0.15,
        toolRadius: 0.0034,
        toolMass: 0.04,
        tipShape: 'Cylinder',
        tipRadius: 0.0034,
        interactionPlaneOpacity: 0.22,
        timeA: 0.25,
        timeB: 0.25 + 1.5,
        minConfidence: 0.13,
        interactionBoxColor: 0x99eebb,
        leapColor: 0x777777,
        toolColor: 0xeebb99,
        tipColor: 0x99bbee,
        handColor: 0x113399,
        useShadowMesh: true,
        shadowPlane: 0,
        shadowMaterial: new THREE.MeshBasicMaterial({color: 0x333333}),
        shadowLightPosition: new THREE.Vector4(0, 7, 0, 0.1),
        host: '127.0.0.1',
        port: 6437
    };

    function makeTool(options) {
        /*************************************

        returns: stuff

        *************************************/
        for (var option in DEFAULT_OPTIONS) {
            if (options[option] === undefined) options[option] = DEFAULT_OPTIONS[option];
        }
        console.log('tool options:');
        console.log(options);

        // coordinate transformations are performed via three.js scene graph
        var toolRoot = new THREE.Object3D();
        toolRoot.scale.set(LEAP2METERS, LEAP2METERS, LEAP2METERS);

        toolRoot.quaternion.multiplyQuaternions(toolRoot.quaternion.setFromAxisAngle(UP, options.rotation[1]), (new THREE.Quaternion()).setFromAxisAngle(RIGHT, options.rotation[0]));

        toolRoot.position.fromArray(options.position);

        // set up / connect to leap controller:

        var leapController = new Leap.Controller({background: true,
                                                  host: options.host, port: options.port});

        // leap motion event callbacks:
        var onConnect = options.onConnect || function () {
            console.log('Leap Motion WebSocket connected (host: %s, port: %d)', options.host, options.port);
        };
        leapController.on('connect', onConnect);

        var onDisconnect = options.onDisconnect || function () {
            console.log('Leap Motion WebSocket disconnected (host: %s, port: %d)', options.host, options.port);
        };
        leapController.on('disconnect', onDisconnect);

        var onStreamingStarted = options.onStreamingStarted || function () {
            console.log('Leap Motion streaming started (host: %s, port: %d)', options.host, options.port);
        };
        leapController.on('streamingStarted', onStreamingStarted);

        var onStreamingStopped = options.onStreamingStopped || function () {
            console.warn('Leap Motion streaming stopped (host: %s, port: %d)', options.host, options.port);
        };
        leapController.on('streamingStopped', onStreamingStopped);

        // setup tool visuals:

        // interaction box visual guide:
        var interactionBoxRoot = new THREE.Object3D();
        toolRoot.add(interactionBoxRoot);

        var interactionPlaneMaterial = new THREE.MeshBasicMaterial({color: options.interactionBoxColor, transparent: true, opacity: options.interactionPlaneOpacity});
        var interactionPlaneGeom = new THREE.PlaneBufferGeometry(METERS2LEAP, METERS2LEAP);

        var interactionPlaneMesh = new THREE.Mesh(interactionPlaneGeom, interactionPlaneMaterial);
        interactionBoxRoot.add(interactionPlaneMesh);

        interactionPlaneMesh = interactionPlaneMesh.clone();
        interactionPlaneMesh.position.z = METERS2LEAP * 0.5;
        interactionPlaneMesh.updateMatrix();
        interactionBoxRoot.add(interactionPlaneMesh);

        interactionPlaneMesh = interactionPlaneMesh.clone();
        interactionPlaneMesh.position.z = METERS2LEAP * (-0.5);
        interactionPlaneMesh.updateMatrix();
        interactionBoxRoot.add(interactionPlaneMesh);

        // leap motion controller:
        var boxGeom = new THREE.BoxGeometry(METERS2LEAP*INCH2METERS*3, METERS2LEAP*INCH2METERS*0.5, METERS2LEAP*INCH2METERS*1.2);
        var leapGeom = new THREE.BufferGeometry();
        leapGeom.fromGeometry(boxGeom);
        boxGeom.dispose();
        var leapMaterial = new THREE.MeshLambertMaterial({color: options.leapColor});
        var leapMesh = new THREE.Mesh(leapGeom, leapMaterial);
        leapMesh.position.y = METERS2LEAP*INCH2METERS*0.25;
        toolRoot.add(leapMesh);

        // the stick:
        var toolGeom = new THREE.CylinderGeometry(METERS2LEAP*options.toolRadius, METERS2LEAP*options.toolRadius, METERS2LEAP*options.toolLength, 10, 1, false);
        toolGeom.translate(0, -0.5*METERS2LEAP*options.toolLength, 0);
        toolGeom.rotateX(-0.5 * Math.PI);
        var bufferGeom = new THREE.BufferGeometry();
        bufferGeom.fromGeometry(toolGeom);
        toolGeom.dispose();
        toolGeom = bufferGeom;
        var toolMaterial = new THREE.MeshLambertMaterial({color: options.toolColor, transparent: true});
        var toolMesh = new THREE.Mesh(toolGeom, toolMaterial);
        toolRoot.add(toolMesh);

        var toolShadowMesh;
        if (options.useShadowMesh) {
            toolShadowMesh = new THREE.ShadowMesh(toolMesh, options.shadowMaterial);
            var shadowPlane = new THREE.Plane(UP, options.shadowPlane);
            toolShadowMesh.updateShadowMatrix(shadowPlane, options.shadowLightPosition);
        } else {
            toolMesh.castShadow = true;
        }

        var toolBody = new CANNON.Body({mass: options.toolMass, type: CANNON.Body.KINEMATIC});
        // TODO: rename, avoid confusion b/t cannon and three materials
        toolBody.material = options.tipMaterial || new CANNON.Material();

        var tipMesh = null;
        if (options.tipShape === 'Sphere') {
            var tipGeom = new THREE.SphereBufferGeometry(METERS2LEAP*options.tipRadius, 10);
            toolBody.addShape(new CANNON.Sphere(options.tipRadius));
            var tipMaterial = new THREE.MeshLambertMaterial({color: options.tipColor, transparent: true});
            tipMesh = new THREE.Mesh(tipGeom, tipMaterial);
            tipMesh.castShadow = true;
            toolMesh.add(tipMesh);
        } else {
            // cannon body is a cylinder at end of tool
            var shapePosition = new CANNON.Vec3(0, 0, options.tipRadius);
            toolBody.addShape(new CANNON.Cylinder(options.tipRadius, options.tipRadius, 2*options.tipRadius, 8), shapePosition);
        }

        // to store decomposed toolRoot world matrix, used to convert three.js local coords to cannon.js world coords:
        var worldPosition = new THREE.Vector3();
        var worldQuaternion = new THREE.Quaternion();
        var worldScale = new THREE.Vector3();
        // inverse of toolRoot.matrixWorld, used for converting cannon.js world coords to three.js local coords:
        var matrixWorldInverse = new THREE.Matrix4();

        function updateToolMapping() {
            toolRoot.matrixWorld.decompose(worldPosition, worldQuaternion, worldScale);
            matrixWorldInverse.getInverse(toolRoot.matrixWorld);
        }

        function updateToolPostStep() {
            toolMesh.position.copy(toolBody.interpolatedPosition);
            toolMesh.position.applyMatrix4(matrixWorldInverse);
            toolMesh.updateMatrix();
            if (toolShadowMesh) {
                toolShadowMesh.updateMatrix();
            }
        }

        var direction = new THREE.Vector3();
        var position = new THREE.Vector3();
        var velocity = new THREE.Vector3();
        var quaternion = new THREE.Quaternion();

        var deadtime = 0;

        var lastFrameID;

        function setDeadtime(t) {
            deadtime = t;
            if (deadtime === 0) {
                interactionBoxRoot.visible = true;
                interactionPlaneMaterial.opacity = options.interactionPlaneOpacity;
            }
        }

        function updateTool(dt) {

            deadtime += dt;

            var frame = leapController.frame();
            if (frame.valid && frame.id !== lastFrameID) {

                lastFrameID = frame.id;

                var interactionBox = frame.interactionBox;
                if (interactionBox.valid) {
                    interactionBoxRoot.position.fromArray(interactionBox.center);
                    interactionBoxRoot.scale.set(interactionBox.width*LEAP2METERS, interactionBox.height*LEAP2METERS, interactionBox.depth*LEAP2METERS);
                    interactionBoxRoot.updateMatrix();
                    interactionBoxRoot.updateMatrixWorld();
                }

                if (frame.tools.length === 1) {

                    deadtime = 0;

                    var tool = frame.tools[0];

                    if (toolMesh.visible === false || toolMesh.material.opacity < 1) {
                        toolMesh.visible = true;

                        if (toolShadowMesh) toolShadowMesh.visible = true;

                        toolMesh.material.opacity = 1;
                        if (tipMesh) tipMesh.material.opacity = 1;
                        interactionBoxRoot.visible = true;
                        interactionPlaneMaterial.opacity = options.interactionPlaneOpacity;
                    }

                    position.fromArray(tool.tipPosition);
                    //position.fromArray(tool.stabilizedTipPosition);
                    direction.fromArray(tool.direction);

                    toolMesh.position.copy(position);
                    position.applyMatrix4(toolRoot.matrixWorld);
                    toolBody.position.copy(position);

                    toolMesh.quaternion.setFromUnitVectors(FORWARD, direction);

                    quaternion.multiplyQuaternions(worldQuaternion, toolMesh.quaternion);
                    toolBody.quaternion.copy(quaternion);

                    toolMesh.updateMatrix();
                    toolMesh.updateMatrixWorld();

                    if (toolShadowMesh) {
                        toolShadowMesh.updateMatrix();
                        toolShadowMesh.updateMatrixWorld();
                    }

                    velocity.fromArray(tool.tipVelocity);
                    velocity.applyQuaternion(worldQuaternion);
                    velocity.multiplyScalar(LEAP2METERS);
                    toolBody.velocity.copy(velocity);

                    if (tool.timeVisible > options.timeA) {
                        // stick becomes collidable once it has been detected for some time
                        if (toolBody.sleepState === CANNON.Body.SLEEPING) {
                            toolBody.wakeUp();
                            // TODO: indicator (particle effect)
                            if (tipMesh) tipMesh.material.color.setHex(0xff0000);
                        }

                        if (tool.timeVisible > options.timeB && interactionPlaneMaterial.opacity > 0.1) {
                            // dim the interaction box:
                            interactionPlaneMaterial.opacity *= 0.94;
                        }

                    }

                } else if (toolBody.sleepState === CANNON.Body.AWAKE) {
                    // tool detection was just lost
                    toolBody.sleep();
                    if (tipMesh) tipMesh.material.color.setHex(options.tipColor);

                } else {
                    // tool is already lost
                    if (toolMesh.visible && toolMesh.material.opacity > 0.1) {
                        // fade out tool
                        toolMesh.material.opacity *= 0.8;
                        if (tipMesh) tipMesh.material.opacity = toolMesh.material.opacity;
                    } else {
                        toolMesh.visible = false;
                        if (toolShadowMesh) toolShadowMesh.visible = false;
                    }
                }

                updateHands(frame);

            }

            if ( deadtime > 1.5 && interactionBoxRoot.visible ) {
                interactionPlaneMaterial.opacity *= 0.93;
                if (interactionPlaneMaterial.opacity < 0.02) interactionBoxRoot.visible = false;
            }

        }

        // setup hands:

        // hands don't necessarily correspond the left / right labels, but doesn't matter in this case because they look indistinguishable
        var leftRoot = new THREE.Object3D(),
            rightRoot = new THREE.Object3D();
        var handRoots = [leftRoot, rightRoot];
        toolRoot.add(leftRoot);
        toolRoot.add(rightRoot);

        var handMaterial = new THREE.MeshBasicMaterial({color: options.handColor, transparent: true, opacity: 0});

        // arms:
        var armRadius = METERS2LEAP*0.0216,
            armLength = METERS2LEAP*0.22;
        var armGeom = new THREE.CylinderGeometry(armRadius, armRadius, armLength);
        bufferGeom = new THREE.BufferGeometry();
        bufferGeom.fromGeometry(armGeom);
        armGeom.dispose();
        armGeom = bufferGeom;
        var armMesh = new THREE.Mesh(armGeom, handMaterial);
        var arms = [armMesh, armMesh.clone()];
        leftRoot.add(arms[0]);
        rightRoot.add(arms[1]);
        // palms:
        var radius = METERS2LEAP*0.025;
        var palmGeom = new THREE.SphereBufferGeometry(radius).scale(1, 0.5, 1);
        var palmMesh = new THREE.Mesh(palmGeom, handMaterial);
        var palms = [palmMesh, palmMesh.clone()];
        leftRoot.add(palms[0]);
        rightRoot.add(palms[1]);
        // fingertips:
        radius = METERS2LEAP*0.005;
        var fingerTipGeom = new THREE.SphereBufferGeometry(radius);
        var fingerTipMesh = new THREE.Mesh(fingerTipGeom, handMaterial);
        var fingerTips = [[fingerTipMesh, fingerTipMesh.clone(), fingerTipMesh.clone(), fingerTipMesh.clone(), fingerTipMesh.clone()],
                          [fingerTipMesh.clone(), fingerTipMesh.clone(), fingerTipMesh.clone(), fingerTipMesh.clone(), fingerTipMesh.clone()]];
        leftRoot.add(fingerTips[0][0], fingerTips[0][1], fingerTips[0][2], fingerTips[0][3], fingerTips[0][4]);
        rightRoot.add(fingerTips[1][0], fingerTips[1][1], fingerTips[1][2], fingerTips[1][3], fingerTips[1][4]);
        // finger joints:
        var jointMesh = fingerTipMesh.clone();
        jointMesh.scale.set(7/5, 7/5, 7/5);
        var joints = [[jointMesh, jointMesh.clone(), jointMesh.clone(), jointMesh.clone(), jointMesh.clone()],
                      [jointMesh.clone(), jointMesh.clone(), jointMesh.clone(), jointMesh.clone(), jointMesh.clone()]];
        leftRoot.add(joints[0][0], joints[0][1], joints[0][2], joints[0][3], joints[0][4]);
        rightRoot.add(joints[1][0], joints[1][1], joints[1][2], joints[1][3], joints[1][4]);
        // TODO: use the anatomical names
        // TODO: reduce fractions
        var joint2Mesh = fingerTipMesh.clone();
        joint2Mesh.scale.set(55/50, 55/50, 55/50);
        var joint2s = [[joint2Mesh, joint2Mesh.clone(), joint2Mesh.clone(), joint2Mesh.clone(), joint2Mesh.clone()],
                      [joint2Mesh.clone(), joint2Mesh.clone(), joint2Mesh.clone(), joint2Mesh.clone(), joint2Mesh.clone()]];
        leftRoot.add(joint2s[0][0], joint2s[0][1], joint2s[0][2], joint2s[0][3], joint2s[0][4]);
        rightRoot.add(joint2s[1][0], joint2s[1][1], joint2s[1][2], joint2s[1][3], joint2s[1][4]);

        function updateHands(frame) {
            leftRoot.visible = rightRoot.visible = false;
            for (var i = 0; i < frame.hands.length; i++) {
                var hand = frame.hands[i];
                if (hand.confidence > options.minConfidence) {

                    handRoots[i].visible = true;
                    handMaterial.opacity = 0.5*handMaterial.opacity + 0.5*(hand.confidence - options.minConfidence) / (1 - options.minConfidence);

                    var arm = arms[i];
                    direction.fromArray(hand.arm.basis[2]);
                    arm.quaternion.setFromUnitVectors(UP, direction);
                    arm.position.fromArray(hand.arm.center());
                    arm.updateMatrix();

                    var palm = palms[i];
                    direction.fromArray(hand.palmNormal);
                    palm.quaternion.setFromUnitVectors(UP, direction);
                    palm.position.fromArray(hand.palmPosition);
                    palm.updateMatrix();

                    var handFingerTips = fingerTips[i];
                    var handJoints = joints[i];
                    var handJoint2s = joint2s[i];
                    for (var j = 0; j < hand.fingers.length; j++) {
                        var finger = hand.fingers[j];
                        handFingerTips[j].position.fromArray(finger.tipPosition);
                        handFingerTips[j].updateMatrix();
                        handJoints[j].position.fromArray(finger.bones[1].nextJoint);
                        handJoints[j].updateMatrix();
                        handJoint2s[j].position.fromArray(finger.bones[2].nextJoint);
                        handJoint2s[j].updateMatrix();
                    }
                }
            }
        }

        // initialize matrices:
        toolRoot.traverse( function (node) {
            node.matrixAutoUpdate = false;
            node.updateMatrix();
        } );

        interactionBoxRoot.visible = false;
        toolMesh.visible = false;
        if (toolShadowMesh) toolShadowMesh.visible = false;
        leftRoot.visible  = false;
        rightRoot.visible = false;

        return {
            leapController:     leapController,
            toolRoot:           toolRoot,
            toolMesh:           toolMesh,
            toolBody:           toolBody,
            updateTool:         updateTool,
            updateToolPostStep: updateToolPostStep,
            updateToolMapping:  updateToolMapping,
            setDeadtime:        setDeadtime,
            toolShadowMesh: toolShadowMesh,
            worldQuaternion: worldQuaternion,
            worldPosition: worldPosition
        };
    }

    return {
        makeTool: makeTool
    };

} )();

},{}],6:[function(require,module,exports){
/* global THREE */

module.exports = ( function () {
	"use strict";

	const DEFAULT_OPTIONS = {
		eventTarget: document
	};

	function Mouse(options) {
		options = options || {};
		for (var option in DEFAULT_OPTIONS) {
			if (options[option] === undefined) options[option] = DEFAULT_OPTIONS[option];
		}

		var pointerMesh = options.pointerMesh || new THREE.Mesh(new THREE.CircleBufferGeometry(0.014, 8), new THREE.MeshBasicMaterial({color: 0xffee22}));
		pointerMesh.matrixAutoUpdate = false;
		this.pointerMesh = pointerMesh;

		var eventTarget = options.eventTarget;

		var material = new THREE.MeshBasicMaterial({color: 0xff00ff});
		var stageGeom = new THREE.BoxBufferGeometry(2.5, 1.1, 3.5);
		var stageObject = new THREE.Mesh(stageGeom, material);
		this.stageObject = stageObject;

		function onMouseMove(evt) {
			var aspect = window.innerWidth / window.innerHeight;
			if (document.pointerLockElement) {
				pointerMesh.position.x += evt.movementX / window.innerWidth;
				pointerMesh.position.y -= evt.movementY / window.innerHeight / aspect;
			} else {
				pointerMesh.position.x = -0.5 + evt.screenX / window.innerWidth;
				pointerMesh.position.y =  (0.5 - evt.screenY / window.innerHeight) / aspect;
			}
			pointerMesh.updateMatrix();
		}
		eventTarget.addEventListener("mousemove", onMouseMove, false);

		// function onClick(evt) {
		// 	// TODO
		// }
		// eventTarget.addEventListener("click", onClick, false);
	}

	return Mouse;
} )();

},{}],7:[function(require,module,exports){
module.exports = ( function () {
    "use strict";

    function Stage() {
        this.hmdCalibrationPose = null;
        this.deskHeight = 29 * 0.0254;
        this.objects = [];

        var vrDisplay;

        navigator.getVRDisplays().then( function (displays) {
            for (var i = 0; i < displays.length; i++) {
                vrDisplay = displays[i];
                console.log('vrDisplay:\n' + vrDisplay);
                if (vrDisplay.stageParameters && vrDisplay.stageParameters.sittingToStandingTransform) {
                    console.log('sittingToStandingTransform:\n' + vrDisplay.stageParameters.sittingToStandingTransform);
                } else {
                    console.warn('no sittingToStandingTransform provided by the VRDisplay');
                }
            }
        } );

        this.updateCalibrationPose = function ( pose, t ) {
            if (pose) console.log(pose);
            if (t) console.log(t);
        }.bind(this);

        this.save = function () {
            // console.log('saving poses of stage objects');
            var transforms = {};
            this.objects.forEach( function (object) {
                if (object.name) {
                    transforms[object.name] = {
                        position: object.position.toArray(),
                        quaternion: object.quaternion.toArray()
                    };
                    console.log(transforms);
                }
            } );
            return transforms;
        }.bind(this);

        this.load = function (transforms) {
            if (!transforms) return;
            console.log('loading poses of stage objects...');
            this.objects.forEach( function (object) {
                if (object.name && transforms[object.name]) {
                    var transform = transforms[object.name];
                    object.position.fromArray(transform.position);
                    object.quaternion.fromArray(transform.quaternion);
                    object.updateMatrix();
                    object.updateMatrixWorld();
                }
            } );
        }.bind(this);

    }

    return Stage;
} )();

},{}],8:[function(require,module,exports){
/* global THREE */

module.exports = ( function () {
    "use strict";

    const UP = THREE.Object3D.DefaultUp;
    const RIGHT = new THREE.Vector3(1, 0, 0);

    var moveObject = ( function () {
        const MOVESPEED = 0.3;
        var euler = new THREE.Euler(0, 0, 0, 'YXZ');
        var pitchQuat = new THREE.Quaternion();
        return function (object, dt, moveFB, moveRL, moveUD, turnRL, turnUD) {
            if (moveFB || moveRL || moveUD || turnRL || turnUD) {
                euler.setFromQuaternion(object.quaternion);
                euler.y -= (turnRL) * dt;
                euler.x -= (turnUD) * dt;
                var heading = euler.y;
                var pitch = euler.x;
                var cos = Math.cos(heading),
                    sin = Math.sin(heading);
                object.position.z -= dt * MOVESPEED * ((moveFB) * cos + (moveRL) * sin);
                object.position.x += dt * MOVESPEED * ((moveRL) * cos - (moveFB) * sin);
                object.position.y += dt * MOVESPEED * moveUD;
                if (pitch) pitchQuat.setFromAxisAngle(RIGHT, pitch);
                object.quaternion.multiplyQuaternions(object.quaternion.setFromAxisAngle(UP, heading), pitchQuat);
                object.updateMatrix();
                object.updateMatrixWorld();
            }
        };
    } )();

    function ObjectSelector() {
        this.selection;
        var selectables = [];

        this.addSelectable = function (obj) {
            selectables.push(obj);
            if (!this.selection) this.selection = obj;
        }.bind(this);

        this.cycleSelection = ( function () {
            var i = 0;
            return function (inc) {
                i = (i + inc) % selectables.length;
                if (i < 0) i += selectables.length;
                this.selection = selectables[i];
            };
        } )().bind(this);
    }

    var DEADSCENE = new THREE.Scene();
    DEADSCENE.name = 'DEADSCENE';
    var displayText = ( function () {
        var textMeshes = {};
        var quadGeom = new THREE.PlaneBufferGeometry(1, 1);
        quadGeom.translate(0.5, 0.5, 0);
        const DEFAULT_OPTIONS = {
            object: DEADSCENE,
            position: [0, 0.05, -0.05],
            quaternion: [0, 0, 0, 1],
            coordSystem: 'local',
            textSize: 21
        };
        function displayText(text, options) {
            options = options || {};
            for (var kwarg in DEFAULT_OPTIONS) {
                if (options[kwarg] === undefined) options[kwarg] = DEFAULT_OPTIONS[kwarg];
            }
            var uuid = options.object.uuid;
            var key = JSON.stringify({text, uuid});
            var mesh = textMeshes[key];
            if (!mesh) {
                var canvas = document.createElement('canvas');
                canvas.height = 2 * options.textSize;
                canvas.width = 256; //2*ctx.measureText(text).width;
                var ctx = canvas.getContext('2d');
                ctx.font = String(options.textSize) + "px serif";
                // ctx.fillStyle   = 'rgba(23, 23, 23, 0.3)';
                // ctx.strokeStyle = 'rgba(23, 23, 23, 0.3)';
                // ctx.fillRect(  0, 0, canvas.width, canvas.height);
                // ctx.strokeRect(0, 0, canvas.width, canvas.height);
                ctx.fillStyle   = 'rgb(255, 72, 23)';
                ctx.strokeStyle = 'rgb(240, 70, 20)';
                ctx.fillText(  text, 0, options.textSize);
                ctx.strokeText(text, 0, options.textSize);
                var aspect = canvas.width / canvas.height;
                var texture = new THREE.Texture(canvas, THREE.UVMapping, THREE.ClampToEdgeWrapping, THREE.ClampToEdgeWrapping, THREE.LinearFilter, THREE.LinearFilter);
                var material = new THREE.MeshBasicMaterial({color: 0xffffff, map: texture, transparent: true});
                mesh = new THREE.Mesh(quadGeom, material);
                material.map.needsUpdate = true;
                if (options.coordSystem === 'local') {
                    options.object.add(mesh);
                    mesh.position.fromArray(options.position);
                    mesh.quaternion.fromArray(options.quaternion);
                    var worldScale = options.object.getWorldScale();
                    mesh.scale.set(aspect * 0.075 / worldScale.x, 0.075 / worldScale.y, 1 / worldScale.z);
                    mesh.updateMatrix();
                }
                textMeshes[key] = mesh;
            }
        }
        return displayText;
    } )();

    return {
        ObjectSelector: ObjectSelector,
        displayText: displayText,
        moveObject: moveObject,
        DEADSCENE: DEADSCENE
    };

} )();

},{}],9:[function(require,module,exports){
window.YAWVRB = {};

window.YAWVRB.App        = require('./App.js');
window.YAWVRB.Utils      = require('./Utils.js');
window.YAWVRB.Gamepad    = require('./Gamepad.js');
window.YAWVRB.GfxTablet  = require('./GfxTablet.js');
window.YAWVRB.Keyboard   = require('./Keyboard.js');
window.YAWVRB.LeapMotion = require('./LeapMotion.js');
window.YAWVRB.Mouse      = require('./Mouse.js');
window.YAWVRB.Stage      = require('./Stage.js');

},{"./App.js":1,"./Gamepad.js":2,"./GfxTablet.js":3,"./Keyboard.js":4,"./LeapMotion.js":5,"./Mouse.js":6,"./Stage.js":7,"./Utils.js":8}]},{},[9]);
