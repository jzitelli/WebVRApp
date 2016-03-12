function onLoad() {
	"use strict";

	var scene = ( function () {
		var scene = new THREE.Scene();
		var boxGeom = new THREE.BoxGeometry(1, 1, 1);
		var material = new THREE.MeshNormalMaterial();
		var mesh = new THREE.Mesh(boxGeom, material);
		mesh.position.z = -2;
		scene.add(mesh);
		return scene;
	} )();

	var app = new WebVRApp(scene);

	requestAnimationFrame(animate);
	function animate(t) {
		app.render();
	}
}
