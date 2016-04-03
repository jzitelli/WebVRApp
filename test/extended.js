function onLoadExtended() {
	"use strict";

	onLoad( function () {

		var app = YAWVRB.app;

		var world = new CANNON.World();

		var leapTool = WebVRLeap.makeTool(app.avatar, world);
		YAWVRB.selectables.push(leapTool.toolRoot);

		// set up paintable surface for GfxTablet
		var gfxTabletStuff = addGfxTablet(2560, 1600);

		var gfxTabletGeom = new THREE.PlaneBufferGeometry(2560/1600, 1);
		var gfxTabletMesh = new THREE.Mesh(gfxTabletGeom, gfxTabletStuff.paintableMaterial);
		gfxTabletMesh.add(gfxTabletStuff.cursor);
		gfxTabletMesh.position.y = 0.5;
		app.scene.add(gfxTabletMesh);

		YAWVRB.selectables.push(gfxTabletMesh);

		requestAnimationFrame(animate);

		var frameCount = 0,
			lt = 0;

		function animate(t) {
			var dt = 0.001 * (t - lt);
			frameCount++;

			leapTool.updateTool(dt);

			app.render();

			world.step(Math.min(dt, 1/60), dt, 10);

			leapTool.updateToolPostStep(dt);

			YAWVRB.moveFromKeyboard(dt);

			leapTool.updateToolMapping();

			lt = t;
			requestAnimationFrame(animate);
		}

	} );

}
