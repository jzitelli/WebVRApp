/* global THREE, YAWVRB */
window.onLoad = function () {
    "use strict";

    THREE.Object3D.DefaultMatrixAutoUpdate = false;

    // create app:

    var app = new YAWVRB.App(undefined, undefined, {
        canvas: document.getElementById('webgl-canvas'),
        antialias: !YAWVRB.Utils.isMobile(),
        alpha: true
    });

    app.stage.add(app.camera);

    // keyboard:

    var keyboardCommands = {
        moveF: {buttons: [YAWVRB.Keyboard.KEYCODES.W]},
        moveB: {buttons: [YAWVRB.Keyboard.KEYCODES.S]},
        moveL: {buttons: [YAWVRB.Keyboard.KEYCODES.A]},
        moveR: {buttons: [YAWVRB.Keyboard.KEYCODES.D]},
        moveU: {buttons: [YAWVRB.Keyboard.KEYCODES.Q]},
        moveD: {buttons: [YAWVRB.Keyboard.KEYCODES.Z]},
        turnL: {buttons: [YAWVRB.Keyboard.KEYCODES.LEFTARROW]},
        turnR: {buttons: [YAWVRB.Keyboard.KEYCODES.RIGHTARROW]},
        turnU: {buttons: [YAWVRB.Keyboard.KEYCODES.UPARROW]},
        turnD: {buttons: [YAWVRB.Keyboard.KEYCODES.DOWNARROW]}
    };
    var keyboard = new YAWVRB.Keyboard(window, keyboardCommands);

    // xbox gamepad:

    var xboxGamepadCommands = {
        toggleVR: {buttons: [YAWVRB.Gamepads.BUTTONS.start], commandDown: app.toggleVR},
        resetVRSensor: {buttons: [YAWVRB.Gamepads.BUTTONS.back], commandDown: app.resetVRSensor},
        moveFB: {axes: [YAWVRB.Gamepads.AXES.LSY]},
        moveRL: {axes: [YAWVRB.Gamepads.AXES.LSX]},
        turnRL: {axes: [YAWVRB.Gamepads.AXES.RSX]},
        turnUD: {axes: [YAWVRB.Gamepads.AXES.RSY]},
        toggleFloat: {buttons: [YAWVRB.Gamepads.BUTTONS.leftStick]}
    };

    // leap motion controller:

    var leapTool = YAWVRB.LeapMotion.makeTool();
    leapTool.leapController.connect();
    app.stage.add(leapTool.toolRoot);
    app.scene.add(leapTool.toolShadowMesh);

    startAnimateLoop();

    function startAnimateLoop() {
        var lt = 0;

        requestAnimationFrame(animate);

        function animate(t) {

            var dt = 0.001 * (t - lt);

            var moveFB = keyboard.moveF - keyboard.moveB,
                moveRL = keyboard.moveR - keyboard.moveL,
                moveUD = keyboard.moveU - keyboard.moveD,
                turnRL = keyboard.turnR - keyboard.turnL;

            var values = YAWVRB.Gamepads.update();

            for (var i = 0; i < values.length; i++) {
                var vals = values[i];
                if (vals.moveFB) {
                    if (vals.toggleFloat) {
                        moveUD -= vals.moveFB;
                    } else {
                        moveFB -= vals.moveFB;
                    }
                }
                if (vals.moveRL) moveRL += vals.moveRL;
                if (vals.turnRL) turnRL += vals.turnRL;
            }

            YAWVRB.Utils.moveObject(app.stage, dt, moveFB, moveRL, moveUD, turnRL, 0);

            leapTool.updateTool(dt);

            app.render();

            lt = t;
            requestAnimationFrame(animate);
        }

    }

};
