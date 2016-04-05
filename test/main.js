var YAWVRBTEST = {};

function onLoad() {
    "use strict";

    THREE.Object3D.DefaultMatrixAutoUpdate = false;

    const RIGHT = new THREE.Vector3(1, 0, 0);
    const INCH2METERS = 0.0254;

    var app;

    var avatar = new THREE.Object3D();
    avatar.position.y = 1.2;
    avatar.position.z = -0.28
    avatar.updateMatrix();

    var objectSelector = new WebVRAppUtils.ObjectSelector();

    YAWVRBTEST.objectSelector = objectSelector;

    objectSelector.addSelectable(avatar);

    var keyboardCommands = {
        toggleVR: {buttons: [WebVRKeyboard.KEYCODES.V], commandDown: function () { app.toggleVR(); }},
        resetVRSensor: {buttons: [WebVRKeyboard.KEYCODES.Z], commandDown: function () { app.resetVRSensor(); }},
        cycleSelection: {buttons: [WebVRKeyboard.KEYCODES.OPENBRACKET], commandDown: objectSelector.cycleSelection},
        toggleWireframe: {buttons: [WebVRKeyboard.KEYCODES.NUMBER1], commandDown: function () { app.toggleWireframe(); }},
        toggleNormalMaterial: {buttons: [WebVRKeyboard.KEYCODES.NUMBER2], commandDown: function () { app.toggleNormalMaterial(); }}
    };
    for (var k in WebVRKeyboard.STANDARD_COMMANDS) {
        keyboardCommands[k] = WebVRKeyboard.STANDARD_COMMANDS[k];
    }

    var keyboard = new WebVRKeyboard(window, keyboardCommands);

    function readKeyboardMovement() {
        return {
            moveFB: keyboard.moveForward - keyboard.moveBackward,
            moveRL: keyboard.moveRight - keyboard.moveLeft,
            moveUD: keyboard.moveUp - keyboard.moveDown,
            turnLR: keyboard.turnLeft - keyboard.turnRight,
            turnUD: keyboard.turnUp - keyboard.turnDown
        };
    }

    YAWVRBTEST.moveByKeyboard = function (dt) {
        var km = readKeyboardMovement();
        if (objectSelector.selection === avatar) km.turnUD = 0;
        objectSelector.moveByKeyboard(dt, km.moveFB, km.moveRL, km.moveUD, km.turnLR, km.turnUD);
    };

    var tLogFPS = 1000;
    var fpsCount = 0;
    // setInterval(logFPS, tLogFPS);
    function logFPS() {
        console.log('FPS: ' + (frameCount - fpsCount) * (1000 / tLogFPS));
        fpsCount = frameCount;
    }

    ( function () {

        // load the WebVRDesk scene and start

        var textureLoader = new THREE.TextureLoader();

        var deskTexture = textureLoader.load('/test/models/textures/deskTexture.png');
        var deskMaterial = new THREE.MeshBasicMaterial({map: deskTexture});

        var roomTexture = textureLoader.load('/test/models/textures/roomTexture.png');
        var roomMaterial = new THREE.MeshBasicMaterial({map: roomTexture});

        var chairTexture = textureLoader.load('/test/models/textures/chairTexture.png');
        var chairMaterial = new THREE.MeshBasicMaterial({map: chairTexture});

        var objectLoader = new THREE.ObjectLoader();

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

            app = new WebVRApp(scene, {avatar: avatar}, {canvas: document.getElementById('webgl-canvas')});
            YAWVRBTEST.app = app;

            scene.add(avatar);

            avatar.add(app.camera);

            ( function () {

                // create visual keyboard:

                var keyboardObject = new THREE.Object3D();
                avatar.add(keyboardObject);
                keyboardObject.position.z = -12 * INCH2METERS;
                keyboardObject.position.y = -5 * INCH2METERS;
                keyboardObject.updateMatrix();

                objectSelector.addSelectable(keyboardObject);

                var keyMaterial = new THREE.MeshLambertMaterial({color: 0xbbbbbb});

                const keyDelta = INCH2METERS * 0.75;
                const keyHeight = INCH2METERS * 0.3;
                const keyTravel = keyHeight * 0.7;

                var regularKeyGeom = new THREE.BoxBufferGeometry(0.95 * keyDelta, keyHeight, 0.95 * keyDelta);

                var i, j; // i = 0 at upper number key row, 4 at bottom row, -1 at function key row;
                          // j = 0 at start (left) of row, increments for each key until the end of the row.
                var row, char;
                var mesh;

                var keyMesh = {};
                // regular-sized keys:
                const REGULAR_ROWS = [
                    "`1234567890-=",
                    "qwertyuiop[]",
                    "asdfghjkl;'",
                    "zxcvbnm,./"
                ];
                for (i = 0; i < REGULAR_ROWS.length; i++) {
                    row = REGULAR_ROWS[i];
                    for (j = 0; j < row.length; j++) {
                        char = row[j];
                        mesh = new THREE.Mesh(regularKeyGeom, keyMaterial);
                        mesh.name = char;
                        mesh.position.z = 0.5 * keyDelta + i * keyDelta;
                        mesh.position.x = 0.5 * keyDelta + j * keyDelta;
                        keyMesh[char] = mesh;
                        keyboardObject.add(mesh);
                    }
                }

                // the *crazy* bottom row:
                var controlWidth = INCH2METERS * 1.5,
                    windowsWidth = controlWidth,
                    altWidth     = controlWidth;
                var controlGeom = new THREE.BoxBufferGeometry(0.95 * controlWidth, keyHeight, 0.95 * keyDelta),
                    windowsGeom = controlGeom,
                    altGeom     = controlGeom;
                var spacebarWidth = 0.95 * INCH2METERS * 4.75;
                var spacebarGeom = new THREE.BoxBufferGeometry(0.95 * spacebarWidth, keyHeight, 0.95 * keyDelta);

                mesh = new THREE.Mesh(controlGeom, keyMaterial);
                mesh.position.z = 4.5 * keyDelta;
                mesh.position.x = 0.5 * controlWidth;
                keyMesh['lcontrol'] = mesh;
                keyboardObject.add(mesh);

                mesh = mesh.clone();
                mesh.position.x += 0.5 * (controlWidth + windowsWidth);
                keyMesh['lwindows'] = mesh;
                keyboardObject.add(mesh);

                mesh = mesh.clone();
                mesh.position.x += 0.5 * (windowsWidth + altWidth);
                keyMesh['lalt'] = mesh;
                keyboardObject.add(mesh);

                mesh = new THREE.Mesh(spacebarGeom, keyMaterial);
                mesh.position.z = 4.5 * keyDelta;
                mesh.position.x = keyMesh['lalt'].position.x + 0.5 * (altWidth + spacebarWidth);
                keyMesh['spacebar'] = mesh;
                keyboardObject.add(mesh);

                for (var k in keyMesh) {
                    keyMesh[k].updateMatrix();
                }

                var keyDown = [];

                window.addEventListener("keydown", function (evt) {
                    if (!keyDown[evt.keyCode]) {
                        var keyName = WebVRKeyboard.CODEKEYS[evt.keyCode];
                        if (keyName) keyName = keyName.toLowerCase();
                        var mesh = keyMesh[keyName];
                        if (mesh) {
                            mesh.position.y -= keyTravel;
                            mesh.updateMatrix();
                        }
                    }
                    keyDown[evt.keyCode] = true;
                }, false);

                window.addEventListener("keyup", function (evt) {
                    if (keyDown[evt.keyCode]) {
                        var keyName = WebVRKeyboard.CODEKEYS[evt.keyCode];
                        if (keyName) keyName = keyName.toLowerCase();
                        var mesh = keyMesh[keyName];
                        if (mesh) {
                            mesh.position.y += keyTravel;
                            mesh.updateMatrix();
                        }
                    }
                    keyDown[evt.keyCode] = false;
                }, false);

            } )();

            var world = new CANNON.World();

            // local leap motion controller:
            var leapTool = WebVRLeapMotion.makeTool({toolColor: 0xbb9999, handColor: 0x99bbbb});
            avatar.add(leapTool.toolRoot);
            world.add(leapTool.toolBody);
            YAWVRBTEST.objectSelector.addSelectable(leapTool.toolRoot);
            leapTool.leapController.connect();

            // remote leap motion controller:
            var leapToolRemote = WebVRLeapMotion.makeTool({toolColor: 0x99bb99, handColor: 0xbb99bb, host: '192.168.1.200'});
            leapToolRemote.toolRoot.position.x += 0.3;
            avatar.add(leapToolRemote.toolRoot);
            world.add(leapToolRemote.toolBody);
            YAWVRBTEST.objectSelector.addSelectable(leapToolRemote.toolRoot);
            leapToolRemote.leapController.connect();

            var gfxTablet = new WebVRGfxTablet(2560, 1600);
            avatar.add(gfxTablet.mesh);
            gfxTablet.mesh.position.set(-0.2, -0.1, -0.05);
            gfxTablet.mesh.rotation.y = 0.5 * Math.PI;
            //gfxTablet.mesh.rotation.x = -0.125 * Math.PI;
            gfxTablet.mesh.updateMatrix();
            YAWVRBTEST.objectSelector.addSelectable(gfxTablet.mesh);

            scene.updateMatrixWorld(true);

            leapTool.updateToolMapping();
            leapToolRemote.updateToolMapping();

            requestAnimationFrame(animate);

            var frameCount = 0,
                lt = 0;
            function animate(t) {
                var dt = 0.001 * (t - lt);
                frameCount++;
                leapTool.updateTool(dt);
                leapToolRemote.updateTool(dt);
                app.render();
                world.step(Math.min(dt, 1/60), dt, 10);
                leapTool.updateToolPostStep();
                leapToolRemote.updateToolPostStep();
                YAWVRBTEST.moveByKeyboard(dt);
                leapTool.updateToolMapping();
                leapToolRemote.updateToolMapping();
                lt = t;
                requestAnimationFrame(animate);
            }

        });

    } )();;
}
