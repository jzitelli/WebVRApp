/* global THREE, YAWVRB */
window.onLoad = function () {
    "use strict";

    THREE.Object3D.DefaultMatrixAutoUpdate = false;

    var objectSelector = new YAWVRB.Utils.ObjectSelector();

    var stage = new YAWVRB.Stage();

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

    overlay.style.display = 'none';

    // create app:

    var app = ( function () {
        var euler = new THREE.Euler(0, 0, 0, 'YXZ');
        return new YAWVRB.App(undefined, {
            onResetVRSensor: function (lastRotation, lastPosition) {
                console.log('lastRotation: %f, lastPosition: (%f, %f, %f)', lastRotation, lastPosition.x, lastPosition.y, lastPosition.z);
                // maintain poses of stage objects:
                stage.rootObject.children.forEach( function (object) {
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
                stage.rootObject.updateMatrixWorld(true);
            }
        }, {
            canvas: document.getElementById('webgl-canvas'),
            antialias: !YAWVRB.Utils.isMobile(),
            alpha: true
        });
    } )();

    stage.rootObject.add(app.camera);

    app.scene.add(stage.rootObject);

    // xbox gamepad:

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

    // vive controller 1:

    var viveAGamepadCommands = {
        toggleVR: {buttons: [3], commandDown: app.toggleVR},
        moveFB: {axes: [YAWVRB.Gamepads.AXES.LSY], flipAxes: true},
        moveRL: {axes: [YAWVRB.Gamepads.AXES.LSX]}
    };
    var viveATool = YAWVRB.Gamepads.makeTool();
    viveATool.mesh.visible = false;
    var viveAConnected = false;
    stage.rootObject.add(viveATool.mesh);

    // vive controller 2:

    var viveBGamepadCommands = {
        turnRL: {axes: [YAWVRB.Gamepads.AXES.LSX]}
    };
    var viveBTool = YAWVRB.Gamepads.makeTool();
    viveBTool.mesh.visible = false;
    stage.rootObject.add(viveBTool.mesh);

    YAWVRB.Gamepads.setOnGamepadConnected( function (e) {
        if (/xbox/i.test(e.gamepad.id) || /xinput/i.test(e.gamepad.id)) {
            YAWVRB.Gamepads.setGamepadCommands(e.gamepad.index, xboxGamepadCommands);
        } else if (/openvr/i.test(e.gamepad.id)) {
            if (!viveAConnected) {
                YAWVRB.Gamepads.setGamepadCommands(e.gamepad.index, viveAGamepadCommands);
                viveATool.setGamepad(e.gamepad);
                viveATool.mesh.visible = true;
                viveAConnected = true;
            } else {
                YAWVRB.Gamepads.setGamepadCommands(e.gamepad.index, viveBGamepadCommands);
                viveBTool.setGamepad(e.gamepad);
                viveBTool.mesh.visible = true;
            }
        }
    } );

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
                    var moveFB = 0,
                        moveRL = 0,
                        moveUD = 0,
                        turnRL = 0,
                        turnUD = 0;
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

                    viveATool.update(dt);
                    viveBTool.update(dt);

                    app.render();

                    lt = t;
                    requestAnimationFrame(animate);
                }

                requestAnimationFrame(animate);
            }

        });

    } )();

};
