var app;

function onLoad() {
	"use strict";

	var avatar = new THREE.Object3D();
	var keyboard;

	var scene = ( function () {
		var scene = new THREE.Scene();

		scene.add(avatar);

		var textureLoader = new THREE.TextureLoader();
		var deskTexture = textureLoader.load('models/textures/deskLightmap.png');
		var deskMaterial = new THREE.MeshBasicMaterial({map: deskTexture});
		var floorTexture = textureLoader.load('models/textures/roomLightmap.png');
		var floorMaterial = new THREE.MeshBasicMaterial({map: floorTexture});

		var objectLoader = new THREE.ObjectLoader();
		objectLoader.load("models/WebVRDesk.json", function (obj) {

			obj.rotation.x = -Math.PI / 2;
			obj.scale.set(0.3, 0.3, 0.3);
			obj.children[0].material = deskMaterial;
			obj.children[1].material = floorMaterial;

			scene.add(obj);

	        objectLoader.load("/blender/WebVRKeyboard.json", function (obj) {

				var pointLight = new THREE.PointLight();
				pointLight.position.y = 7;
				pointLight.position.z = 2;

				scene.add(pointLight);

				obj.scale.set(0.1*5/2, 0.1*5/2, 0.1*5/2);
				obj.position.y += 1.2;

				var keyMesh = {};
				var keyMaterial = new THREE.MeshLambertMaterial({color: 0xbbbbbb});
				var keyBB = {};
				var dz = 0;
				obj.traverse( function (node) {
					if (node instanceof THREE.Mesh) {
						node.material = keyMaterial;
						if (node.name) {
							node.geometry.computeBoundingBox();
							keyBB[node.name] = node.geometry.boundingBox;
							keyMesh[node.name] = node;
							dz = 0.01 * (node.geometry.boundingBox.max.z - node.geometry.boundingBox.min.z);
						}
					}
				} );

				app = new WebVRApp(scene, undefined, {canvas: document.getElementById('webgl-canvas')});
				avatar.add(app.camera);

				keyboard = new WebVRKeyboard(document, {
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
					turnRight: {buttons: [WebVRKeyboard.KEYCODES.RIGHTARROW]}
				});

				window.addEventListener("keydown", function (evt) {
					if (!keyboard.keyDown[evt.keyCode]) {
						var keyName = WebVRKeyboard.CODEKEYS[evt.keyCode];
						if (keyName) keyName = keyName.toLowerCase();
						var mesh = keyMesh[keyName];
						if (mesh) {
							mesh.position.z -= (keyBB[keyName].max.z - keyBB[keyName].min.z) * 0.01;
						}
					}
				});

				window.addEventListener("keyup", function (evt) {
					var keyName = WebVRKeyboard.CODEKEYS[evt.keyCode];
					if (keyName) keyName = keyName.toLowerCase();
					var mesh = keyMesh[keyName];
					if (mesh) {
						mesh.position.z += (keyBB[keyName].max.z - keyBB[keyName].min.z) * 0.01;
					}
				});

				scene.add(obj);

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
		// console.log('FPS: ' + (frameCount - fpsCount) * (1000 / tLogFPS));
		fpsCount = frameCount;
	}

	var heading = 0;
	function moveAvatar(dt) {
		var moveFB = keyboard.moveForward - keyboard.moveBackward,
			moveRL = keyboard.moveRight - keyboard.moveLeft,
			moveUD = keyboard.moveUp - keyboard.moveDown,
			turnLR = keyboard.turnLeft - keyboard.turnRight;
		if (moveFB || moveRL || moveUD || turnLR) {
			heading += (turnLR) * dt;
			var cos = Math.cos(heading),
				sin = Math.sin(heading);
			avatar.quaternion.setFromAxisAngle(THREE.Object3D.DefaultUp, heading);
			avatar.position.z -= ((moveFB) * cos + (moveRL) * sin) * dt;
			avatar.position.x += ((moveRL) * cos - (moveFB) * sin) * dt;
			avatar.position.y += moveUD * dt;
		}
	}

	var frameCount = 0,
		lt = 0;
	function animate(t) {
		var dt = 0.001 * (t - lt);
		frameCount++;
		app.render();
		moveAvatar(dt);
		lt = t;
		requestAnimationFrame(animate);
	}

}
