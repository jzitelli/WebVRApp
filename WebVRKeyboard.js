var WebVRKeyboard = ( function () {
    "use strict";

    function WebVRKeyboard(eventTarget, commands) {

    	eventTarget.addEventListener("keydown", onKeyDown, false);
    	eventTarget.addEventListener("keyup", onKeyUp, false);

    	var keyDown = [];
    	var commandDowns = [];

    	function onKeyDown(evt) {
    		keyDown[evt.keyCode] = true;
    		if (commandDowns[evt.keyCode]) commandDowns[evt.keyCode]();
    	}

    	function onKeyUp(evt) {
    		keyDown[evt.keyCode] = false;
    	}

    	function getState(buttons) {
    		for (var i = 0; i < buttons.length; i++) {
    			if (keyDown[buttons[i]]) return 1;
    		}
    		return 0;
    	}

    	for (name in commands) {
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

    }

    return WebVRKeyboard;
} )();
