var app;

function onLoad() {
	"use strict";

	var scene = ( function () {
		var scene = new THREE.Scene();

		var objectLoader = new THREE.ObjectLoader();
		objectLoader.load('models/desk.json', function (obj) {
			obj.traverse( function (node) {
				if (node instanceof THREE.Mesh) {
					node.geometry.computeFaceNormals();
					node.material.shading = THREE.FlatShading;
					node.material.needsUpdate = true;
				}
			} );
			obj.scale.set(0.65, 0.65, 0.65);
			obj.rotation.y = Math.PI;
			obj.position.set(0, -2.75, -2);
			scene.add(obj);
		});

		return scene;
	} )();

	app = new WebVRApp(scene, undefined, {canvas: document.getElementById('webgl-canvas')});

	var keyboard = new WebVRKeyboard(document, {
		toggleFullscreen: {buttons: [WebVRKeyboard.KEYCODES.F], commandDown: app.toggleFullscreen},
		toggleVR: {buttons: [WebVRKeyboard.KEYCODES.V], commandDown: app.toggleVR},
		toggleVRControls: {buttons: [WebVRKeyboard.KEYCODES.C], commandDown: app.toggleVRControls},
		resetVRSensor: {buttons: [WebVRKeyboard.KEYCODES.Z], commandDown: app.resetVRSensor},
		toggleWireframe: {buttons: [WebVRKeyboard.KEYCODES.NUMBER1], commandDown: app.toggleWireframe},
		toggleNormalMaterial: {buttons: [WebVRKeyboard.KEYCODES.NUMBER2], commandDown: app.toggleNormalMaterial}
	});

	var frameCount = 0;
	function animate(t) {
		frameCount++;
		app.render();
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
