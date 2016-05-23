/* global THREE, YAWVRB */
window.onLoad = function () {
    "use strict";

    // menu setup:
    var overlay = document.getElementById('overlay');
    var infoElement = document.createElement('div');
    infoElement.style['background-color'] = 'rgba(100, 100, 70, 0.7)';
    infoElement.style['margin-top'] = '2vh';
    infoElement.style.padding = '0.5vw';
    overlay.appendChild(infoElement);
    var plaintext = document.createElement('plaintext');
    plaintext.style['font-size'] = '5pt';
    plaintext.innerHTML = 'WebVRConfig = ' + JSON.stringify(window.WebVRConfig, undefined, 2);
    infoElement.appendChild(plaintext);

    THREE.Object3D.DefaultMatrixAutoUpdate = false;

    var objectSelector = new YAWVRB.Utils.ObjectSelector();

    var stage = new YAWVRB.Stage();

    var app = ( function () {
        var euler = new THREE.Euler(0, 0, 0, 'YXZ');
        return new YAWVRB.App(undefined, {
            onResetVRSensor: function (lastRotation, lastPosition) {
                console.log('lastRotation: %f, lastPosition: (%f, %f, %f)', lastRotation, lastPosition.x, lastPosition.y, lastPosition.z);
                // maintain poses of stage objects:
                stage.stageRoot.children.forEach( function (object) {
                    // maintain rotation of object (relative heading of object w.r.t. HMD):
                    if (object === app.camera) return;
                    euler.setFromQuaternion(object.quaternion);
                    euler.y -= lastRotation;
                    object.quaternion.setFromEuler(euler);
                    // maintain position of object w.r.t. HMD:
                    object.position.sub(lastPosition);
                    object.position.applyAxisAngle(THREE.Object3D.DefaultUp, -lastRotation);
                    object.position.add(app.camera.position);
                    object.updateMatrix();
                } );
                stage.updateSittingToStandingTransform();
                stage.stageRoot.updateMatrixWorld(true);
            }
        }, {
            canvas: document.getElementById('webgl-canvas'),
            antialias: !YAWVRB.Utils.isMobile(),
            alpha: true
        });
    } )();

    stage.stageRoot.add(app.camera);
    app.scene.add(stage.stageRoot);

    function toggleHTMLMenu() {
        if (overlay.style.display === 'none') {
            overlay.style.display = 'block';
        } else {
            overlay.style.display = 'none';
        }
    }

    var xboxGamepadCommands = {
        toggleVR: {buttons: [YAWVRB.Gamepads.BUTTONS.start], commandDown: app.toggleVR},
        resetVRSensor: {buttons: [YAWVRB.Gamepads.BUTTONS.back], commandDown: app.resetVRSensor},
        cycleSelection: {buttons: [YAWVRB.Gamepads.BUTTONS.right], commandDown: objectSelector.cycleSelection},
        cyclePrevSelection: {buttons: [YAWVRB.Gamepads.BUTTONS.left], commandDown: objectSelector.cycleSelection.bind(objectSelector, -1)},
        moveFB: {axes: [YAWVRB.Gamepads.AXES.LSY]},
        moveRL: {axes: [YAWVRB.Gamepads.AXES.LSX]},
        turnRL: {axes: [YAWVRB.Gamepads.AXES.RSX]},
        turnUD: {axes: [YAWVRB.Gamepads.AXES.RSY]},
        toggleFloat: {buttons: [YAWVRB.Gamepads.BUTTONS.leftStick]}
    };
    YAWVRB.Gamepads.setOnGamepadConnected( function (e) {
        if (/xbox/i.test(e.gamepad.id) || /xinput/i.test(e.gamepad.id)) {
            YAWVRB.Gamepads.setGamepadCommands(e.gamepad.index, xboxGamepadCommands);
        }
    } );

    var keyboard = new YAWVRB.Keyboard(window, YAWVRB.Utils.combineObjects(YAWVRB.Keyboard.STANDARD_COMMANDS, {
        toggleVR: {buttons: [YAWVRB.Keyboard.KEYCODES.V], commandDown: app.toggleVR},
        resetVRSensor: {buttons: [YAWVRB.Keyboard.KEYCODES.Z], commandDown: app.resetVRSensor},
        cycleSelection: {buttons: [YAWVRB.Keyboard.KEYCODES.CLOSEDBRACKET], commandDown: objectSelector.cycleSelection},
        cyclePrevSelection: {buttons: [YAWVRB.Keyboard.KEYCODES.OPENBRACKET], commandDown: objectSelector.cycleSelection.bind(objectSelector, -1)},
        toggleWireframe: {buttons: [YAWVRB.Keyboard.KEYCODES.NUMBER1], commandDown: function () { app.toggleWireframe(); }},
        toggleNormalMaterial: {buttons: [YAWVRB.Keyboard.KEYCODES.NUMBER2], commandDown: function () { app.toggleNormalMaterial(); }},
        toggleHTMLMenu: {buttons: [YAWVRB.Keyboard.KEYCODES.M], commandDown: toggleHTMLMenu}
    }));
    var keyboardObject = keyboard.stageObject;
    const INCH2METERS = 0.0254;
    keyboardObject.position.z = -12 * INCH2METERS;
    keyboardObject.position.y = -5 * INCH2METERS;
    keyboardObject.updateMatrix();
    ( new YAWVRB.Utils.TextLabel({object: keyboardObject}) ).setText('Keyboard');
    objectSelector.addSelectable(keyboardObject);
    keyboardObject.name = 'keyboard';
    stage.stageRoot.add(keyboardObject);

    stage.load();

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
            while (scene.children.length > 0) {
                var child = scene.children[0];
                scene.remove(child);
                if (child instanceof THREE.Mesh) {
                    if (child.name === 'desk') child.material = deskMaterial;
                    else if (child.name === 'chair') child.material = chairMaterial;
                    else child.material = roomMaterial;
                }
                child.updateMatrix();
                app.scene.add(child);
            }
            app.scene.updateMatrixWorld(true);
            app.renderer.setSize(window.innerWidth, window.innerHeight);
            startAnimateLoop();

            function startAnimateLoop() {
                var lt = 0;

                function animate(t) {
                    var dt = 0.001 * (t - lt);
                    var moveFB = keyboard.moveForward - keyboard.moveBackward,
                        moveRL = keyboard.moveRight - keyboard.moveLeft,
                        moveUD = keyboard.moveUp - keyboard.moveDown,
                        turnRL = keyboard.turnRight - keyboard.turnLeft,
                        turnUD = keyboard.turnUp - keyboard.turnDown;
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
                        if (vals.turnUD) turnUD += vals.turnUD;
                    }
                    YAWVRB.Utils.moveObject(objectSelector.selection, dt, moveFB, moveRL, moveUD, turnRL, turnUD);
                    app.render();
                    lt = t;
                    requestAnimationFrame(animate);
                }

                requestAnimationFrame(animate);
            }

        });

    } )();

};
