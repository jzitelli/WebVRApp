window.YAWVRB = window.YAWVRB || {};

YAWVRB.Mouse = ( function () {
	"use strict";

	const INCH2METERS = 0.0254;

	const DEFAULT_OPTIONS = {
		eventTarget: document,
	};

	function Mouse(options) {
		options = options || {};
		for (var option in DEFAULT_OPTIONS) {
			if (options[option] === undefined) options[option] = DEFAULT_OPTIONS[option];
		}

		var pointerMesh = options.pointerMesh || new THREE.Mesh(new THREE.CircleBufferGeometry(0.02, 8), new THREE.MeshBasicMaterial({color: 0xffee22}));
		pointerMesh.matrixAutoUpdate = false;
		this.pointerMesh = pointerMesh;

		var eventTarget = options.eventTarget;

		function onMouseMove(evt) {
			var aspect = window.innerWidth / window.innerHeight;
			pointerMesh.position.x = -0.5 + evt.clientX / window.innerWidth;
			pointerMesh.position.y =  (0.5 - evt.clientY / window.innerHeight) / aspect;
			pointerMesh.updateMatrix();
		}
		eventTarget.addEventListener("mousemove", onMouseMove, false);

		function onClick(evt) {
			// TODO
		}
		eventTarget.addEventListener("click", onClick, false);
	}

	return Mouse;
} )();
