function onLoad() {
	"use strict";

	var scene = ( function () {
		var scene = new THREE.Scene();

		var objectLoader = new THREE.ObjectLoader();
		objectLoader.load('test/models/desk.json', function (obj) {
			obj.rotation.y = Math.PI;
			obj.position.set(0, -3.75, -2.75);
			scene.add(obj);
		});

		return scene;
	} )();

	var app = new WebVRApp(scene, {rendererOptions: {canvas: document.getElementById('webgl-canvas')}});

	requestAnimationFrame(animate);
	function animate(t) {
		app.render();
		requestAnimationFrame(animate);
	}
}
