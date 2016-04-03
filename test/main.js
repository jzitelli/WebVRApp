var app;

function onLoad() {
	"use strict";
	const RIGHT = new THREE.Vector3(1, 0, 0);

	var avatar = new THREE.Object3D();

	var keyboard;

	var heading = 0;
	var pitch = 0;
	var pitchQuat = new THREE.Quaternion().setFromAxisAngle(RIGHT, pitch);

	avatar.quaternion.multiplyQuaternions(avatar.quaternion.setFromAxisAngle(THREE.Object3D.DefaultUp, heading), pitchQuat);

	var selection = avatar;
	var selectables = [avatar];
	var headings = [heading];
	var pitches = [pitch];

	var cycleSelection = ( function () {
		var i = 0;
		return function () {
			headings[i] = heading;
			pitches[i] = pitch;
			i = (i + 1) % selectables.length;
			selection = selectables[i];
			heading = headings[i];
			pitch = pitches[i];
		};
	} )();

	( function () {

		// load the WebVRDesk scene and start

		var textureLoader = new THREE.TextureLoader();

		var deskTexture = textureLoader.load('/test/models/textures/deskTexture.png');
		var deskMaterial = new THREE.MeshBasicMaterial({map: deskTexture});
		var deskObject = new THREE.Object3D();

		var roomTexture = textureLoader.load('/test/models/textures/roomTexture.png');
		var roomMaterial = new THREE.MeshBasicMaterial({map: roomTexture});
		var roomObject = new THREE.Object3D();

		var chairTexture = textureLoader.load('/test/models/textures/chairTexture.png');
		var chairMaterial = new THREE.MeshBasicMaterial({map: chairTexture});
		var chairObject = new THREE.Object3D();

		var objectLoader = new THREE.ObjectLoader();

		objectLoader.load("/test/models/WebVRDesk.json", function (scene) {

			scene.position.set(0, 0, 0);
			scene.rotation.set(0, 0, 0);
			scene.scale.set(1, 1, 1);
			scene.updateMatrix();

			var matrix = new THREE.Matrix4().makeRotationFromEuler(new THREE.Euler(-0.5 * Math.PI, 0, 0));
			matrix.multiply(new THREE.Matrix4().makeScale(0.254, 0.254, 0.254));
			scene.children.forEach( function (child) {
				child.updateMatrix();
				child.matrixAutoUpdate = false;
				child.matrix.multiplyMatrices(matrix, child.matrix);
				if (child instanceof THREE.Mesh) {
					if (child.name === 'desk') child.material = deskMaterial;
					else if (child.name === 'chair') child.material = chairMaterial;
					else child.material = roomMaterial;
				}
			} );

	        objectLoader.load("/test/models/WebVRKeyboard.json", function (keyboardScene) {

				var pointLight = new THREE.PointLight();
				pointLight.position.y = 7;
				pointLight.position.z = 2;

				scene.add(pointLight);

	        	var keyboardObject = new THREE.Object3D();
				keyboardObject.scale.set(0.09, 0.09, 0.09);
				keyboardObject.position.y += 0.727;
				keyboardObject.position.z += 0.2;
				keyboardObject.rotation.x -= Math.PI / 2;
				keyboardObject.updateMatrix();

				scene.add(keyboardObject);

				selectables.push(keyboardObject);
				headings.push(0);
				pitches.push(-Math.PI / 2);

				var keyMaterial = new THREE.MeshLambertMaterial({color: 0xbbbbbb});

				var keyMesh = {};
				var keyBB = {};

				while (keyboardScene.children.length > 0) {

					var child = keyboardScene.children[0];
					keyboardScene.remove(child);
					if (child instanceof THREE.Mesh) {
						child.matrixAutoUpdate = false;
						child.updateMatrix();
						child.material = keyMaterial;
						if (child.name) {
							child.geometry.computeBoundingBox();
							keyBB[child.name] = child.geometry.boundingBox;
							keyMesh[child.name] = child;
						}
			        	keyboardObject.add(child);
			        }

				}

				app = new WebVRApp(scene, undefined, {canvas: document.getElementById('webgl-canvas')});

				avatar.position.y = 1.;
				avatar.position.z = 0.38;

				scene.add(avatar);

				avatar.add(app.camera);

	        	var keyboardCommands = { cycleSelection: {buttons: [WebVRKeyboard.KEYCODES.OPENBRACKET], commandDown: cycleSelection} };
	        	for (var k in WebVRKeyboard.STANDARD_COMMANDS) {
	        		keyboardCommands[k] = WebVRKeyboard.STANDARD_COMMANDS[k];
	        	}
				keyboard = new WebVRKeyboard(window, keyboardCommands);

				var keyDown = [];

				window.addEventListener("keydown", function (evt) {
					if (!keyDown[evt.keyCode]) {
						var keyName = WebVRKeyboard.CODEKEYS[evt.keyCode];
						if (keyName) keyName = keyName.toLowerCase();
						var mesh = keyMesh[keyName];
						if (mesh) {
							var dz = (keyBB[keyName].max.z - keyBB[keyName].min.z) * 0.01;
							mesh.position.z -= dz;
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
							var dz = (keyBB[keyName].max.z - keyBB[keyName].min.z) * 0.01;
							mesh.position.z += dz;
							mesh.updateMatrix();
						}
					}
					keyDown[evt.keyCode] = false;
				}, false);

				scene.updateMatrixWorld(true);

				onReady();

			});

		});
	} )();

	function onReady() {
		requestAnimationFrame(animate);
	}

	var tLogFPS = 1000;
	var fpsCount = 0;
	// setInterval(logFPS, tLogFPS);
	function logFPS() {
		console.log('FPS: ' + (frameCount - fpsCount) * (1000 / tLogFPS));
		fpsCount = frameCount;
	}

	const SPEED = 0.3;
	function moveFromKeyboard(dt) {
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
			selection.position.z -= ((moveFB) * cos + (moveRL) * sin) * dt * SPEED;
			selection.position.x += ((moveRL) * cos - (moveFB) * sin) * dt * SPEED;
			selection.position.y += moveUD * dt * SPEED;
			selection.quaternion.multiplyQuaternions(selection.quaternion.setFromAxisAngle(THREE.Object3D.DefaultUp, heading),
			                                         pitchQuat.setFromAxisAngle(RIGHT, pitch));
			selection.updateMatrix();
			selection.updateMatrixWorld();
		}
	}

	var frameCount = 0,
		lt = 0;
	function animate(t) {
		var dt = 0.001 * (t - lt);
		frameCount++;
		app.render();
		moveFromKeyboard(dt);
		lt = t;
		requestAnimationFrame(animate);
	}

}
