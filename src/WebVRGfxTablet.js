var WebVRGfxTablet = ( function () {
	"use strict";
	function WebVRGfxTablet() {

		// set up WebSocket, paintable surface for GfxTablet

		var gfxTabletStuff = addGfxTablet(2560, 1600);

		// create VR visuals

		var gfxTabletGeom = new THREE.PlaneBufferGeometry(2560 / 1600 / 8, 1 / 8);
		var gfxTabletMesh = new THREE.Mesh(gfxTabletGeom, gfxTabletStuff.paintableMaterial);
		gfxTabletMesh.add(gfxTabletStuff.cursor);
		gfxTabletMesh.position.y = 1.5;
		this.mesh = gfxTabletMesh;
	}
	return WebVRGfxTablet;
} )();
