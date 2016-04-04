var YAWVRBTEST = {};

function onLoad(onLoadLoad) {
	"use strict";
	const RIGHT = new THREE.Vector3(1, 0, 0);
	const INCH2METER = 0.254;

	var app;

	var avatar = new THREE.Object3D();
	avatar.position.y = 1.77;
	// avatar.position.z = 1.8;
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

			app = new WebVRApp(scene, {avatar: avatar}, {canvas: document.getElementById('webgl-canvas')});
			YAWVRBTEST.app = app;

			// var matrix = new THREE.Matrix4().makeRotationFromEuler(new THREE.Euler(-0.5 * Math.PI, 0, 0));
			// matrix.multiply(new THREE.Matrix4().makeScale(INCH2METER, INCH2METER, INCH2METER));
			var matrix = new THREE.Matrix4().makeScale(INCH2METER, INCH2METER, INCH2METER);
			for (var i = 0, l = scene.children.length; i < l; i++) {
				var child = scene.children[i];
				child.updateMatrix();
				child.matrix.multiplyMatrices(matrix, child.matrix);
				child.matrixAutoUpdate = false;
				if (child instanceof THREE.Mesh) {
					if (child.name === 'desk') child.material = deskMaterial;
					else if (child.name === 'chair') child.material = chairMaterial;
					else child.material = roomMaterial;
				}
			}

			scene.add(avatar);

			avatar.add(app.camera);

			( function () {

				// create visual keyboard:

				var pointLight = new THREE.PointLight();
				pointLight.position.y = 7;
				pointLight.position.z = 2;

				scene.add(pointLight);

	        	var keyboardObject = new THREE.Object3D();
				keyboardObject.matrixAutoUpdate = false;
				keyboardObject.position.y = 1.2;
				keyboardObject.position.z = 1;
				keyboardObject.updateMatrix();

				scene.add(keyboardObject);

				objectSelector.addSelectable(keyboardObject);

				const keyDelta = INCH2METER * 0.75;
				const keyHeight = INCH2METER * 0.25;
				const keyTravel = keyHeight * 0.7;

				var regularKeyGeom = new THREE.BoxBufferGeometry(0.95 * keyDelta, keyHeight, 0.95 * keyDelta);

				var spacebarWidth = 0.95 * INCH2METER * 4.75;
				var spacebarGeom = new THREE.BoxBufferGeometry(spacebarWidth, keyHeight, 0.95 * keyDelta);

				var keyMaterial = new THREE.MeshLambertMaterial({color: 0xbbbbbb});

				var keyMesh = {};

				// regular keys:
				const ROWS = [
					"`1234567890-=",
					"qwertyuiop[]",
					"asdfghjkl;'",
					"zxcvbnm,./"
				];

				ROWS.forEach( function (row, i) {
					for (var j = 0; j < row.length; j++) {
						var char = row[j];
						var mesh = new THREE.Mesh(regularKeyGeom, keyMaterial);
						mesh.name = char;
						mesh.matrixAutoUpdate = false;
						mesh.position.z = i * keyDelta;
						mesh.position.x = j * keyDelta;
						mesh.updateMatrix();
						keyMesh[char] = mesh;
						keyboardObject.add(mesh);
					}
				} );

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

			scene.updateMatrixWorld(true);

			var frameCount = 0,
				lt = 0;
			function animate(t) {
				var dt = 0.001 * (t - lt);
				frameCount++;
				app.render();
				YAWVRBTEST.moveByKeyboard(dt);
				lt = t;
				requestAnimationFrame(animate);
			}

			if (onLoadLoad) onLoadLoad(app)
			else requestAnimationFrame(animate);
		});

	} )();
}
