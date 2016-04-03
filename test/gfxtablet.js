function onLoadExtended() {
	"use strict";

	onLoad( function () {

		var app = YAWVRB.app;

		var world = new CANNON.World();

		var leapTool = WebVRLeap.makeTool(app.avatar, world);

		// set up paintable surface for GfxTablet
		var gfxTabletStuff = addGfxTablet(2560, 1600);
		gfxTabletStuff.paintableMaterial;
		gfxTabletStuff.cursor;

		requestAnimationFrame(animate);

		var frameCount = 0,
			lt = 0;
		function animate(t) {
			var dt = 0.001 * (t - lt);
			frameCount++;
			leapTool.updateTool(dt);
			app.render();
			YAWVRB.moveFromKeyboard(dt);
			world.step(Math.min(dt, 1/60), dt, 10);
			leapTool.updateToolPostStep(dt);
			lt = t;
			requestAnimationFrame(animate);
		}

	} );

}
