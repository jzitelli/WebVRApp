function onLoadExtended() {
	"use strict";

	onLoad( function () {

		var app = YAWVRBTEST.app;

		var world = new CANNON.World();

		var leapTool = WebVRLeapMotion.makeTool(world, {host: '192.168.1.200'});
		app.avatar.add(leapTool.toolRoot);

		var gfxTablet = new WebVRGfxTablet();
		app.scene.add(gfxTablet.mesh);

		YAWVRBTEST.objectSelector.addSelectable(leapTool.toolRoot);
		YAWVRBTEST.objectSelector.addSelectable(gfxTablet.mesh);

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
			YAWVRBTEST.moveByKeyboard(dt);
			leapTool.updateToolMapping();
			lt = t;
			requestAnimationFrame(animate);
		}

	} );

}
