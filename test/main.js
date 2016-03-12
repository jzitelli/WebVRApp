function onLoad() {
	"use strict";

	var scene = ( function () {
		var scene = new THREE.Scene();

		var objectLoader = new THREE.ObjectLoader();
		objectLoader.load('models/desk.json', function (obj) {
			obj.rotation.y = Math.PI;
			obj.position.set(0, -3, -3);
			scene.add(obj);

			var directionalLight = new THREE.DirectionalLight(0xffffff);
			directionalLight.position.set(2, 2, 2);
			scene.add(directionalLight);
		});

		return scene;
	} )();

	var app = new WebVRApp(scene, {rendererOptions: {canvas: document.getElementById('webgl-canvas')}});

	requestAnimationFrame(animate);
	function animate(t) {
		app.render();
	}
}
