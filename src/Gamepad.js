var YAWVRB = window.YAWVRB || {};

YAWVRB.Gamepad = ( function () {
    "use strict";

    const DEADZONE = 0.12;

    function Gamepad(commands) {

        var gamepad;

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
            var i;
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
                var pressed;
                if (button === 1) {
                    pressed = true;
                } else if (button === 0) {
                    pressed = false;
                } else if (button) {
                    pressed = button.pressed; // || button.value;
                } else {
                    continue;
                }
                if (pressed && !buttonPressed[i]) {
                    if (commandDowns[i]) commandDowns[i]();
                } else if (!pressed && buttonPressed[i]) {
                    if (commandUps[i]) commandUps[i]();
                }
                buttonPressed[i] = pressed;
            }
        };

        var initialGamepad;
        if (navigator.getGamepads) {
            initialGamepad = navigator.getGamepads()[0];
        } else if (navigator.webkitGetGamepads) {
            initialGamepad = navigator.webkitGetGamepads()[0];
        }
        if (initialGamepad && initialGamepad.buttons.length > 0) {
            gamepad = initialGamepad;
        }

        function onGamepadConnected(e) {
            if (e.gamepad.buttons.length > 0) {
                gamepad = e.gamepad;
                console.log("Gamepad connected at index %d: %s. %d buttons, %d axes.", gamepad.index, gamepad.id, gamepad.buttons.length, gamepad.axes.length);
                window.gamepad = gamepad;
            }
        }
        window.addEventListener("gamepadconnected", onGamepadConnected.bind(this));

        function onGamepadDisconnected(e) {
            if (gamepad) {
                gamepad = null;
                console.log("Gamepad disconnected from index %d: %s", e.gamepad.index, e.gamepad.id);
            }
        }
        window.addEventListener("gamepaddisconnected", onGamepadDisconnected);

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

    // for firefox on linux?
    // Gamepad.BUTTONS = {
    //     A: 0,
    //     B: 1,
    //     X: 2,
    //     Y: 3,
    //     leftBumper: 4,
    //     rightBumper: 5,
    //     back: 6,
    //     start: 7,
    //     power: 8,
    //     leftStick: 9,
    //     rightStick: 10
    // };

    return Gamepad;
} )();
