/* global THREE */
function onLoad() {
    "use strict";

    const INCH2METERS = 0.0254;
    const UP = THREE.Object3D.DefaultUp;
    const RIGHT = new THREE.Vector3(1, 0, 0);

    THREE.Object3D.DefaultMatrixAutoUpdate = false;

    var app;

    var canvas = document.getElementById('webgl-canvas');

    var avatar = new THREE.Object3D();
    avatar.position.y = 1.2;
    avatar.position.z = -0.28
    avatar.updateMatrix();

    var objectSelector = new YAWVRB.AppUtils.ObjectSelector();

    var mouse = new YAWVRB.Mouse({eventTarget: window});
    avatar.add(mouse.pointerMesh);
    mouse.pointerMesh.position.z = -0.4;
    mouse.pointerMesh.updateMatrix();

    var gamepadCommands = {
        resetVRSensor: {buttons: [YAWVRB.Gamepad.BUTTONS.back], commandDown: function () { app.resetVRSensor(); }},
        cycleSelection: {buttons: [YAWVRB.Gamepad.BUTTONS.right], commandDown: objectSelector.cycleSelection},
        moveFB: {axes: [YAWVRB.Gamepad.AXES.LSY]},
        moveRL: {axes: [YAWVRB.Gamepad.AXES.LSX]},
        turnRL: {axes: [YAWVRB.Gamepad.AXES.RSX]},
        turnUD: {axes: [YAWVRB.Gamepad.AXES.RSY]},
        toggleFloat: {buttons: [YAWVRB.Gamepad.BUTTONS.leftStick]},
        toggleVR: {buttons: [YAWVRB.Gamepad.BUTTONS.start], commandDown: function () { app.toggleVR(); }}
    };

    // YAWVRB.Gamepad.logConnectedGamepads();
    // var gamepad = new YAWVRB.Gamepad(gamepadCommands);
    // window.gamepad = gamepad;

    var keyboardCommands = {
        toggleVR: {buttons: [YAWVRB.Keyboard.KEYCODES.V], commandDown: function () { app.toggleVR(); }},
        resetVRSensor: {buttons: [YAWVRB.Keyboard.KEYCODES.Z], commandDown: function () { app.resetVRSensor(); }},
        cycleSelection: {buttons: [YAWVRB.Keyboard.KEYCODES.OPENBRACKET], commandDown: objectSelector.cycleSelection},
        toggleWireframe: {buttons: [YAWVRB.Keyboard.KEYCODES.NUMBER1], commandDown: function () { app.toggleWireframe(); }},
        toggleNormalMaterial: {buttons: [YAWVRB.Keyboard.KEYCODES.NUMBER2], commandDown: function () { app.toggleNormalMaterial(); }}
    };
    for (var k in YAWVRB.Keyboard.STANDARD_COMMANDS) {
        keyboardCommands[k] = YAWVRB.Keyboard.STANDARD_COMMANDS[k];
    }

    var keyboard = new YAWVRB.Keyboard(window, keyboardCommands);
    var keyboardObject = keyboard.object;
    keyboardObject.position.z = -12 * INCH2METERS;
    keyboardObject.position.y = -5 * INCH2METERS;
    keyboardObject.updateMatrix();
    avatar.add(keyboardObject);

    var world = new CANNON.World();

    // local leap motion controller:
    var leapTool;
    leapTool = YAWVRB.LeapMotion.makeTool({toolColor: 0xbb9999, handColor: 0x99bbbb});
    avatar.add(leapTool.toolRoot);
    world.add(leapTool.toolBody);
    leapTool.leapController.connect();

    // remote leap motion controller:
    var leapToolRemote;
    if (URL_PARAMS.remoteLeapHost) {
        leapToolRemote = YAWVRB.LeapMotion.makeTool({toolColor: 0x99bb99, handColor: 0xbb99bb, host: URL_PARAMS.remoteLeapHost});
        leapToolRemote.toolRoot.position.x -= 16 * INCH2METERS;
        leapToolRemote.toolRoot.updateMatrix();
        avatar.add(leapToolRemote.toolRoot);
        world.add(leapToolRemote.toolBody);
        leapToolRemote.leapController.connect();
    }

    var gfxTablet = new YAWVRB.GfxTablet(2560, 1600);
    avatar.add(gfxTablet.mesh);
    gfxTablet.mesh.position.set(-0.32, -0.3, -0.05);
    gfxTablet.mesh.quaternion.setFromAxisAngle(UP, 0.5 * Math.PI).multiply((new THREE.Quaternion()).setFromAxisAngle(RIGHT, -0.125 * Math.PI));
    gfxTablet.mesh.updateMatrix();

    YAWVRB.AppUtils.displayText('GfxTablet', {object: gfxTablet.mesh, position: [0, 0.5, 0.05]});
    YAWVRB.AppUtils.displayText('Keyboard', {object: keyboardObject});
    if (leapTool) YAWVRB.AppUtils.displayText('Leap Motion (local)', {object: leapTool.toolRoot});
    if (leapToolRemote) YAWVRB.AppUtils.displayText('Leap Motion (remote)', {object: leapToolRemote.toolRoot});

    objectSelector.addSelectable(avatar);
    objectSelector.addSelectable(keyboardObject);
    if (leapTool) objectSelector.addSelectable(leapTool.toolRoot);
    if (leapToolRemote) objectSelector.addSelectable(leapToolRemote.toolRoot);
    objectSelector.addSelectable(gfxTablet.mesh);

    var gamepads = navigator.getGamepads();
    for (var i = 0; i < gamepads.length; i++) {
        if (gamepads[i]) console.log('gamepad %d: %s', i, gamepads[i].id);
    }
    var vrGamepads = [];
    var xboxGamepads = [];
    var buttonsPresseds = [];
    for (i = 0; i < gamepads.length; ++i) {
        var gamepad = gamepads[i];
        if (gamepad && (/xbox/i.test(gamepad.id) || /xinput/i.test(gamepad.id))) {
            xboxGamepads.push(gamepad);
        } else if (gamepad && gamepad.pose) {
            vrGamepads.push(gamepad);
        }
    }
    for (i = 0; i < xboxGamepads.length; i++) {
        buttonsPresseds.push([false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false]);
    }

    function pollGamepads() {
        var newGamepads = navigator.getGamepads();
        if (newGamepads.length === gamepads.length) return;
        gamepads = newGamepads;
        vrGamepads = [];
        xboxGamepads = [];
        for (var i = 0; i < gamepads.length; ++i) {
            var gamepad = gamepads[i];
            if (gamepad && (/xbox/i.test(gamepad.id) || /xinput/i.test(gamepad.id))) {
                xboxGamepads.push(gamepad);
            } else if (gamepad && gamepad.pose) {
                vrGamepads.push(gamepad);
            }
        }
        for (i = 0; i < xboxGamepads.length; i++) {
            if (!buttonsPresseds[i]) buttonsPresseds.push([false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false]);
        }
    }

    var tGamepad = 0;
    const GETGAMEPADS_POLLTIME = 0.021;
    var lastVibration = 0;

    function moveByKeyboard(dt, t) {
        var moveFB = keyboard.moveForward - keyboard.moveBackward,
            moveRL = keyboard.moveRight - keyboard.moveLeft,
            moveUD = keyboard.moveUp - keyboard.moveDown,
            turnRL = keyboard.turnRight - keyboard.turnLeft,
            turnUD = keyboard.turnUp - keyboard.turnDown;

        tGamepad += dt;
        if (tGamepad > GETGAMEPADS_POLLTIME) {
            tGamepad = 0;
            pollGamepads();
        }

        for (var i = 0; i < vrGamepads.length; ++i) {
            var gamepad = vrGamepads[i];
            if ("vibrate" in gamepad) {
                for (var j = 0; j < gamepad.buttons.length; ++j) {
                    if (gamepad.buttons[j].pressed) {
                        //gamepad.vibrate(1000);
                        var vibrationDelay = (10 * (1.0 - gamepad.buttons[j].value)) + 50;
                        if (t - lastVibration > vibrationDelay) {
                            gamepad.vibrate(333);
                            lastVibration = t;
                        }
                        break;
                    }
                }
            }
        }

        for (i = 0; i < xboxGamepads.length; ++i) {
            gamepad = xboxGamepads[i];
            var buttonsPressed = buttonsPresseds[i];
            for (j = 0; j < gamepad.buttons.length; ++j) {
                if (gamepad.buttons[j].pressed) {
                    if (!buttonsPressed[j]) {
                        buttonsPressed[j] = true;
                        console.log('pressed %d', j);
                    }
                } else {
                    if (buttonsPressed[j]) {
                        buttonsPressed[j] = false;
                    }
                }
            }
        }

        // if (gamepad.gamepad && gamepad.gamepad.connected) {
        //     if (gamepad.toggleFloat) {
        //         moveUD -= gamepad.moveFB;
        //     } else {
        //         moveFB -= gamepad.moveFB;
        //         turnRL += gamepad.turnRL;
        //         turnUD += gamepad.turnUD;
        //     }
        //     moveRL += gamepad.moveRL;
        // }
        if (objectSelector.selection === avatar) turnUD = 0;
        objectSelector.moveSelection(dt, moveFB, moveRL, moveUD, turnRL, turnUD);
    }

    ( function () {

        // load the WebVRDesk scene and start

        var objectLoader = new THREE.ObjectLoader();
        var textureLoader = new THREE.TextureLoader();

        var deskTexture = textureLoader.load('/test/models/textures/deskTexture.png');
        var deskMaterial = new THREE.MeshBasicMaterial({map: deskTexture});
        var roomTexture = textureLoader.load('/test/models/textures/roomTexture.png');
        var roomMaterial = new THREE.MeshBasicMaterial({map: roomTexture});
        var chairTexture = textureLoader.load('/test/models/textures/chairTexture.png');
        var chairMaterial = new THREE.MeshBasicMaterial({map: chairTexture});

        objectLoader.load("/test/models/WebVRDesk.json", function (scene) {
            for (var i = 0; i < scene.children.length; i++) {
                var child = scene.children[i];
                child.updateMatrix();
                if (child instanceof THREE.Mesh) {
                    if (child.name === 'desk') child.material = deskMaterial;
                    else if (child.name === 'chair') child.material = chairMaterial;
                    else child.material = roomMaterial;
                }
            }

            app = new YAWVRB.App(scene, undefined, {canvas: canvas, alpha: true});

            app.renderer.setSize(window.innerWidth, window.innerHeight);
            scene.add(avatar);
            avatar.add(app.camera);
            if (leapTool && leapTool.toolShadowMesh)             scene.add(leapTool.toolShadowMesh);
            if (leapToolRemote && leapToolRemote.toolShadowMesh) scene.add(leapToolRemote.toolShadowMesh);
            scene.updateMatrixWorld(true);
            if (leapTool)       leapTool.updateToolMapping();
            if (leapToolRemote) leapToolRemote.updateToolMapping();

            requestAnimationFrame(animate);

            var lt = 0;
            function animate(t) {
                var dt = 0.001 * (t - lt);

                moveByKeyboard(dt, t);

                if (leapTool)       leapTool.updateToolMapping();
                if (leapToolRemote) leapToolRemote.updateToolMapping();

                if (leapTool)       leapTool.updateTool(dt);
                if (leapToolRemote) leapToolRemote.updateTool(dt);

                app.render();

                world.step(Math.min(dt, 1/60), dt, 10);

                if (leapTool)       leapTool.updateToolPostStep();
                if (leapToolRemote) leapToolRemote.updateToolPostStep();

                lt = t;
                requestAnimationFrame(animate);
            }

        });

    } )();;

      // function getPoseMatrix (out, pose) {
      //   orientation = pose.orientation;
      //   position = pose.position;
      //   if (!orientation) { orientation = [0, 0, 0, 1]; }
      //   if (!position) { position = [0, 0, 0]; }

      //   if (vrDisplay.stageParameters) {
      //     mat4.fromRotationTranslation(out, orientation, position);
      //     mat4.multiply(out, vrDisplay.stageParameters.sittingToStandingTransform, out);
      //   } else {
      //     vec3.add(standingPosition, position, [0, PLAYER_HEIGHT, 0]);
      //     mat4.fromRotationTranslation(out, orientation, standingPosition);
      //   }
      // }

      // function renderSceneView (poseInMat, gamepads, eye) {
      //   if (eye) {
      //     mat4.translate(viewMat, poseInMat, eye.offset);
      //     mat4.perspectiveFromFieldOfView(projectionMat, eye.fieldOfView, 0.1, 1024.0);
      //     mat4.invert(viewMat, viewMat);
      //   } else {
      //     mat4.perspective(projectionMat, Math.PI*0.4, webglCanvas.width / webglCanvas.height, 0.1, 1024.0);
      //     mat4.invert(viewMat, poseInMat);
      //   }

      //   debugGeom.bind(projectionMat, viewMat);

      //   // Render every gamepad with a pose we found
      //   for (var i = 0; i < gamepads.length; ++i) {
      //     var gamepad = gamepads[i];
      //     // Because this sample is done in standing space we need to apply
      //     // the same transformation to the gamepad pose as we did the
      //     // VRDisplay's pose.
      //     getPoseMatrix(gamepadMat, gamepad.pose);
      //     // Scaled down to from 1 meter to be something closer to the size of
      //     // a hand.
      //     mat4.scale(gamepadMat, gamepadMat, [0.1, 0.1, 0.1]);
      //     // Loop through all the gamepad's axes and rotate the cube by their
      //     // value.
      //     for (var j = 0; j < gamepad.axes.length; ++j) {
      //       switch (j%3) {
      //         case 0:
      //           mat4.rotateX(gamepadMat, gamepadMat, gamepad.axes[j] * Math.PI);
      //           break;
      //         case 1:
      //           mat4.rotateY(gamepadMat, gamepadMat, gamepad.axes[j] * Math.PI);
      //           break;
      //         case 2:
      //           mat4.rotateZ(gamepadMat, gamepadMat, gamepad.axes[j] * Math.PI);
      //           break;
      //       }
      //     }
      //     // Show the gamepad's cube as red if any buttons are pressed, blue
      //     // otherwise.
      //     vec4.set(gamepadColor, 0, 0, 1, 1);
      //     for (var j = 0; j < gamepad.buttons.length; ++j) {
      //       if (gamepad.buttons[j].pressed) {
      //         vec4.set(gamepadColor, gamepad.buttons[j].value, 0, 0, 1);
      //         break;
      //       }
      //     }
      //     debugGeom.drawBoxWithMatrix(gamepadMat, gamepadColor);
      //   }
      // }

}
