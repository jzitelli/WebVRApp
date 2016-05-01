function onLoad() {
    "use strict";

    THREE.Object3D.DefaultMatrixAutoUpdate = false;

    const INCH2METERS = 0.0254;
    const UP = THREE.Object3D.DefaultUp;
    const RIGHT = new THREE.Vector3(1, 0, 0);

    var canvas = document.getElementById('webgl-canvas');

    var app;

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
        resetVRSensor: {buttons: [7], commandDown: function () { app.resetVRSensor(); }},
        moveFB: {axes: [1]},
        moveRL: {axes: [0]}
    };
    var gamepad = new YAWVRB.Gamepad(gamepadCommands);

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
    // var leapTool = YAWVRB.LeapMotion.makeTool({toolColor: 0xbb9999, handColor: 0x99bbbb});
    // avatar.add(leapTool.toolRoot);
    // world.add(leapTool.toolBody);
    // leapTool.leapController.connect();

    // remote leap motion controller:
    // var leapToolRemote = YAWVRB.LeapMotion.makeTool({toolColor: 0x99bb99, handColor: 0xbb99bb, host: URL_PARAMS.remoteLeapHost || '192.168.1.201'});
    // leapToolRemote.toolRoot.position.x -= 32 * INCH2METERS;
    // leapToolRemote.toolRoot.updateMatrix();
    // avatar.add(leapToolRemote.toolRoot);
    // world.add(leapToolRemote.toolBody);
    // leapToolRemote.leapController.connect();

    var gfxTablet = new YAWVRB.GfxTablet(2560, 1600);
    avatar.add(gfxTablet.mesh);
    gfxTablet.mesh.position.set(-0.32, -0.3, -0.05);
    gfxTablet.mesh.quaternion.setFromAxisAngle(UP, 0.5 * Math.PI).multiply((new THREE.Quaternion()).setFromAxisAngle(RIGHT, -0.125 * Math.PI));
    gfxTablet.mesh.updateMatrix();

    YAWVRB.AppUtils.displayText('GfxTablet', {object: gfxTablet.mesh, position: [0, 0.25, -0.05]});
    YAWVRB.AppUtils.displayText('Keyboard', {object: keyboardObject});
    //YAWVRB.AppUtils.displayText('Leap Motion #1', {object: leapTool.toolRoot});
    //YAWVRB.AppUtils.displayText('Leap Motion #2', {object: leapToolRemote.toolRoot});

    objectSelector.addSelectable(avatar);
    objectSelector.addSelectable(keyboardObject);
    // objectSelector.addSelectable(leapTool.toolRoot);
    // objectSelector.addSelectable(leapToolRemote.toolRoot);
    objectSelector.addSelectable(gfxTablet.mesh);

    function moveByKeyboard(dt) {
        var moveFB = keyboard.moveForward - keyboard.moveBackward,
            moveRL = keyboard.moveRight - keyboard.moveLeft,
            moveUD = keyboard.moveUp - keyboard.moveDown,
            turnRL = keyboard.turnRight - keyboard.turnLeft,
            turnUD = keyboard.turnUp - keyboard.turnDown;
        if (objectSelector.selection === avatar) turnUD = 0;
        objectSelector.moveSelection(dt, moveFB, moveRL, moveUD, turnRL, turnUD);
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

            app = new YAWVRB.App(scene, undefined, {canvas: canvas, alpha: true});

            app.renderer.setSize(window.innerWidth, window.innerHeight);

            scene.add(avatar);

            avatar.add(app.camera);

            scene.updateMatrixWorld(true);

            // leapTool.updateToolMapping();
            // leapToolRemote.updateToolMapping();

            requestAnimationFrame(animate);

            var frameCount = 0,
                lt = 0;
            function animate(t) {
                var dt = 0.001 * (t - lt);
                frameCount++;

                moveByKeyboard(dt);
                // leapTool.updateToolMapping();
                // leapToolRemote.updateToolMapping();

                gamepad.update();
                // leapTool.updateTool(dt);
                // leapToolRemote.updateTool(dt);

                app.render();

                world.step(Math.min(dt, 1/60), dt, 10);

                // leapTool.updateToolPostStep();
                // leapToolRemote.updateToolPostStep();

                lt = t;
                requestAnimationFrame(animate);
            }

        });

    } )();;
}
