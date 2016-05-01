var YAWVRB = window.YAWVRB || {};

YAWVRB.Gamepad = ( function () {
    "use strict";

    const DEADZONE = 0.12;

    var gamepads;
    var nextIndex = 0;
    if (navigator.getGamepads) {
        gamepads = navigator.getGamepads();
    } else if (navigator.webkitGetGamepads) {
        gamepads = navigator.webkitGetGamepads();
    }

    function Gamepad(commands) {
        var gamepad;
        var index = nextIndex;
        if (gamepads) {
            for (var i = index; i < gamepads.length; i++) {
                if (gamepads[i]) {
                    gamepad = gamepads[i];
                    index = i;
                    nextIndex = i + 1;
                    console.log("Using gamepad at index %d: %s. %d buttons, %d axes.", gamepad.index, gamepad.id, gamepad.buttons.length, gamepad.axes.length);
                    break;
                }
            }
        }
        function onGamepadConnected(e) {
            if (e.gamepad.index === index) {
                gamepad = e.gamepad;
                gamepads[index] = gamepad;
                console.log("Gamepad connected at index %d: %s. %d buttons, %d axes.", gamepad.index, gamepad.id, gamepad.buttons.length, gamepad.axes.length);
            }
        }
        window.addEventListener("gamepadconnected", onGamepadConnected);
        function onGamepadDisconnected(e) {
            if (index === e.gamepad.index) {
                console.log("Gamepad disconnected from index %d: %s", index, e.gamepad.id);
                gamepad = null;
                if (gamepads[index]) {
                    gamepads[index] = null;
                }
            }
        }
        window.addEventListener("gamepaddisconnected", onGamepadDisconnected);

        this.isConnected = function () {
            return (gamepad && gamepad.connected);
        };

        var commandDowns = [];
        var commandUps = [];
        var buttonPressed = [];
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

        function getState(buttons, axes) {
            if (!gamepad) return 0;
            var i;
            if (buttons) {
                for (i = 0; i < buttons.length; i++) {
                    var button = gamepad.buttons[buttons[i]];
                    if (isNaN(button) && button.pressed) return button.value;
                }
                return 0;
            } else if (axes) {
                for (i = 0; i < axes.length; i++) {
                    var value = gamepad.axes[axes[i]];
                    if (value && Math.abs(value) > DEADZONE) return value;
                }
                return 0;
            }
            return 0;
        }

        this.update = function () {
            if (!gamepad) return;
            for (var i = 0; i < gamepad.buttons.length; i++) {
                var button = gamepad.buttons[i];
                var pressed = (isNaN(button) ? (button.value === 1) : (button === 1));
                if (pressed && !buttonPressed[i]) {
                    buttonPressed[i] = true;
                    if (commandDowns[i]) commandDowns[i]();
                } else if (!pressed && buttonPressed[i]) {
                    buttonPressed[i] = false;
                    if (commandUps[i]) commandUps[i]();
                }
            }
        };
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
