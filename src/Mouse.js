module.exports = ( function () {
	"use strict";

	const DEFAULT_OPTIONS = {
		eventTarget: document,
	};

	function Mouse(options) {
		options = options || {};
		for (var option in DEFAULT_OPTIONS) {
			if (options[option] === undefined) options[option] = DEFAULT_OPTIONS[option];
		}

		var pointerMesh = options.pointerMesh || new THREE.Mesh(new THREE.CircleBufferGeometry(0.014, 8), new THREE.MeshBasicMaterial({color: 0xffee22}));
		pointerMesh.matrixAutoUpdate = false;
		this.pointerMesh = pointerMesh;

		var eventTarget = options.eventTarget;

		function onMouseMove(evt) {
			var aspect = window.innerWidth / window.innerHeight;
			if (document.pointerLockElement) {
				pointerMesh.position.x += evt.movementX / window.innerWidth;
				pointerMesh.position.y -= evt.movementY / window.innerHeight / aspect;
			} else {
				pointerMesh.position.x = -0.5 + evt.screenX / window.innerWidth;
				pointerMesh.position.y =  (0.5 - evt.screenY / window.innerHeight) / aspect;
			}
			pointerMesh.updateMatrix();
		}
		eventTarget.addEventListener("mousemove", onMouseMove, false);

		// function onClick(evt) {
		// 	// TODO
		// }
		// eventTarget.addEventListener("click", onClick, false);
	}

	return Mouse;
} )();
