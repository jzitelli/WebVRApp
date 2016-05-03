module.exports = ( function () {
    "use strict";

    const DEADZONE = 0.12;

    var gamepads;
    if (navigator.getGamepads) {
        gamepads = navigator.getGamepads();
    } else if (navigator.webkitGetGamepads) {
        gamepads = navigator.webkitGetGamepads();
    }

    function Gamepad(commands) {
        this.gamepad = null;

        var index = 0;
        if (gamepads) {
            for (var i = index; i < gamepads.length; i++) {
                if (gamepads[i]) {
                    if (/STANDARD GAMEPAD/.test(gamepads[i].id)) {
                        this.gamepad = gamepads[i];
                        index = i;
                        setupCommands();
                        console.log("Using gamepad at index %d: %s. %d buttons, %d axes.", this.gamepad.index, this.gamepad.id, this.gamepad.buttons.length, this.gamepad.axes.length);
                        break;
                    }
                }
            }
        }

        this.logConnectedGamepads = logConnectedGamepads;
        function logConnectedGamepads() {
            for (var i = 0; i < gamepads.length; i++) {
                var gamepad = gamepads[i];
                if (gamepad && gamepad.connected) {
                    console.log("gamepad %d: %d %s", i, gamepad.index, gamepad.id);
                }
            }
        }

        function onGamepadConnected(e) {
            if (e.gamepad.index === index) {
                this.gamepad = e.gamepad;
                gamepads[index] = this.gamepad;
                setupCommands();
                console.log("Gamepad connected at index %d: %s. %d buttons, %d axes.", this.gamepad.index, this.gamepad.id, this.gamepad.buttons.length, this.gamepad.axes.length);
            }
        }
        window.addEventListener("gamepadconnected", onGamepadConnected.bind(this));

        function onGamepadDisconnected(e) {
            if (index === e.gamepad.index) {
                this.gamepad = null;
                console.log("Gamepad disconnected from index %d: %s", index, e.gamepad.id);
            }
        }
        window.addEventListener("gamepaddisconnected", onGamepadDisconnected);

        var commandDowns = [];
        var commandUps = [];
        var buttonPressed = [];

        var setupCommands = function () {
            for (var name in commands) {
                var buttons = commands[name].buttons;
                var axes = commands[name].axes;
                Object.defineProperty(this, name, {
                    enumerable: true,
                    get: getState.bind(this, buttons, axes)
                });
                var commandDown = commands[name].commandDown;
                if (commandDown) {
                    for (i = 0; i < buttons.length; i++) {
                        commandDowns[buttons[i]] = commandDown;
                    }
                }
                var commandUp = commands[name].commandUp;
                if (commandUp) {
                    for (i = 0; i < buttons.length; i++) {
                        commandUps[buttons[i]] = commandUp;
                    }
                }
            }
        }.bind(this);

        var getState = function (buttons, axes) {
            if (!this.gamepad) return 0;
            var i;
            if (buttons) {
                for (i = 0; i < buttons.length; i++) {
                    var button = this.gamepad.buttons[buttons[i]];
                    if (isNaN(button) && button.pressed) return button.value;
                }
                return 0;
            } else if (axes) {
                for (i = 0; i < axes.length; i++) {
                    var value = this.gamepad.axes[axes[i]];
                    if (value && Math.abs(value) > DEADZONE) return value;
                }
                return 0;
            }
            return 0;
        }.bind(this);

        this.update = function () {
            if (!this.gamepad) return;
            for (var i = 0; i < this.gamepad.buttons.length; i++) {
                var button = this.gamepad.buttons[i];
                var pressed = (isNaN(button) ? (button.value === 1) : (button === 1));
                if (pressed && !buttonPressed[i]) {
                    buttonPressed[i] = true;
                    if (commandDowns[i]) commandDowns[i]();
                } else if (!pressed && buttonPressed[i]) {
                    buttonPressed[i] = false;
                    if (commandUps[i]) commandUps[i]();
                }
            }
        }.bind(this);
    }

    Gamepad.AXES = {
        LSX: 0,
        LSY: 1,
        RSX: 2,
        RSY: 3
    };

    Gamepad.BUTTONS = {
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
    };

    return Gamepad;
} )();
