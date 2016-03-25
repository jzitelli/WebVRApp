var app;

function onLoad() {
	"use strict";

	var scene = ( function () {
		var scene = new THREE.Scene();

		var textureLoader = new THREE.TextureLoader();
		var deskTexture = textureLoader.load('models/textures/desk.png');
		var deskMaterial = new THREE.MeshBasicMaterial({map: deskTexture});
		var floorTexture = textureLoader.load('models/textures/floor.png');
		var floorMaterial = new THREE.MeshBasicMaterial({map: floorTexture});

		var objectLoader = new THREE.ObjectLoader();
		objectLoader.load("models/deskScene.json", function (obj) {
			obj.rotation.x = -Math.PI / 2;
			obj.scale.set(0.4, 0.4, 0.4);
			obj.children[0].material = deskMaterial;
			obj.children[1].material = floorMaterial;
			scene.add(obj);
		});
		return scene;
	} )();

	app = new WebVRApp(scene, undefined, {canvas: document.getElementById('webgl-canvas')});

	var keyboard = new WebVRKeyboard(window, {
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

	var avatar = new THREE.Object3D();
	avatar.add(app.camera);
	scene.add(avatar);
	var heading = 0;
	function moveAvatar(dt) {
		var cos = Math.cos(heading),
			sin = Math.sin(heading);
		var moveFB = keyboard.moveForward - keyboard.moveBackward,
			moveRL = keyboard.moveRight - keyboard.moveLeft,
			moveUD = keyboard.moveUp - keyboard.moveDown,
			turnLR = keyboard.turnLeft - keyboard.turnRight;
		if (moveFB || moveRL || moveUD || turnLR) {
			heading += (turnLR) * dt;
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

	requestAnimationFrame(animate);

	setInterval(logFPS, 1000);
	var fpsCount = 0;
	function logFPS() {
		console.log('FPS: ' + (frameCount - fpsCount));
		fpsCount = frameCount;
	}
}
