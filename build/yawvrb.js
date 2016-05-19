(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
/* global THREE */

const DEFAULT_OPTIONS = {
    useImmediatePose: false,
    onResetVRSensor: function (lastRotation, lastPosition) {
        console.log('lastRotation: ' + lastRotation);
        console.log('lastPosition: ' + lastPosition);
    }
};

function App(scene, config, rendererOptions) {
    "use strict";
    var _config = {};
    config = config || _config;
    for (var kwarg in config) {
        _config[kwarg] = config[kwarg];
    }
    for (kwarg in DEFAULT_OPTIONS) {
        if (config[kwarg] === undefined) _config[kwarg] = DEFAULT_OPTIONS[kwarg];
    }
    config = _config;
    console.log('YAWVRB.App config:');
    console.log(config);

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
        } else {
            console.error('there is no capable VRDisplay available');
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
/* global THREE, CANNON */
module.exports = ( function () {
    "use strict";

    const DEADZONE = 0.145;

    var gamepads;
    var buttonsPresseds = [];
    var gamepadCommands = [];
    var xboxGamepads = [];
    var vrGamepads = [];
    var viveMeshA = new THREE.Mesh(new THREE.BoxBufferGeometry(0.06, 0.06, 0.13), new THREE.MeshLambertMaterial({color: 0xff2222}));
    var viveMeshB = new THREE.Mesh(new THREE.BoxBufferGeometry(0.06, 0.06, 0.13), new THREE.MeshLambertMaterial({color: 0x22ff22}));
    viveMeshA.matrixAutoUpdate = false;
    viveMeshB.matrixAutoUpdate = false;
    var vrGamepadMeshes = [viveMeshA, viveMeshB];

    const DEFAULT_OPTIONS = {
        toolLength: 0.15,
        toolRadius: 0.0034,
        toolMass: 0.04,
        tipShape: 'Cylinder',
        tipRadius: 0.0034,
        toolColor: 0xeebb99,
        tipColor: 0x99bbee,
        useShadowMesh: true,
        shadowPlane: 0.001,
        shadowMaterial: new THREE.MeshBasicMaterial({color: 0x333333}),
        shadowLightPosition: new THREE.Vector4(3, 7, 0, 0.1),
        tipMaterial: new CANNON.Material()
    };
    function makeTool(vrGamepad, options) {
        var _options = {};
        options = options || _options;
        for (var kwarg in options) {
            _options[kwarg] = options[kwarg];
        }
        for (kwarg in DEFAULT_OPTIONS) {
            if (_options[kwarg] === undefined) _options[kwarg] = DEFAULT_OPTIONS[kwarg];
        }
        options = _options;
        var toolGeom = new THREE.CylinderGeometry(options.toolRadius, options.toolRadius, options.toolLength, 10, 1, false);
        toolGeom.translate(0, -0.5 * options.toolLength, 0);
        toolGeom.rotateX(-0.5 * Math.PI);
        var bufferGeom = new THREE.BufferGeometry();
        bufferGeom.fromGeometry(toolGeom);
        toolGeom.dispose();
        toolGeom = bufferGeom;
        var toolMaterial = new THREE.MeshLambertMaterial({color: options.toolColor, transparent: true});
        var toolMesh = new THREE.Mesh(toolGeom, toolMaterial);
        var toolBody = new CANNON.Body({mass: options.toolMass, type: CANNON.Body.KINEMATIC});
        toolBody.material = options.tipMaterial;
        toolBody.addShape(new CANNON.Cylinder(options.tipRadius, options.tipRadius, 2*options.tipRadius, 8),
            new CANNON.Vec3(0, 0, options.tipRadius));
        var position = new THREE.Vector3();
        var velocity = new THREE.Vector3();
        var quaternion = new THREE.Quaternion();
        var worldPosition = new THREE.Vector3();
        var worldQuaternion = new THREE.Quaternion();
        var worldScale = new THREE.Vector3();
        // var matrixWorldInverse = new THREE.Matrix4();
        var lt = 0;
        function update(t) {
            var dt = 0.001 * (t - lt);
            if (vrGamepad && vrGamepad.pose) {
                toolMesh.position.fromArray(vrGamepad.pose.position);
                toolMesh.quaternion.fromArray(vrGamepad.pose.orientation);
                var parent = toolMesh.parent;
                var body = toolBody;
                position.copy(toolMesh.position);
                velocity.copy(body.position);
                if (parent) {
                    parent.matrixWorld.decompose(worldPosition, worldQuaternion, worldScale);
                    position.applyMatrix4(parent.matrixWorld);
                    quaternion.multiplyQuaternions(worldQuaternion, toolMesh.quaternion);
                }
                body.position.copy(position);
                body.quaternion.copy(quaternion);
                velocity.sub(position);
                velocity.multiplyScalar(-1 / dt);
                body.velocity.copy(velocity);
            } else {
                // update mesh based on kinematic projection:
                toolBody.sleep();
                // toolMesh.position.copy(toolBody.interpolatedPosition);
                // matrixWorldInverse.getInverse(toolMesh.parent.matrixWorld);
                // toolMesh.position.applyMatrix4(matrixWorldInverse);
            }
            toolMesh.updateMatrix();
            toolMesh.updateMatrixWorld();
            lt = t;
        }
        return {
            body: toolBody,
            mesh: toolMesh,
            update: update
        };
    }

    function pollGamepads() {
        gamepads = navigator.getGamepads();
        for (var i = 0; i < gamepads.length; i++) {
            var gamepad = gamepads[i];
            if (!gamepad) continue;
            if (buttonsPresseds[i] === undefined) {
                console.log('new gamepad: %s', gamepad.id);
                if (/openvr/i.test(gamepad.id)) {
                    vrGamepads.push(gamepad);
                } else if (/xbox/i.test(gamepad.id) || /xinput/i.test(gamepad.id)) {
                    xboxGamepads.push(gamepad);
                }
                buttonsPresseds[i] = [];
                for (var j = 0; j < gamepad.buttons.length; j++) {
                    buttonsPresseds[i].push(false);
                }
                onGamepadConnected({gamepad: gamepad});
            }
        }
    }

    function setGamepadCommands(index, commands) {
        gamepadCommands[index] = commands;
    }

    var _onGamepadConnected = null;

    function setOnGamepadConnected(onGamepadConnected) {
        _onGamepadConnected = onGamepadConnected;
    }

    function onGamepadConnected(e) {
        console.log("Gamepad connected at index %d: %s - %d buttons, %d axes", e.gamepad.index, e.gamepad.id, e.gamepad.buttons.length, e.gamepad.axes.length);
        if (_onGamepadConnected) {
            _onGamepadConnected(e);
        }
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

    function update() {
        var values = [];
        pollGamepads();
        for (var i = 0; i < gamepads.length; ++i) {
            var gamepad = gamepads[i];
            if (!gamepad) continue;
            var buttonsPressed = buttonsPresseds[i];
            var commands = gamepadCommands[i] || {};
            // get all button/axes values:
            var axesValues = {};
            for (var name in commands) {
                axesValues[name] = 0;
                var command = commands[name];
                if (command.axes) {
                    for (var j = 0; j < gamepad.axes.length; j++) {
                        var axis = gamepad.axes[j];
                        if (Math.abs(axis) > DEADZONE) {
                            if (command.axes.indexOf(j) !== -1) {
                                axesValues[name] = gamepad.axes[j];
                                if (command.flipAxes) {
                                    axesValues[name] *= -1;
                                }
                                break;
                            }
                        }
                    }
                } else if (command.buttons) {
                    for (j = 0; j < command.buttons.length; j++) {
                        if (gamepad.buttons[command.buttons[j]] && gamepad.buttons[command.buttons[j]].pressed) {
                            axesValues[name] = 1;
                            break;
                        }
                    }
                }
            }
            values.push(axesValues);
            for (j = 0; j < gamepad.buttons.length; j++) {
                if (gamepad.buttons[j]) {
                    if (gamepad.buttons[j].pressed && !buttonsPressed[j]) {
                        buttonsPressed[j] = true;
                        for (name in commands) {
                            command = commands[name];
                            if (command.commandDown && command.buttons && command.buttons.indexOf(j) !== -1) {
                                command.commandDown(j, gamepad.axes);
                            }
                        }
                    } else if (!gamepad.buttons[j].pressed && buttonsPressed[j]) {
                        buttonsPressed[j] = false;
                        for (name in commands) {
                            command = commands[name];
                            if (command.commandUp && command.buttons && command.buttons.indexOf(j) !== -1) {
                                command.commandUp(j, gamepad.axes);
                            }
                        }
                    }
                }
            }
        }
        return values;
    }

    pollGamepads();

    return {
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
        },
        viveMeshA: viveMeshA,
        viveMeshB: viveMeshB,
        vrGamepadMeshes: vrGamepadMeshes,
        setGamepadCommands: setGamepadCommands,
        setOnGamepadConnected: setOnGamepadConnected,
        update: update,
        makeTool: makeTool,
        vrGamepads: vrGamepads,
        xboxGamepads: xboxGamepads
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
    const FORWARD = new THREE.Vector3(0, 0, -1);

    const DEFAULT_OPTIONS = {
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
        var _options = {};
        options = options || _options;
        for (var option in options) {
            _options[option] = options[option];
        }
        for (option in DEFAULT_OPTIONS) {
            if (options[option] === undefined) _options[option] = DEFAULT_OPTIONS[option];
        }
        options = _options;
        console.log('Leap Motion tool options:');
        console.log(options);

        // coordinate transformations are performed via three.js scene graph
        var toolRoot = new THREE.Object3D();
        toolRoot.scale.set(LEAP2METERS, LEAP2METERS, LEAP2METERS);

        toolRoot.position.set(0, -18 * 0.0254, -0.49);

        // set up / connect to leap controller:

        var leapController = new Leap.Controller({background: true,
                                                  host: options.host,
                                                  port: options.port});

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
        var armRadius = METERS2LEAP*0.021,
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
        var radius = METERS2LEAP*0.02;
        var palmGeom = new THREE.SphereBufferGeometry(radius).scale(1, 0.4, 1);
        var palmMesh = new THREE.Mesh(palmGeom, handMaterial);
        var palms = [palmMesh, palmMesh.clone()];
        leftRoot.add(palms[0]);
        rightRoot.add(palms[1]);

        // var textureLoader = new THREE.TextureLoader();
        // var spriteTexture = textureLoader.load('/node_modules/three.js/examples/textures/sprite1.png'); , function (texture) {
        // } );
        // var spriteMaterial = new THREE.SpriteMaterial({map: spriteTexture});
        // var sphereSprite = new THREE.Sprite(spriteMaterial);

        // fingertips:
        radius = METERS2LEAP*0.005;
        var fingerTipGeom = new THREE.SphereBufferGeometry(radius);
        var fingerTipMesh = new THREE.Mesh(fingerTipGeom, handMaterial);
        // var fingerTipMesh = sphereSprite.clone();
        // fingerTipMesh.scale.set(radius, radius, radius);
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
        var joint2Mesh = fingerTipMesh.clone();
        joint2Mesh.scale.set(55/50, 55/50, 55/50);
        var joint2s = [[joint2Mesh, joint2Mesh.clone(), joint2Mesh.clone(), joint2Mesh.clone(), joint2Mesh.clone()],
                       [joint2Mesh.clone(), joint2Mesh.clone(), joint2Mesh.clone(), joint2Mesh.clone(), joint2Mesh.clone()]];
        leftRoot.add(joint2s[0][0], joint2s[0][1], joint2s[0][2], joint2s[0][3], joint2s[0][4]);
        rightRoot.add(joint2s[1][0], joint2s[1][1], joint2s[1][2], joint2s[1][3], joint2s[1][4]);
        var joint3Mesh = fingerTipMesh.clone();
        joint3Mesh.scale.set(7/5, 7/5, 7/5);
        var joint3s = [[joint3Mesh, joint3Mesh.clone(), joint3Mesh.clone(), joint3Mesh.clone()],
                       [joint3Mesh.clone(), joint3Mesh.clone(), joint3Mesh.clone(), joint3Mesh.clone()]];
        leftRoot.add(joint3s[0][0], joint3s[0][1], joint3s[0][2], joint3s[0][3]);
        rightRoot.add(joint3s[1][0], joint3s[1][1], joint3s[1][2], joint3s[1][3]);

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
                    var handJoint3s = joint3s[i];
                    for (var j = 0; j < hand.fingers.length; j++) {
                        var finger = hand.fingers[j];
                        handFingerTips[j].position.fromArray(finger.tipPosition);
                        handFingerTips[j].updateMatrix();
                        handJoints[j].position.fromArray(finger.bones[1].nextJoint);
                        handJoints[j].updateMatrix();
                        handJoint2s[j].position.fromArray(finger.bones[2].nextJoint);
                        handJoint2s[j].updateMatrix();
                    }
                    for (j = 0; j < 4; j++) {
                        finger = hand.fingers[j+1];
                        handJoint3s[j].position.fromArray(finger.bones[1].prevJoint);
                        handJoint3s[j].updateMatrix();
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
		var _options = {};
		options = options || _options;
		for (var option in DEFAULT_OPTIONS) {
			_options[option] = options[option];
		}
		for (option in DEFAULT_OPTIONS) {
			if (options[option] === undefined) _options[option] = DEFAULT_OPTIONS[option];
		}
		options = _options;

		var stageObject = new THREE.Mesh(new THREE.BoxBufferGeometry(5.75 * 0.01, 3.75 * 0.01, 9.5 * 0.01));
		this.stageObject = stageObject;

		var pointerMesh = options.pointerMesh || new THREE.Mesh(new THREE.CircleBufferGeometry(0.014, 8), new THREE.MeshBasicMaterial({color: 0xffee22}));
		pointerMesh.matrixAutoUpdate = false;
		pointerMesh.visible = false;
		this.pointerMesh = pointerMesh;

		var eventTarget = options.eventTarget;

		var pointerEnabled = false;
		this.togglePointer = function () {
			if (pointerEnabled) {
				eventTarget.removeEventListener("mousemove", onMouseMove);
				pointerEnabled = false;
				pointerMesh.visible = false;
			} else {
				eventTarget.addEventListener("mousemove", onMouseMove, false);
				pointerEnabled = true;
				pointerMesh.visible = true;
			}
			function onMouseMove(evt) {
				var aspect = window.innerWidth / window.innerHeight;
				if (document.pointerLockElement) {
					pointerMesh.position.x += evt.movementX / window.innerWidth;
					pointerMesh.position.y -= evt.movementY / window.innerHeight / aspect;
				} else {
					pointerMesh.position.x = -0.5 + evt.screenX / window.innerWidth;
					stageObject.position.x = -12 * 0.0254 + 0.1 * evt.screenX / window.innerWidth;
					pointerMesh.position.y =  (0.5 - evt.screenY / window.innerHeight) / aspect;
					stageObject.position.z =  -12 * 0.0254 + 0.1 * (0.5 - evt.screenY / window.innerHeight) / aspect;
				}
				pointerMesh.updateMatrix();
				stageObject.updateMatrix();
			}
		};

		// function onClick(evt) {
		// 	// TODO
		// }
		// eventTarget.addEventListener("click", onClick, false);
	}

	return Mouse;
} )();

},{}],7:[function(require,module,exports){
/* global THREE */
module.exports = ( function () {
    "use strict";

    function Stage() {
        this.hmdCalibrationPose = null;

        var vrDisplay;

        var stageRoot = new THREE.Object3D();
        stageRoot.matrixAutoUpdate = false;
        this.stageRoot = stageRoot;

        this.updateSittingToStandingTransform = function () {
            if (vrDisplay && vrDisplay.stageParameters && vrDisplay.stageParameters.sittingToStandingTransform) {
                console.log('sittingToStandingTransform:\n' + vrDisplay.stageParameters.sittingToStandingTransform);
                stageRoot.matrix.fromArray(vrDisplay.stageParameters.sittingToStandingTransform);
                stageRoot.matrix.decompose(stageRoot.position, stageRoot.quaternion, stageRoot.scale);
            }
        };

        if (navigator.getVRDisplays) {
            console.log('checking VRDisplays for stage parameters...');
            navigator.getVRDisplays().then( function (displays) {
                for (var i = 0; i < displays.length; i++) {
                    vrDisplay = displays[i];
                    console.log('%s:\n%s', vrDisplay.deviceName, JSON.stringify(vrDisplay, undefined, 2));
                    if (vrDisplay.stageParameters && vrDisplay.stageParameters.sittingToStandingTransform) {
                        console.log('sittingToStandingTransform:\n' + vrDisplay.stageParameters.sittingToStandingTransform);
                        stageRoot.matrix.fromArray(vrDisplay.stageParameters.sittingToStandingTransform);
                        stageRoot.matrix.decompose(stageRoot.position, stageRoot.quaternion, stageRoot.scale);
                    } else {
                        console.warn('no sittingToStandingTransform provided by the VRDisplay');
                        stageRoot.position.y = 1.2;
                        stageRoot.updateMatrix();
                    }
                }
            } );
        } else {
            console.warn('your browser does not support the latest WebVR API');
        }

        this.updateCalibrationPose = function ( pose, t ) {
            if (pose) console.log(pose);
            if (t) console.log(t);
        }.bind(this);

        this.save = function () {
            console.log('saving poses of stage objects...');
            var transforms = {};
            stageRoot.children.forEach( function (object) {
                if (object.name) {
                    object.updateMatrix();
                    object.updateMatrixWorld();
                    object.matrix.decompose(object.position, object.quaternion, object.scale);
                    transforms[object.name] = {
                        position: object.position.toArray(),
                        quaternion: object.quaternion.toArray()
                    };
                }
            } );
            console.log(JSON.stringify(transforms, undefined, 2));
            localStorage.setItem('stagePoses', JSON.stringify(transforms, undefined, 2));
            return transforms;
        }.bind(this);

        this.load = function (transforms) {
            if (!transforms) {
                transforms = localStorage.getItem('stagePoses');
                if (!transforms) {
                    console.warn('no stage poses found in localStorage');
                    return;
                } else {
                    transforms = JSON.parse(transforms);
                }
            }
            console.log('loading poses of stage objects...');
            stageRoot.children.forEach( function (object) {
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
module.exports = ( function() {
    "use strict";
    function SynthSpeaker(options) {
        options = options || {};
        this.volume = options.volume || 1;
        this.rate   = options.rate || 1;
        this.pitch  = options.pitch || 1;

        this.queue = [];
        this.onBegins = [];
        this.onEnds = [];
        this.speaking = false;

        var onend = function () {
            var onEnd = this.onEnds.shift();
            if (onEnd) {
                onEnd();
            }
            this.utterance = new SpeechSynthesisUtterance();
            this.utterance.volume = this.volume;
            this.utterance.rate = this.rate;
            this.utterance.pitch = this.pitch;
            this.utterance.onend = onend;
            if (this.queue.length > 0) {
                this.utterance.text = this.queue.shift();
                var onBegin = this.onBegins.shift();
                if (onBegin) {
                    onBegin();
                }
                speechSynthesis.speak(this.utterance);
            } else {
                this.speaking = false;
            }
        }.bind(this);

        this.utterance = new SpeechSynthesisUtterance();
        this.utterance.onend = onend;
        this.utterance.volume = this.volume;
        this.utterance.rate = this.rate;
        this.utterance.pitch = this.pitch;

    }

    SynthSpeaker.prototype.speak = function(text, onBegin, onEnd) {
        this.onEnds.push(onEnd);
        if (this.speaking) {
            this.queue.push(text);
            this.onBegins.push(onBegin);
        } else {
            if (onBegin) {
                onBegin();
            }
            this.utterance.text = text;
            this.speaking = true;
            speechSynthesis.speak(this.utterance);
        }
    };

    if (window.speechSynthesis) {
        return SynthSpeaker;
    } else {
        console.warn("speechSynthesis not supported");
        return function () {
            this.volume = 0;
            this.rate = 1;
            this.pitch = 1;
            this.speak = function (text, onBegin, onEnd) {
                if (onBegin) onBegin();
                if (onEnd) onEnd();
            };
        };
    }
} )();

},{}],9:[function(require,module,exports){
/* global THREE */
module.exports = ( function () {
    "use strict";
    var alphas  = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
    var digits  = "0123456789";
    var symbols = ",./;'[]\\-=<>?:\"{}|_+~!@#$%^&*()";
    var chars   = alphas + digits + symbols;

    function TextGeomCacher(font, options) {
        options = options || {};
        var textGeomParams = {
            font:          font,
            size:          options.size || 0.12,
            height:        options.height || 0,
            curveSegments: options.curveSegments || 2
        };

        this.geometries = {};
        for (var i = 0; i < chars.length; i++) {
            var c = chars[i];
            var geom = new THREE.TextGeometry(c, textGeomParams);
            var bufferGeom = new THREE.BufferGeometry();
            bufferGeom.fromGeometry(geom);
            geom.dispose();
            this.geometries[c] = bufferGeom;
        }

        this.makeObject = function (text, material) {
            var object = new THREE.Object3D();
            object.matrixAutoUpdate = false;
            for (var j = 0; j < text.length; j++) {
                var c = text[j];
                if (c !== ' ') {
                    var mesh = new THREE.Mesh(this.geometries[c], material);
                    mesh.matrixAutoUpdate = false;
                    mesh.position.x = 0.8*textGeomParams.size * j;
                    mesh.updateMatrix();
                    object.add(mesh);
                }
            }
            return object;
        }.bind(this);
    }

    function TextGeomLogger(textGeomCacher, options) {
        options = options || {};
        var material   = options.material || new THREE.MeshBasicMaterial({color: 0xff2201});
        var nrows      = options.nrows || 20;
        //var ncols      = options.ncols || 30;
        var lineHeight = options.lineHeight || 1.8 * 0.12;

        var lineObjects = {};

        this.root = new THREE.Object3D();
        this.root.matrixAutoUpdate = false;

        this.log = function (msg) {
            var lines = msg.split(/\n/);
            // create / clone lines:
            for (var i = 0; i < lines.length; i++) {
                var line = lines[i];
                var lineObject = lineObjects[line];
                if (lineObject) {
                    lineObject = lineObject.clone();
                    this.root.add(lineObject);
                } else {
                    lineObject = textGeomCacher.makeObject(line, material);
                    lineObjects[line] = lineObject;
                    this.root.add(lineObject);
                }
                lineObject.position.y = -(i + 1) * lineHeight;
                lineObject.updateMatrix();
            }
            this.root.updateMatrixWorld(true);
        }.bind(this);

        var lt = 0;
        this.update = function (t) {
            var dt = 0.001 * (t - lt);
            lt = t;
            var numChildren = this.root.children.length;
            if (numChildren === 0) return;
            var lastLineObject = this.root.children[numChildren-1];
            if (lastLineObject.position.y < 0) {
                for (var i = 0; i < numChildren; i++) {
                    this.root.children[i].position.y += 2 * lineHeight * dt;
                    this.root.children[i].updateMatrix();
                }
            }
            // remove rows exceeding max display
            if (lastLineObject.position.y >= 0) {
                for (i = numChildren - 1; i >= nrows; i--) {
                    this.root.remove(this.root.children[0]);
                }
            }
        }.bind(this);

        this.clear = function () {
            for (var i = this.root.children.length - 1; i >= 0; i--) {
                this.root.remove(this.root.children[this.root.children.length - 1]);
            }
        }.bind(this);
    }

    return {
        TextGeomCacher: TextGeomCacher,
        TextGeomLogger: TextGeomLogger
    };

} )();

},{}],10:[function(require,module,exports){
/* global THREE */

module.exports = ( function () {
    "use strict";

    var moveObject = ( function () {
        const MOVESPEED = 0.3;
        var euler = new THREE.Euler(0, 0, 0, 'YXZ');
        return function (object, dt, moveFB, moveRL, moveUD, turnRL, turnUD) {
            if (moveFB || moveRL || moveUD || turnRL || turnUD) {
                euler.setFromQuaternion(object.quaternion);
                euler.y -= (turnRL) * dt;
                euler.x -= (turnUD) * dt;
                object.quaternion.setFromEuler(euler);
                var cos = Math.cos(euler.y),
                    sin = Math.sin(euler.y);
                object.position.z -= dt * MOVESPEED * ((moveFB) * cos + (moveRL) * sin);
                object.position.x += dt * MOVESPEED * ((moveRL) * cos - (moveFB) * sin);
                object.position.y += dt * MOVESPEED * moveUD;
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
            var _options = {};
            options = options || _options;
            for (var kwarg in options) {
                _options[kwarg] = options[kwarg];
            }
            for (kwarg in DEFAULT_OPTIONS) {
                if (options[kwarg] === undefined) _options[kwarg] = DEFAULT_OPTIONS[kwarg];
            }
            options = _options;
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

    function TextLabel(options) {
        const DEFAULT_OPTIONS = {
            object: DEADSCENE,
            position: [0, 0.05, -0.05],
            quaternion: [0, 0, 0, 1],
            coordSystem: 'local',
            textSize: 21
        };
        var _options = {};
        options = options || _options;
        for (var kwarg in options) {
            _options[kwarg] = options[kwarg];
        }
        for (kwarg in DEFAULT_OPTIONS) {
            if (options[kwarg] === undefined) _options[kwarg] = DEFAULT_OPTIONS[kwarg];
        }
        options = _options;
        var canvas = document.createElement('canvas');
        canvas.height = 2 * options.textSize;
        canvas.width = 256; //2*ctx.measureText(text).width;
        var ctx = canvas.getContext('2d');
        ctx.font = String(options.textSize) + "px serif";
        ctx.fillStyle   = 'rgb(255, 72, 23)';
        ctx.strokeStyle = 'rgb(240, 70, 20)';
        var texture = new THREE.Texture(canvas, THREE.UVMapping, THREE.ClampToEdgeWrapping, THREE.ClampToEdgeWrapping, THREE.LinearFilter, THREE.LinearFilter);
        var aspect = canvas.width / canvas.height;
        var material = new THREE.MeshBasicMaterial({color: 0xffffff, map: texture, transparent: true});
        var quadGeom = new THREE.PlaneBufferGeometry(1, 1);
        quadGeom.translate(0.5, 0.5, 0);
        var mesh = new THREE.Mesh(quadGeom, material);
        if (options.coordSystem === 'local') {
            options.object.add(mesh);
            mesh.position.fromArray(options.position);
            mesh.quaternion.fromArray(options.quaternion);
            var worldScale = options.object.getWorldScale();
            mesh.scale.set(aspect * 0.075 / worldScale.x, 0.075 / worldScale.y, 1 / worldScale.z);
            mesh.updateMatrix();
        }
        this.mesh = mesh;
        this.setText = function (text) {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.fillText(  text, 0, options.textSize);
            ctx.strokeText(text, 0, options.textSize);
            material.map.needsUpdate = true;
        }.bind(this);
    }

    var URL_PARAMS = ( function () {
        var params = {};
        location.search.substr(1).split("&").forEach( function(item) {
            var k = item.split("=")[0],
                v = decodeURIComponent(item.split("=")[1]);
            if (k in params) {
                params[k].push(v);
            } else {
                params[k] = [v];
            }
        } );
        for (var k in params) {
            if (params[k].length === 1)
                params[k] = params[k][0];
            if (params[k] === 'true')
                params[k] = true;
            else if (params[k] === 'false')
                params[k] = false;
        }
        return params;
    } )();

    var combineObjects = function (a, b) {
        var c = {},
            k;
        for (k in a) {
            c[k] = a[k];
        }
        for (k in b) {
            if (!c.hasOwnProperty(k)) {
                c[k] = b[k];
            }
        }
        return c;
    };

    var makeObjectArray = function (obj, keyKey) {
        keyKey = keyKey || "key";
        return Object.keys(obj).map(function (k) {
            var item = {};
            item[keyKey] = k;
            for (var p in obj[k]) {
                item[p] = obj[k][p];
            }
            return item;
        });
    };

    // adapted from detectmobilebrowsers.com
    var isMobile = function () {
        var a = navigator.userAgent || navigator.vendor || window.opera;
        return (/(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|iris|kindle|lge |maemo|midp|mmp|mobile.+firefox|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows ce|xda|xiino/i.test(a)||/1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas\-|your|zeto|zte\-/i.test(a.substr(0,4)));
    };

    return {
        ObjectSelector: ObjectSelector,
        moveObject: moveObject,
        displayText: displayText,
        TextLabel: TextLabel,
        URL_PARAMS: URL_PARAMS,
        combineObjects: combineObjects,
        makeObjectArray: makeObjectArray,
        isMobile: isMobile
    };

} )();

},{}],11:[function(require,module,exports){
window.YAWVRB = {};

window.YAWVRB.App           = require('./App.js');
window.YAWVRB.Utils         = require('./Utils.js');
window.YAWVRB.Gamepads      = require('./Gamepads.js');
window.YAWVRB.GfxTablet     = require('./GfxTablet.js');
window.YAWVRB.Keyboard      = require('./Keyboard.js');
window.YAWVRB.LeapMotion    = require('./LeapMotion.js');
window.YAWVRB.Mouse         = require('./Mouse.js');
window.YAWVRB.Stage         = require('./Stage.js');
window.YAWVRB.SynthSpeaker  = require('./SynthSpeaker.js');
window.YAWVRB.TextGeomUtils = require('./TextGeomUtils.js');

},{"./App.js":1,"./Gamepads.js":2,"./GfxTablet.js":3,"./Keyboard.js":4,"./LeapMotion.js":5,"./Mouse.js":6,"./Stage.js":7,"./SynthSpeaker.js":8,"./TextGeomUtils.js":9,"./Utils.js":10}]},{},[11]);
