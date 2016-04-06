window.YAWVRB = window.YAWVRB || {};

YAWVRB.Gamepad = ( function () {
	"use strict";

	const DEADZONE = 0.12;

	function Gamepad(commands) {

		var gamepad;

    	var commandDowns = [];
		var commandUps = [];
    	var buttonPressed = [];

    	for (name in commands) {
    		var buttons = commands[name].buttons;
    		var axes = commands[name].axes;
            Object.defineProperty(this, name, {
                enumerable: true,
                get: getState.bind(this, buttons, axes)
            });
    		var commandDown = commands[name].commandDown;
    		if (commandDown) {
    			for (var i = 0; i < buttons.length; i++) {
	    			commandDowns[buttons[i]] = commandDown;
	    		}
    		}
    		var commandUp = commands[name].commandUp;
    		if (commandUp) {
    			for (var i = 0; i < buttons.length; i++) {
	    			commandUps[buttons[i]] = commandUps;
	    		}
    		}
    	}

    	function getState(buttons, axes) {
    		var i;
    		if (buttons) {
	    		for (i = 0; i < buttons.length; i++) {
	    			var button = gamepad.buttons[buttons[i]];
	    			if (button.pressed) return button.value;
	    		}
	    	} else if (axes) {
	    		for (i = 0; i < axes.length; i++) {
	    			var value = gamepad.axes[axes[i]];
	    			if (Math.abs(value) > DEADZONE) return value;
	    		}
	    	}
	    	return null;
    	}

		this.update = function () {
			if (!gamepad) return;
			for (var i = 1; i < gamepad.buttons.length; i++) {
				var gpButton = gamepad.buttons[i];
				var pressed = gpButton.pressed;
				if (pressed) {
					console.log('pressed %d', i);
					if (commandDowns[i]) commandDowns[i]();
				} else if (!pressed && buttonPressed[i]) {
					console.log('depressed %d', i);
					if (commandUps[i]) commandUps[i]();
				}
				buttonPressed[i] = pressed;
			}
		};

		var initialGamepad = navigator.getGamepads()[0];
		if (initialGamepad && initialGamepad.buttons.length > 0) {
			gamepad = initialGamepad;
		}

		function onGamepadConnected(e) {
			if (e.gamepad.buttons.length > 0) {
				gamepad = e.gamepad;
				console.log("Gamepad connected at index %d: %s. %d buttons, %d axes.", gamepad.index, gamepad.id, gamepad.buttons.length, gamepad.axes.length);
			}
		}
		window.addEventListener("gamepadconnected", onGamepadConnected);

		function onGamepadDisconnected(e) {
			if (gamepad && e.gamepad.id === gamepad.id) {
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
	    A: 1,
	    B: 2,
	    X: 3,
	    Y: 4,
	    leftBumper: 5,
	    rightBumper: 6,
	    leftTrigger: 7,
	    rightTrigger: 8,
	    back: 9,
	    start: 10,
	    leftStick: 11,
	    rightStick: 12,
	    up: 13,
	    down: 14,
	    left: 15,
	    right: 16
	};

	return Gamepad;
} )();
