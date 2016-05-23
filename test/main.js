/* global THREE, YAWVRB, CANNON */
window.onLoad = function () {
    "use strict";

    console.log('navigator.userAgent: %s', navigator.userAgent);

    const INCH2METERS = 0.0254;
    const UP = THREE.Object3D.DefaultUp;
    const RIGHT = new THREE.Vector3(1, 0, 0);

    THREE.Object3D.DefaultMatrixAutoUpdate = false;

    var world = new CANNON.World();
    world.gravity.set(0, -9.8, 0);

    var objectSelector = new YAWVRB.Utils.ObjectSelector();

    var stage = new YAWVRB.Stage();

    function saveStage() {
        var transforms = stage.save();
        textGeomLogger.log(JSON.stringify(transforms, undefined, 2));
    }

    var avatar = stage.stageRoot;

    var textGeomLogger;
    ( function () {
        var fontLoader = new THREE.FontLoader();
        fontLoader.load('/node_modules/three.js/examples/fonts/droid/droid_sans_mono_regular.typeface.json', function (font) {
            textGeomLogger = new YAWVRB.TextGeomUtils.TextGeomLogger(new YAWVRB.TextGeomUtils.TextGeomCacher(font, {size: 0.015, height: 0, curveSegments: 4}), {
                lineHeight: 0.03
            });
            textGeomLogger.root.position.set(-1.25/2, 0, -0.5);
            textGeomLogger.root.updateMatrix();
            avatar.add(textGeomLogger.root);
            textGeomLogger.log('textGeomLogger: hello world');
            avatar.updateMatrixWorld(true);
            setTimeout( function () {
                textGeomLogger.log('another line');
            }, 3000);
            setTimeout( function () {
                textGeomLogger.log('and another line');
            }, 7000);
        });
    } )();

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

    avatar.add(app.camera);
    app.scene.add(stage.stageRoot);

    window.app = app;

    function toggleVRMenu() {
        textGeomLogger.log('vr menu enabled');
    }

    var overlay = document.getElementById('overlay');

    function toggleHTMLMenu() {
        if (overlay.style.display === 'none') {
            overlay.style.display = 'block';
        } else {
            overlay.style.display = 'none';
        }
    }

    var xboxGamepadCommands = {
        toggleVR: {buttons: [YAWVRB.Gamepads.BUTTONS.start], commandDown: function () { console.log('entering VR'); app.toggleVR(); }},
        resetVRSensor: {buttons: [YAWVRB.Gamepads.BUTTONS.back], commandDown: function () { app.resetVRSensor(); }},
        cycleSelection: {buttons: [YAWVRB.Gamepads.BUTTONS.right], commandDown: objectSelector.cycleSelection},
        cyclePrevSelection: {buttons: [YAWVRB.Gamepads.BUTTONS.left], commandDown: objectSelector.cycleSelection.bind(objectSelector, -1)},
        moveFB: {axes: [YAWVRB.Gamepads.AXES.LSY]},
        moveRL: {axes: [YAWVRB.Gamepads.AXES.LSX]},
        turnRL: {axes: [YAWVRB.Gamepads.AXES.RSX]},
        turnUD: {axes: [YAWVRB.Gamepads.AXES.RSY]},
        toggleFloat: {buttons: [YAWVRB.Gamepads.BUTTONS.leftStick]}
    };

    function padButtonDown(button, axes) {
        console.log('button %d: %f, %f', button, axes[0], axes[1]);
        console.log(axes[0]*axes[0] + axes[1]*axes[1]);
        console.log(Math.atan2(axes[0], axes[1]) * 180 / Math.PI);
    }

    var viveACommands = {
        toggleVR: {buttons: [3], commandDown: function () { console.log('entering VR'); app.toggleVR(); }},
        toggleFloat: {buttons: [0]},
        logButton: {buttons: [0,1,2,3], commandDown: function (j) { console.log('pressed %d', j); }},
        moveFB: {axes: [YAWVRB.Gamepads.AXES.LSY], flipAxes: true},
        moveRL: {axes: [YAWVRB.Gamepads.AXES.LSX]}
    };

    var grabbed;
    var parent;
    function grab() {
        console.log('grabbing!');
        var toolMesh = openVRTools[1].mesh;
        parent = grabbed.parent;
        var scale = new THREE.Vector3();
        grabbed.matrixWorld.decompose(grabbed.position, grabbed.quaternion, scale);
        parent.remove(grabbed);
        toolMesh.worldToLocal(grabbed.position);
        toolMesh.add(grabbed);
        grabbed.updateMatrix();
    }
    function release() {
        console.log('releasing!');
        var toolMesh = openVRTools[1].mesh;
        toolMesh.remove(grabbed);
        toolMesh.localToWorld(grabbed.position);
        parent.worldToLocal(grabbed.position);
        parent.add(grabbed);
        grabbed.updateMatrix();
    }

    var viveBCommands = {
        toggleVRMenu: {buttons: [3], commandDown: toggleVRMenu},
        padButton: {buttons: [0], commandDown: padButtonDown},
        grab: {buttons: [1], commandDown: grab, commandUp: release},
        turnRL: {axes: [YAWVRB.Gamepads.AXES.LSX]}
    };

    var openVRTools = [];
    var textLabel;
    for (var i = 0; i < YAWVRB.Gamepads.vrGamepads.length; i++) {
        var vrGamepad = YAWVRB.Gamepads.vrGamepads[i];
        var openVRTool = YAWVRB.Gamepads.makeTool(vrGamepad);
        stage.stageRoot.add(openVRTool.mesh);
        world.add(openVRTool.body);
        openVRTools.push(openVRTool);
        if (i === 0) {
            YAWVRB.Gamepads.setGamepadCommands(vrGamepad.index, viveACommands);
            textLabel = new YAWVRB.Utils.TextLabel({object: openVRTool.mesh});
            textLabel.setText('OpenVR Gamepad A');
        } else if (i === 1) {
            YAWVRB.Gamepads.setGamepadCommands(vrGamepad.index, viveBCommands);
        }
    }

    YAWVRB.Gamepads.setOnGamepadConnected( function (e) {
        if (/openvr/i.test(e.gamepad.id)) {
            if (e.index === 0) {
                console.log('setting gamepad commands for Vive controller A...');
                YAWVRB.Gamepads.setGamepadCommands(e.gamepad.index, viveACommands);
            } else if (e.index === 1) {
                console.log('setting gamepad commands for Vive controller B...');
                YAWVRB.Gamepads.setGamepadCommands(e.gamepad.index, viveBCommands);
            }
        } else if (/xbox/i.test(e.gamepad.id) || /xinput/i.test(e.gamepad.id)) {
            YAWVRB.Gamepads.setGamepadCommands(e.gamepad.index, xboxGamepadCommands);
        }
    } );

    var floorBody = new CANNON.Body({mass: 0, type: CANNON.Body.STATIC});
    floorBody.material = new CANNON.Material();
    var quaternion = new CANNON.Quaternion();
    quaternion.setFromEuler(-Math.PI / 2, 0, 0, 'XYZ');
    floorBody.addShape(new CANNON.Plane(), undefined, quaternion);
    world.add(floorBody);

    var ballBody = new CANNON.Body({mass: 0.1, angularDamping: 0.2, linearDamping: 0.2});
    var ballRadius = 0.25;
    ballBody.material = new CANNON.Material();
    ballBody.addShape(new CANNON.Sphere(ballRadius));
    ballBody.position.set(-1, 3, 0.25);
    world.add(ballBody);
    var ballMesh = new THREE.Mesh(new THREE.SphereBufferGeometry(ballRadius, 16, 12), new THREE.MeshLambertMaterial({color: 0xff0000}));
    ballMesh.position.copy(ballBody.position);
    app.scene.add(ballMesh);

    // menu setup:
    var infoElement = document.createElement('div');
    infoElement.style['background-color'] = 'rgba(100, 100, 70, 0.7)';
    infoElement.style['margin-top'] = '2vh';
    infoElement.style.padding = '0.5vw';
    overlay.appendChild(infoElement);

    var plaintext = document.createElement('plaintext');
    plaintext.style['font-size'] = '5pt';
    plaintext.innerHTML = 'WebVRConfig = ' + JSON.stringify(window.WebVRConfig, undefined, 2);
    infoElement.appendChild(plaintext);

    var keyboardCommands = {
        toggleVR: {buttons: [YAWVRB.Keyboard.KEYCODES.V], commandDown: function () { app.toggleVR(); }},
        resetVRSensor: {buttons: [YAWVRB.Keyboard.KEYCODES.Z], commandDown: function () { app.resetVRSensor(); }},
        cycleSelection: {buttons: [YAWVRB.Keyboard.KEYCODES.CLOSEDBRACKET], commandDown: objectSelector.cycleSelection},
        cyclePrevSelection: {buttons: [YAWVRB.Keyboard.KEYCODES.OPENBRACKET], commandDown: objectSelector.cycleSelection.bind(objectSelector, -1)},
        toggleWireframe: {buttons: [YAWVRB.Keyboard.KEYCODES.NUMBER1], commandDown: function () { app.toggleWireframe(); }},
        toggleNormalMaterial: {buttons: [YAWVRB.Keyboard.KEYCODES.NUMBER2], commandDown: function () { app.toggleNormalMaterial(); }},
        saveStageConfiguration: {buttons: [YAWVRB.Keyboard.KEYCODES.X], commandDown: saveStage},
        toggleHTMLMenu: {buttons: [YAWVRB.Keyboard.KEYCODES.M], commandDown: toggleHTMLMenu}
    };
    for (var k in YAWVRB.Keyboard.STANDARD_COMMANDS) {
        keyboardCommands[k] = YAWVRB.Keyboard.STANDARD_COMMANDS[k];
    }

    var keyboard = new YAWVRB.Keyboard(window, keyboardCommands);
    var keyboardObject = keyboard.stageObject;
    keyboardObject.position.z = -12 * INCH2METERS;
    keyboardObject.position.y = -5 * INCH2METERS;
    keyboardObject.updateMatrix();
    ( new YAWVRB.Utils.TextLabel({object: keyboardObject}) ).setText('Keyboard');
    objectSelector.addSelectable(keyboardObject);
    keyboardObject.name = 'keyboard';
    stage.stageRoot.add(keyboardObject);

    // GfxTablet:
    var gfxTablet = new YAWVRB.GfxTablet(2560, 1600);
    gfxTablet.mesh.position.set(-0.32, -0.3, -0.05);
    gfxTablet.mesh.quaternion.setFromAxisAngle(UP, 0.5 * Math.PI).multiply((new THREE.Quaternion()).setFromAxisAngle(RIGHT, -0.125 * Math.PI));
    gfxTablet.mesh.updateMatrix();
    gfxTablet.mesh.name = 'GfxTablet';
    ( new YAWVRB.Utils.TextLabel({object: gfxTablet.mesh, position: [0, 0.5, 0.05]}) ).setText('GfxTablet');
    objectSelector.addSelectable(gfxTablet.mesh);
    stage.stageRoot.add(gfxTablet.mesh);

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
            console.log(scene.matrix);
            console.log(scene.position);
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

                    if (textGeomLogger) textGeomLogger.update(t);

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

                    for (i = 0; i < openVRTools.length; i++) {
                        openVRTools[i].update(dt);
                    }

                    app.render();

                    world.step(Math.min(dt, 1/60), dt, 10);

                    ballMesh.position.copy(ballBody.interpolatedPosition);
                    ballMesh.quaternion.copy(ballBody.interpolatedQuaternion);
                    ballMesh.updateMatrix();
                    ballMesh.updateMatrixWorld();

                    if (textLabel) textLabel.setText(`${openVRTools[0].mesh.position.x.toFixed(3)}, ${openVRTools[0].mesh.position.y.toFixed(3)}, ${openVRTools[0].mesh.position.z.toFixed(3)}`);

                    lt = t;
                    requestAnimationFrame(animate);
                }
                requestAnimationFrame(animate);
            }

        });

    } )();

};
