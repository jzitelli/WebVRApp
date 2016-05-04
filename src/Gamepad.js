/* global THREE */

module.exports = ( function () {
    "use strict";

    const DEADZONE = 0.145;

    var vrGamepads;
    var xboxGamepads;
    var buttonsPresseds;
    var vrButtonsPresseds;

    pollGamepads();

    function pollGamepads() {
        var gamepads = navigator.getGamepads();
        vrGamepads = [];
        xboxGamepads = [];
        buttonsPresseds = [];
        vrButtonsPresseds = [];
        var gamepad,
            i;
        for (i = 0; i < gamepads.length; ++i) {
            gamepad = gamepads[i];
            if (gamepad && (/xbox/i.test(gamepad.id) || /xinput/i.test(gamepad.id))) {
                xboxGamepads.push(gamepad);
            }
            if (gamepad && gamepad.pose) {
                vrGamepads.push(gamepad);
            }
        }
        for (i = 0; i < xboxGamepads.length; i++) {
            buttonsPresseds.push([false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false]);
        }
        for (i = 0; i < vrGamepads.length; i++) {
            vrButtonsPresseds.push([false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false]);
        }
        return {
            gamepads: gamepads,
            vrGamepads: vrGamepads,
            xboxGamepads: xboxGamepads,
            buttonsPresseds: buttonsPresseds,
            vrButtonsPresseds: vrButtonsPresseds
        };
    }

    function onGamepadConnected(e) {
        console.log("Gamepad connected at index %d: %s", e.gamepad.index, e.gamepad.id);
        pollGamepads();
    }
    window.addEventListener("gamepadconnected", onGamepadConnected);

    function onGamepadDisconnected(e) {
        console.log("Gamepad disconnected from index %d: %s", e.gamepad.index, e.gamepad.id);
        pollGamepads();
    }
    window.addEventListener("gamepaddisconnected", onGamepadDisconnected);

    var viveMeshA = new THREE.Mesh(new THREE.BoxBufferGeometry(0.06, 0.18, 0.06), new THREE.MeshLambertMaterial({color: 0xff2222}));
    viveMeshA.matrixAutoUpdate = false;
    var viveMeshB = new THREE.Mesh(new THREE.BoxBufferGeometry(0.06, 0.18, 0.06), new THREE.MeshLambertMaterial({color: 0x22ff22}));
    viveMeshB.matrixAutoUpdate = false;

    function update(gamepadCommands, vrGamepadCommands) {
        var gamepad, mesh, buttonsPressed, command, name, axis;
        var i, j, k;

        var values = [];

        // vr Gamepads:

        for (i = 0; i < vrGamepads.length; ++i) {
            gamepad = vrGamepads[i];
            mesh = (i === 0 ? viveMeshA : viveMeshB);
            mesh.quaternion.fromArray(gamepad.pose.orientation);
            mesh.position.fromArray(gamepad.pose.position);
            mesh.updateMatrix();
            mesh.updateMatrixWorld();

            buttonsPressed = vrButtonsPresseds[i];

            for (j = 0; j < gamepad.buttons.length; ++j) {
                if (gamepad.buttons[j].pressed) {
                    if (!buttonsPressed[j]) {
                        buttonsPressed[j] = true;
                        for (name in vrGamepadCommands) {
                            command = vrGamepadCommands[name];
                            if (command.buttons && command.commandDown) {
                                for (k = 0; k < command.buttons.length; k++) {
                                    if (command.buttons[k] === j) {
                                        command.commandDown(j);
                                        break;
                                    }
                                }
                            }
                        }
                    }
                } else {
                    if (buttonsPressed[j]) {
                        buttonsPressed[j] = false;
                    }
                }
            }

            // get all axes values:
            var axesValues = {};
            for (name in vrGamepadCommands) {
                axesValues[name] = 0;
                command = vrGamepadCommands[name];
                for (j = 0; j < gamepad.axes.length; ++j) {
                    axis = gamepad.axes[j];
                    if (Math.abs(axis) > DEADZONE) {
                        if (command.axes && command.axes.indexOf(j) !== -1) {
                            axesValues[name] = gamepad.axes[j];
                            break;
                        }
                    }
                }
            }

            values.push(axesValues);

            // if ("vibrate" in gamepad) {
            //     for (j = 0; j < gamepad.buttons.length; ++j) {
            //         if (gamepad.buttons[j].pressed) {
            //             gamepad.vibrate(100);
            //         }
            //     }
            // }

        }

        // xbox Gamepads:

        for (i = 0; i < xboxGamepads.length; ++i) {
            gamepad = xboxGamepads[i];
            buttonsPressed = buttonsPresseds[i];
            for (j = 0; j < gamepad.buttons.length; ++j) {
                if (gamepad.buttons[j].pressed) {
                    if (!buttonsPressed[j]) {
                        buttonsPressed[j] = true;
                        for (name in gamepadCommands) {
                            command = gamepadCommands[name];
                            if (command.buttons && command.commandDown && command.buttons.indexOf(j) !== -1) {
                                command.commandDown(j);
                                break;
                            }
                        }
                    } else {
                        if (buttonsPressed[j]) {
                            buttonsPressed[j] = false;
                        }
                    }
                }
            }
            axesValues = {};
            for (name in gamepadCommands) {
                axesValues[name] = 0;
                command = gamepadCommands[name];
                for (j = 0; j < gamepad.axes.length; ++j) {
                    axis = gamepad.axes[j];
                    if (Math.abs(axis) > DEADZONE) {
                        if (command.axes && command.axes.indexOf(j) !== -1) {
                            axesValues[name] = gamepad.axes[j];
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
        viveMeshA: viveMeshA,
        viveMeshB: viveMeshB,
        pollGamepads: pollGamepads,
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
