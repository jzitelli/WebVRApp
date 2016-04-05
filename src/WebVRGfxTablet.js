var WebVRGfxTablet = ( function () {
	"use strict";
	const INCH2METERS = 0.0254;
	function WebVRGfxTablet(width, height, downScale) {
		// set up WebSocket, paintable surface for GfxTablet:
		var gfxTabletStuff = GFXTABLET.addGfxTablet(width, height, downScale);
		// create VR visuals:
		var mesh = new THREE.Mesh(new THREE.PlaneBufferGeometry(1, 1), gfxTabletStuff.paintableMaterial);
		mesh.scale.x = 8.5 * INCH2METERS;
		mesh.scale.y = 5.25 * INCH2METERS;
		var cursor = gfxTabletStuff.cursor;
		cursor.scale.x = 0.016 / mesh.scale.x;
		cursor.scale.y = 0.016 / mesh.scale.y;
		mesh.add(cursor);
		this.mesh = mesh;
		this.cursor = cursor;
	}
	return WebVRGfxTablet;
} )();
