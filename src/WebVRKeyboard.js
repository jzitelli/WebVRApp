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

    WebVRKeyboard.KEYCODES = {
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

    WebVRKeyboard.KEYCODES['1'] = WebVRKeyboard.KEYCODES.NUMBER1;
    WebVRKeyboard.KEYCODES['2'] = WebVRKeyboard.KEYCODES.NUMBER2;
    WebVRKeyboard.KEYCODES['3'] = WebVRKeyboard.KEYCODES.NUMBER3;
    WebVRKeyboard.KEYCODES['4'] = WebVRKeyboard.KEYCODES.NUMBER4;
    WebVRKeyboard.KEYCODES['5'] = WebVRKeyboard.KEYCODES.NUMBER5;
    WebVRKeyboard.KEYCODES['6'] = WebVRKeyboard.KEYCODES.NUMBER6;
    WebVRKeyboard.KEYCODES['7'] = WebVRKeyboard.KEYCODES.NUMBER7;
    WebVRKeyboard.KEYCODES['8'] = WebVRKeyboard.KEYCODES.NUMBER8;
    WebVRKeyboard.KEYCODES['9'] = WebVRKeyboard.KEYCODES.NUMBER9;
    WebVRKeyboard.KEYCODES['0'] = WebVRKeyboard.KEYCODES.NUMBER0;
    WebVRKeyboard.KEYCODES['-'] = WebVRKeyboard.KEYCODES.DASH;
    WebVRKeyboard.KEYCODES['='] = WebVRKeyboard.KEYCODES.EQUALSIGN;
    WebVRKeyboard.KEYCODES[';'] = WebVRKeyboard.KEYCODES.SEMICOLON;
    WebVRKeyboard.KEYCODES["'"] = WebVRKeyboard.KEYCODES.SINGLEQUOTE;
    WebVRKeyboard.KEYCODES["\\"] = WebVRKeyboard.KEYCODES.BACKSLASH;
    WebVRKeyboard.KEYCODES["["] = WebVRKeyboard.KEYCODES.OPENBRACKET;
    WebVRKeyboard.KEYCODES["]"] = WebVRKeyboard.KEYCODES.CLOSEBRACKET;
    WebVRKeyboard.KEYCODES["`"] = WebVRKeyboard.KEYCODES.GRAVEACCENT;
    WebVRKeyboard.KEYCODES["/"] = WebVRKeyboard.KEYCODES.FORWARDSLASH;
    WebVRKeyboard.KEYCODES["."] = WebVRKeyboard.KEYCODES.PERIOD;
    WebVRKeyboard.KEYCODES[","] = WebVRKeyboard.KEYCODES.COMMA;

    WebVRKeyboard.CODEKEYS = [];
    for (var k in WebVRKeyboard.KEYCODES) {
        WebVRKeyboard.CODEKEYS[WebVRKeyboard.KEYCODES[k]] = k;
    }

    WebVRKeyboard.STANDARD_COMMANDS = {
        moveForward: {buttons: [WebVRKeyboard.KEYCODES.W]},
        moveBackward: {buttons: [WebVRKeyboard.KEYCODES.S]},
        moveLeft: {buttons: [WebVRKeyboard.KEYCODES.A]},
        moveRight: {buttons: [WebVRKeyboard.KEYCODES.D]},
        moveUp: {buttons: [WebVRKeyboard.KEYCODES.E]},
        moveDown: {buttons: [WebVRKeyboard.KEYCODES.Q]},
        turnLeft: {buttons: [WebVRKeyboard.KEYCODES.LEFTARROW]},
        turnRight: {buttons: [WebVRKeyboard.KEYCODES.RIGHTARROW]},
        turnUp: {buttons: [WebVRKeyboard.KEYCODES.UPARROW]},
        turnDown: {buttons: [WebVRKeyboard.KEYCODES.DOWNARROW]}
    };

    return WebVRKeyboard;
} )();
