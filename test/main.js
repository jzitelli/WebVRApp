var app;

function onLoad() {
	"use strict";

	var scene = ( function () {
		var scene = new THREE.Scene();

		var objectLoader = new THREE.ObjectLoader();
		objectLoader.load('models/desk.json', function (obj) {
			obj.scale.set(0.8, 0.8, 0.8);
			obj.rotation.y = Math.PI;
			obj.position.set(0, -3.75, -2.75);
			scene.add(obj);
		});

		return scene;
	} )();

	app = new WebVRApp(scene, undefined, {canvas: document.getElementById('webgl-canvas')});

	var keyboard = new WebVRKeyboard(document, {
		toggleFullscreen: {buttons: [WebVRKeyboard.KEYCODES.F], commandDown: app.toggleFullscreen},
		toggleVRControls: {buttons: [WebVRKeyboard.KEYCODES.C], commandDown: app.toggleVRControls},
		resetVRSensor: {buttons: [WebVRKeyboard.KEYCODES.Z], commandDown: app.resetVRSensor},
		toggleWireframe: {buttons: [WebVRKeyboard.KEYCODES.NUMBER1], commandDown: app.toggleWireframe},
		toggleNormalMaterial: {buttons: [WebVRKeyboard.KEYCODES.NUMBER2], commandDown: app.toggleNormalMaterial}
	});

	requestAnimationFrame(animate);
	function animate(t) {
		app.render();
		requestAnimationFrame(animate);
	}
}
