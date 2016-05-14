/* global THREE */
module.exports = ( function () {
    "use strict";

    const DEADZONE = 0.145;

    var gamepads;
    var buttonsPresseds = [];

    var xboxGamepads;

    var vrGamepads;
    var viveA = new THREE.Mesh(new THREE.BoxBufferGeometry(0.06, 0.18, 0.06), new THREE.MeshLambertMaterial({color: 0xff2222}));
    viveA.matrixAutoUpdate = false;
    var viveB = new THREE.Mesh(new THREE.BoxBufferGeometry(0.06, 0.18, 0.06), new THREE.MeshLambertMaterial({color: 0x22ff22}));
    viveB.matrixAutoUpdate = false;
    var vrGamepadMeshes = [viveA, viveB];

    pollGamepads();

    function pollGamepads() {
        gamepads = navigator.getGamepads();
        xboxGamepads = [];
        vrGamepads = [];
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
            }
        }
    }

    function onGamepadConnected(e) {
        console.log("Gamepad connected at index %d: %s - %d buttons, %d axes", e.gamepad.index, e.gamepad.id, e.gamepad.buttons.length, e.gamepad.axes.length);
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
    window.addEventListener("gamepaddfisconnected", onGamepadDisconnected);

    function update(commands) {
        var values = [];
        pollGamepads();
        for (var i = 0; i < gamepads.length; ++i) {
            var gamepad = gamepads[i];
            if (!gamepad) continue;
            var buttonsPressed = buttonsPresseds[i];
            for (var j = 0; j < gamepad.buttons.length; j++) {
                if (gamepad.buttons[j]) {
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
                        if (gamepad.buttons[command.buttons[j]] && gamepad.buttons[command.buttons[j]].pressed) {
                            axesValues[name] = 1;
                            break;
                        }
                    }
                }
            }
            values.push(axesValues);
        }
        // update openvr controller poses:
        for (i = 0; i < vrGamepads.length; i++) {
            gamepad = vrGamepads[i];
            var mesh = vrGamepadMeshes[i];
            mesh.position.fromArray(gamepad.pose.position);
            mesh.quaternion.fromArray(gamepad.pose.orientation);
            mesh.updateMatrix();
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
        },
        viveA: viveA,
        viveB: viveB
    };

} )();
