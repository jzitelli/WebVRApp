module.exports = ( function () {
    "use strict";

    const DEADZONE = 0.145;

    var gamepads;

    function refreshGamepads() {
        if (navigator.webkitGetGamepads) {
            gamepads = navigator.webkitGetGamepads();
        } else if (navigator.getGamepads) {
            gamepads = navigator.getGamepads();
        }
    }
    refreshGamepads();

    function Gamepad(commands) {

        this.gamepad = null;

        var commandDowns = [];
        var commandUps = [];
        var buttonPressed = [];

        var i = 0;
        if (gamepads) {
            for (i = 0; i < gamepads.length; i++) {
                if (gamepads[i]) {
                    if (/STANDARD GAMEPAD/.test(gamepads[i].id) || /xinput/.test(gamepads[i].id)) {
                        this.gamepad = gamepads[i];
                        setupCommands.call(this);
                        console.log("Using gamepad at index %d: %s. %d buttons, %d axes.", this.gamepad.index, this.gamepad.id, this.gamepad.buttons.length, this.gamepad.axes.length);
                        break;
                    }
                }
            }
        }

        function setupCommands() {
            for (var name in commands) {
                var buttons = commands[name].buttons;
                var axes = commands[name].axes;

                if (buttons || axes) {

                    Object.defineProperty(this, name, {
                        enumerable: true,
                        get: getState.bind(this, buttons, axes)
                    });

                    if (buttons) {
                        var commandDown = commands[name].commandDown;
                        if (commandDown) {
                            for (var i = 0; i < buttons.length; i++) {
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

                }

            }
        }

        function getState(buttons, axes) {
            var gamepad = this.gamepad;
            if (!gamepad || !gamepad.connected) return 0;
            var i;
            if (buttons) {
                for (i = 0; i < buttons.length; i++) {
                    if (buttonPressed[buttons[i]]) return 1;
                }
                return 0;
            } else if (axes) {
                for (i = 0; i < axes.length; i++) {
                    var value = gamepad.axes[axes[i]];
                    if (value && Math.abs(value) > DEADZONE) return value;
                }
                return 0;
            } else {
                return 0;
            }
        }

        function onGamepadConnected(e) {
            console.log("Gamepad connected at index %d: %s", e.gamepad.index, e.gamepad.id);
            refreshGamepads();
            if (/STANDARD GAMEPAD/.test(e.gamepad.id) || /xinput/.test(e.gamepad.id)) {
                this.gamepad = gamepads[e.gamepad.index];
                setupCommands.call(this);
                console.log("Using gamepad at index %d: %s. %d buttons, %d axes.", this.gamepad.index, this.gamepad.id, this.gamepad.buttons.length, this.gamepad.axes.length);
            }
        }
        window.addEventListener("gamepadconnected", onGamepadConnected.bind(this));

        function onGamepadDisconnected(e) {
            console.log("Gamepad disconnected from index %d: %s", e.gamepad.index, e.gamepad.id);
        }
        window.addEventListener("gamepaddisconnected", onGamepadDisconnected.bind(this));

        this.update = function () {
            var gamepad = this.gamepad;
            if (!gamepad || !gamepad.connected || !gamepad.buttons) {
                return;
            }
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

    Gamepad.logConnectedGamepads = function () {
        for (var i = 0; i < gamepads.length; i++) {
            var gamepad = gamepads[i];
            if (gamepad && gamepad.connected) {
                console.log("gamepad %d: %d %s", i, gamepad.index, gamepad.id);
            }
        }
    };

    return Gamepad;
} )();
