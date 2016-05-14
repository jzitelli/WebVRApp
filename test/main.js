/* global THREE, YAWVRB, CANNON */
window.onLoad = function () {
    "use strict";

    console.log('navigator.userAgent: %s', navigator.userAgent);

    const INCH2METERS = 0.0254;
    const UP = THREE.Object3D.DefaultUp;
    const RIGHT = new THREE.Vector3(1, 0, 0);

    THREE.Object3D.DefaultMatrixAutoUpdate = false;

    var textGeomLogger;
    ( function () {
        var fontLoader = new THREE.FontLoader();
        fontLoader.load('/node_modules/three.js/examples/fonts/droid/droid_sans_mono_regular.typeface.js', function (font) {
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

    var objectSelector = new YAWVRB.Utils.ObjectSelector();

    var stage = new YAWVRB.Stage();

    function saveStage() {
        var transforms = stage.save();
        textGeomLogger.log(JSON.stringify(transforms, undefined, 2));
    }

    var avatar = new THREE.Object3D();
    avatar.position.y = 1.2;
    avatar.position.z = -0.28;
    avatar.updateMatrix();

    objectSelector.addSelectable(avatar);

    avatar.add(stage.stageRoot);

    var world = new CANNON.World();

    var app = ( function () {
        var euler = new THREE.Euler(0, 0, 0, 'YXZ');
        var app;
        app = new YAWVRB.App(undefined, {
            onResetVRSensor: function (lastRotation, lastPosition) {
                console.log('lastRotation: %f, lastPosition: (%f, %f, %f)', lastRotation, lastPosition.x, lastPosition.y, lastPosition.z);
                // maintain poses of stage objects:
                stage.objects.forEach( function (object) {
                    // maintain rotation of object (relative heading of object w.r.t. HMD):
                    var camera = app.camera;
                    euler.setFromQuaternion(object.quaternion);
                    euler.y -= lastRotation;
                    object.quaternion.setFromEuler(euler);
                    // maintain position of object w.r.t. HMD:
                    object.position.sub(lastPosition);
                    object.position.applyAxisAngle(THREE.Object3D.DefaultUp, -lastRotation);
                    object.position.add(camera.position);
                    object.updateMatrix();
                } );
            }
        }, {
            canvas: document.getElementById('webgl-canvas'),
            alpha: true
        });
        return app;
    } )();

    window.app = app;

    var overlay = document.getElementById('overlay');

    function toggleVRMenu() {
        textGeomLogger.log('vr menu enabled');
    }

    // function toggleHTMLMenu() {
    //     if (overlay.style.display === 'none') {
    //         overlay.style.display = 'block';
    //     } else {
    //         overlay.style.display = 'none';
    //     }
    // }

    var xboxGamepadCommands = {
        toggleVR: {buttons: [YAWVRB.Gamepad.BUTTONS.start], commandDown: function () { console.log('entering VR'); app.toggleVR(); }},
        resetVRSensor: {buttons: [YAWVRB.Gamepad.BUTTONS.back], commandDown: function () { app.resetVRSensor(); }},
        cycleSelection: {buttons: [YAWVRB.Gamepad.BUTTONS.right], commandDown: objectSelector.cycleSelection},
        cyclePrevSelection: {buttons: [YAWVRB.Gamepad.BUTTONS.left], commandDown: objectSelector.cycleSelection.bind(objectSelector, -1)},
        moveFB: {axes: [YAWVRB.Gamepad.AXES.LSY]},
        moveRL: {axes: [YAWVRB.Gamepad.AXES.LSX]},
        turnRL: {axes: [YAWVRB.Gamepad.AXES.RSX]},
        turnUD: {axes: [YAWVRB.Gamepad.AXES.RSY]},
        toggleFloat: {buttons: [YAWVRB.Gamepad.BUTTONS.leftStick]},
        logButton: {buttons: [0,1,2,3,4,5,6,7,8], commandDown: function (j) { console.log('pressed %d', j); }}
    };

    var viveACommands = {
        toggleVR: {buttons: [3], commandDown: function () { console.log('entering VR'); app.toggleVR(); }},
        toggleFloat: {buttons: [0]},
        logButton: {buttons: [0,1,2,3,4,5,6,7,8], commandDown: function (j) { console.log('pressed %d', j); }},
        moveFB: {axes: [YAWVRB.Gamepad.AXES.LSY]},
        moveRL: {axes: [YAWVRB.Gamepad.AXES.LSX]}
    };

    function padButtonDown(button, axes) {
        console.log('button %d: %f, %f', button, axes[0], axes[1]);
        console.log(axes[0]*axes[0] + axes[1]*axes[1]);
        console.log(Math.atan2(axes[0], axes[1]) * 180 / Math.PI);
    }

    var viveBCommands = {
        toggleVRMenu: {buttons: [3], commandDown: toggleVRMenu},
        padButton: {buttons: [0], commandDown: padButtonDown},
        turnRL: {axes: [YAWVRB.Gamepad.AXES.LSX]},
        turnUD: {axes: [YAWVRB.Gamepad.AXES.LSY]}
    };

    YAWVRB.Gamepad.setGamepadCommands(0, viveACommands);
    YAWVRB.Gamepad.setGamepadCommands(1, viveBCommands);

    YAWVRB.Gamepad.setOnGamepadConnected( function (e) {
        console.log('your custome gamepad connected routine!@!!!');
        if (/openvr/i.test(e.gamepad.id)) {
            if (e.index === 0) {
                YAWVRB.Gamepad.viveA.visible = true;
                YAWVRB.Gamepad.setGamepadCommands(e.gamepad.index, viveACommands);
            } else if (e.index === 1) {
                YAWVRB.Gamepad.viveB.visible = true;
                YAWVRB.Gamepad.setGamepadCommands(e.gamepad.index, viveBCommands);
            }
        } else if (/xbox/i.test(e.gamepad.id) || /xinput/i.test(e.gamepad.id)) {
            YAWVRB.Gamepad.setGamepadCommands(e.gamepad.index, xboxGamepadCommands);
        }
    } );

    stage.stageRoot.add(YAWVRB.Gamepad.viveA);
    stage.stageRoot.add(YAWVRB.Gamepad.viveB);

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

    var profileNameInput = document.getElementById('profileName');
    profileNameInput.value = 'dev';

    var vrButton = document.getElementById('vrButton');
    vrButton.addEventListener('click', function () {
        app.toggleVR();
        vrButton.blur();
    });

    var fsButton = document.getElementById('fsButton');
    fsButton.addEventListener('click', function () {
        app.toggleFullscreen();
        fsButton.blur();
    });

    var wireframeInput = document.getElementById('wireframeInput');
    wireframeInput.addEventListener('click', function () {
        app.toggleWireframe();
    });

    var saveStageButton = document.getElementById('saveStageButton');
    saveStageButton.addEventListener('click', function () {
        saveStage();
    });

    app.scene.add(avatar);
    avatar.add(app.camera);

    app.renderer.setSize(window.innerWidth, window.innerHeight);

    // local leap motion controller:
    var localLeapStatusIndicator = document.getElementById('localLeapStatus');
    var leapToolOptions = {
        onConnect: function () {
            localLeapStatusIndicator.textContent = 'local websocket connected';
            localLeapStatusIndicator.style['background-color'] = 'rgba(60, 60, 20, 0.7)';
        },
        onStreamingStarted: function () {
            localLeapStatusIndicator.textContent = 'local websocket connected, streaming';
            localLeapStatusIndicator.style['background-color'] = 'rgba(60, 100, 30, 0.5)';
        },
        onStreamingStopped: function () {
            localLeapStatusIndicator.textContent = 'local websocket connected, streaming stopped';
            localLeapStatusIndicator.style['background-color'] = 'rgba(60, 50, 30, 0.6)';
        },
        onDisconnect: function () {
            localLeapStatusIndicator.textContent = 'local websocket disconnected';
            localLeapStatusIndicator.style['background-color'] = 'rgba(60, 20, 20, 0.5)';
        },
        toolColor: 0xbb9999,
        handColor: 0x99bbbb,
        shadowPlane: avatar.position.y - 0.25,
        shadowMaterial: new THREE.MeshBasicMaterial({color: 0x222233})
    };
    var leapTool = YAWVRB.LeapMotion.makeTool(leapToolOptions);
    leapTool.toolRoot.name = 'toolRoot';
    YAWVRB.Utils.displayText('Leap Motion (local)', {object: leapTool.toolRoot});
    leapTool.leapController.connect();
    objectSelector.addSelectable(leapTool.toolRoot);
    avatar.add(leapTool.toolRoot);
    world.add(leapTool.toolBody);
    stage.objects.push(leapTool.toolRoot);

    // remote leap motion controller:
    var remoteLeapStatusIndicator = document.getElementById('remoteLeapStatus');
    var remoteLeapToolOptions = {
        host: YAWVRB.Utils.URL_PARAMS.remoteLeapHost || '192.168.1.201',
        onConnect: function () {
            remoteLeapStatusIndicator.textContent = 'remote websocket connected';
            remoteLeapStatusIndicator.style['background-color'] = 'rgba(60, 60, 20, 0.7)';
        },
        onStreamingStarted: function () {
            remoteLeapStatusIndicator.textContent = 'remote websocket connected, streaming';
            remoteLeapStatusIndicator.style['background-color'] = 'rgba(60, 100, 30, 0.5)';
        },
        onStreamingStopped: function () {
            remoteLeapStatusIndicator.textContent = 'remote websocket connected, streaming stopped';
            remoteLeapStatusIndicator.style['background-color'] = 'rgba(60, 50, 30, 0.6)';
        },
        onDisconnect: function () {
            remoteLeapStatusIndicator.textContent = 'remote websocket disconnected';
            remoteLeapStatusIndicator.style['background-color'] = 'rgba(60, 20, 20, 0.7)';
        },
        toolColor: 0x99bb99,
        handColor: 0xbb99bb,
        shadowPlane: leapToolOptions.shadowPlane,
        shadowMaterial: leapToolOptions.shadowMaterial
    };
    var leapToolRemote = YAWVRB.LeapMotion.makeTool(remoteLeapToolOptions);
    var remoteLeapAddressInput = document.getElementById('remoteLeapAddress');
    remoteLeapAddressInput.value = remoteLeapToolOptions.host;
    remoteLeapAddressInput.addEventListener('change', onLeapAddressChange, false);
    function onLeapAddressChange() {
        var host = remoteLeapAddressInput.value;
        leapToolRemote.leapController.connection.host = host;
        leapToolRemote.leapController.connection.disconnect(true);
        leapToolRemote.leapController.connect();
    }
    leapToolRemote.toolRoot.position.x -= 20 * INCH2METERS;
    leapToolRemote.toolRoot.updateMatrix();
    YAWVRB.Utils.displayText('Leap Motion (remote)', {object: leapToolRemote.toolRoot});
    leapToolRemote.leapController.connect();
    objectSelector.addSelectable(leapToolRemote.toolRoot);
    avatar.add(leapToolRemote.toolRoot);
    world.add(leapToolRemote.toolBody);
    leapToolRemote.toolRoot.name = 'remoteToolRoot';
    stage.objects.push(leapToolRemote.toolRoot);

    var mouse = new YAWVRB.Mouse({eventTarget: window});
    mouse.togglePointer();
    avatar.add(mouse.pointerMesh);
    mouse.pointerMesh.position.z = -0.4;
    mouse.pointerMesh.updateMatrix();
    mouse.stageObject.name = 'mouse';
    objectSelector.addSelectable(mouse.stageObject);
    mouse.stageObject.position.set(0, -12 * 0.254, -12 * 0.0254);
    avatar.add(mouse.stageObject);
    stage.objects.push(mouse.stageObject);

    var keyboardCommands = {
        toggleVR: {buttons: [YAWVRB.Keyboard.KEYCODES.V], commandDown: function () { app.toggleVR(); }},
        resetVRSensor: {buttons: [YAWVRB.Keyboard.KEYCODES.Z], commandDown: function () { app.resetVRSensor(); }},
        cycleSelection: {buttons: [YAWVRB.Keyboard.KEYCODES.CLOSEDBRACKET], commandDown: objectSelector.cycleSelection},
        cyclePrevSelection: {buttons: [YAWVRB.Keyboard.KEYCODES.OPENBRACKET], commandDown: objectSelector.cycleSelection.bind(objectSelector, -1)},
        toggleWireframe: {buttons: [YAWVRB.Keyboard.KEYCODES.NUMBER1], commandDown: function () { app.toggleWireframe(); }},
        toggleNormalMaterial: {buttons: [YAWVRB.Keyboard.KEYCODES.NUMBER2], commandDown: function () { app.toggleNormalMaterial(); }},
        saveStageConfiguration: {buttons: [YAWVRB.Keyboard.KEYCODES.X], commandDown: saveStage}
    };
    for (var k in YAWVRB.Keyboard.STANDARD_COMMANDS) {
        keyboardCommands[k] = YAWVRB.Keyboard.STANDARD_COMMANDS[k];
    }

    var keyboard = new YAWVRB.Keyboard(window, keyboardCommands);
    var keyboardObject = keyboard.stageObject;
    keyboardObject.position.z = -12 * INCH2METERS;
    keyboardObject.position.y = -5 * INCH2METERS;
    keyboardObject.updateMatrix();
    YAWVRB.Utils.displayText('Keyboard', {object: keyboardObject});
    objectSelector.addSelectable(keyboardObject);
    avatar.add(keyboardObject);
    keyboardObject.name = 'keyboard';
    stage.objects.push(keyboardObject);

    // GfxTablet:
    var gfxTablet = new YAWVRB.GfxTablet(2560, 1600);
    avatar.add(gfxTablet.mesh);
    gfxTablet.mesh.position.set(-0.32, -0.3, -0.05);
    gfxTablet.mesh.quaternion.setFromAxisAngle(UP, 0.5 * Math.PI).multiply((new THREE.Quaternion()).setFromAxisAngle(RIGHT, -0.125 * Math.PI));
    gfxTablet.mesh.updateMatrix();
    gfxTablet.mesh.name = 'GfxTablet';
    YAWVRB.Utils.displayText('GfxTablet', {object: gfxTablet.mesh, position: [0, 0.5, 0.05]});
    objectSelector.addSelectable(gfxTablet.mesh);
    stage.objects.push(gfxTablet.mesh);

    stage.load();

    function moveByKeyboard(dt) {
        var moveFB = keyboard.moveForward - keyboard.moveBackward,
            moveRL = keyboard.moveRight - keyboard.moveLeft,
            moveUD = keyboard.moveUp - keyboard.moveDown,
            turnRL = keyboard.turnRight - keyboard.turnLeft,
            turnUD = keyboard.turnUp - keyboard.turnDown;

        var values = YAWVRB.Gamepad.update();

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

        if (objectSelector.selection === avatar) turnUD = 0;
        YAWVRB.Utils.moveObject(objectSelector.selection, dt, moveFB, moveRL, moveUD, turnRL, turnUD);
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

            leapTool.updateToolMapping();
            if (leapToolRemote) leapToolRemote.updateToolMapping();

            function startAnimateLoop() {
                var lt = 0;
                function animate(t) {
                    var dt = 0.001 * (t - lt);

                    if (textGeomLogger) textGeomLogger.update(t);

                    moveByKeyboard(dt, t);

                    leapTool.updateToolMapping();
                    if (leapToolRemote) leapToolRemote.updateToolMapping();
                    leapTool.updateTool(dt);
                    if (leapToolRemote) leapToolRemote.updateTool(dt);

                    app.render();

                    world.step(Math.min(dt, 1/60), dt, 10);

                    leapTool.updateToolPostStep();
                    if (leapToolRemote) leapToolRemote.updateToolPostStep();

                    lt = t;
                    requestAnimationFrame(animate);
                }
                requestAnimationFrame(animate);
            }

            startAnimateLoop();

        });

    } )();

};
