var app;

function onLoad() {
	"use strict";

	var avatar = new THREE.Object3D();
	avatar.position.y = 1.;
	avatar.position.z = 0.38;

	var keyboard;

	var heading = 0;
	var pitch = 0;
	var selection = avatar;
	var selectables = [avatar];
	var headings = [heading];
	var pitches = [pitch];

	var cycleSelection = (function () {
		var i = 0;
		return function () {
			headings[i] = heading;
			pitches[i] = pitch;
			i = (i + 1) % selectables.length;
			selection = selectables[i];
			heading = headings[i];
			pitch = pitches[i];
		};
	})();

	var scene = ( function () {
		var scene = new THREE.Scene();

		scene.add(avatar);

		var textureLoader = new THREE.TextureLoader();

		var deskTexture = textureLoader.load('models/textures/deskTexture.png');
		var deskMaterial = new THREE.MeshBasicMaterial({map: deskTexture});

		var roomTexture = textureLoader.load('models/textures/roomTexture.png');
		var roomMaterial = new THREE.MeshBasicMaterial({map: roomTexture});

		var chairTexture = textureLoader.load('models/textures/chairTexture.png');
		var chairMaterial = new THREE.MeshBasicMaterial({map: chairTexture});

		var objectLoader = new THREE.ObjectLoader();

		objectLoader.load("models/WebVRDesk.json", function (deskScene) {

			deskScene.scale.set(0.254, 0.254, 0.254);
			deskScene.rotation.x = -Math.PI / 2;
			deskScene.updateMatrixWorld(true);

			while (deskScene.children.length > 0) {
				var child = deskScene.children[0];
				if (child instanceof THREE.Mesh) {
					deskScene.remove(child);
					child.matrixAutoUpdate = false;
					child.matrix.copy(child.matrixWorld);
					if (child.name === 'desk') child.material = deskMaterial;
					else if (child.name === 'chair') child.material = chairMaterial;
					else child.material = roomMaterial;
					scene.add(child);
				}
			}

	        objectLoader.load("models/WebVRKeyboard.json", function (keyboardScene) {

				var pointLight = new THREE.PointLight();
				pointLight.position.y = 7;
				pointLight.position.z = 2;
				scene.add(pointLight);

	        	var keyboardObject = new THREE.Object3D();
				keyboardObject.scale.set(0.1, 0.1, 0.1);
				keyboardObject.position.y += 0.83;
				keyboardObject.position.z += 0.2;
				keyboardObject.rotation.x -= Math.PI / 2;

				scene.add(keyboardObject);

				selectables.push(keyboardObject);

				var keyMaterial = new THREE.MeshLambertMaterial({color: 0xbbbbbb});

				var keyMesh = {};
				var keyBB = {};

				while (keyboardScene.children.length > 0) {

					var child = keyboardScene.children[0];
					if (child instanceof THREE.Mesh) {
						keyboardScene.remove(child);
			        	keyboardObject.add(child);
						child.matrixAutoUpdate = false;
						child.updateMatrix();
						child.material = keyMaterial;
						if (child.name) {
							child.geometry.computeBoundingBox();
							keyBB[child.name] = child.geometry.boundingBox;
							keyMesh[child.name] = child;
						}
			        }

				}

				app = new WebVRApp(scene, undefined, {canvas: document.getElementById('webgl-canvas')});
				avatar.add(app.camera);

				keyboard = new WebVRKeyboard(window, {
					cycleSelection: {buttons: [WebVRKeyboard.KEYCODES.OPENBRACKET], commandDown: cycleSelection},
					toggleFullscreen: {buttons: [WebVRKeyboard.KEYCODES.F], commandDown: app.toggleFullscreen},
					toggleVR: {buttons: [WebVRKeyboard.KEYCODES.V], commandDown: app.toggleVR},
					toggleVRControls: {buttons: [WebVRKeyboard.KEYCODES.C], commandDown: app.toggleVRControls},
					resetVRSensor: {buttons: [WebVRKeyboard.KEYCODES.Z], commandDown: app.resetVRSensor},
					toggleWireframe: {buttons: [WebVRKeyboard.KEYCODES.NUMBER1], commandDown: app.toggleWireframe},
					toggleNormalMaterial: {buttons: [WebVRKeyboard.KEYCODES.NUMBER2], commandDown: app.toggleNormalMaterial},
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
				});

				var keyDown = [];

				window.addEventListener("keydown", function (evt) {
					if (!keyDown[evt.keyCode]) {
						var keyName = WebVRKeyboard.CODEKEYS[evt.keyCode];
						if (keyName) keyName = keyName.toLowerCase();
						var mesh = keyMesh[keyName];
						if (mesh) {
							mesh.position.z -= (keyBB[keyName].max.z - keyBB[keyName].min.z) * 0.01;
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
							mesh.position.z += (keyBB[keyName].max.z - keyBB[keyName].min.z) * 0.01;
							mesh.updateMatrix();
						}
					}
					keyDown[evt.keyCode] = false;
				}, false);

				onReady();

			});

		});

		return scene;
	} )();

	function onReady() {
		requestAnimationFrame(animate);
	}

	var tLogFPS = 2000;
	var fpsCount = 0;
	// setInterval(logFPS, tLogFPS);
	function logFPS() {
		console.log('FPS: ' + (frameCount - fpsCount) * (1000 / tLogFPS));
		fpsCount = frameCount;
	}

	const RIGHT = new THREE.Vector3(1, 0, 0);
	function moveSelection(dt) {
		var moveFB = keyboard.moveForward - keyboard.moveBackward,
			moveRL = keyboard.moveRight - keyboard.moveLeft,
			moveUD = keyboard.moveUp - keyboard.moveDown,
			turnLR = keyboard.turnLeft - keyboard.turnRight,
			turnUD = keyboard.turnUp - keyboard.turnDown;
		if (moveFB || moveRL || moveUD || turnLR || turnUD) {
			heading += (turnLR) * dt;
			pitch -= (turnUD) * dt;
			var cos = Math.cos(heading),
				sin = Math.sin(heading);
			selection.position.z -= ((moveFB) * cos + (moveRL) * sin) * dt;
			selection.position.x += ((moveRL) * cos - (moveFB) * sin) * dt;
			selection.position.y += moveUD * dt;
			selection.quaternion.setFromAxisAngle(THREE.Object3D.DefaultUp, heading);
			selection.quaternion.multiplyQuaternions(selection.quaternion, (new THREE.Quaternion()).setFromAxisAngle(RIGHT, pitch));
		}
	}

	var frameCount = 0,
		lt = 0;
	function animate(t) {
		var dt = 0.001 * (t - lt);
		frameCount++;
		app.render();
		moveSelection(dt);
		lt = t;
		requestAnimationFrame(animate);
	}

}
