function onLoad() {
	"use strict";

	var scene = ( function () {
		var scene = new THREE.Scene();

		var directionalLight = new THREE.DirectionalLight(0xffffff);
		directionalLight.position.set(2, 2, 2);
		scene.add(directionalLight);

		var objectLoader = new THREE.ObjectLoader();
		objectLoader.load('models/desk.json', function (obj) {
			obj.rotation.y = Math.PI;
			obj.position.set(0, -3, -3);
			scene.add(obj);
		});

		return scene;
	} )();

	var app = new WebVRApp(scene);

	requestAnimationFrame(animate);
	function animate(t) {
		app.render();
	}
}
