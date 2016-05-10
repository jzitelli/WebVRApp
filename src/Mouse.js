/* global THREE */

module.exports = ( function () {
	"use strict";

	const DEFAULT_OPTIONS = {
		eventTarget: document
	};

	function Mouse(options) {
		var _options = {};
		options = options || _options;
		for (var option in DEFAULT_OPTIONS) {
			if (options[option] === undefined) _options[option] = DEFAULT_OPTIONS[option];
			else _options[option] = options[option];
		}
		options = _options;

		var pointerMesh = options.pointerMesh || new THREE.Mesh(new THREE.CircleBufferGeometry(0.014, 8), new THREE.MeshBasicMaterial({color: 0xffee22}));
		pointerMesh.matrixAutoUpdate = false;
		this.pointerMesh = pointerMesh;

		var eventTarget = options.eventTarget;

		var material = new THREE.MeshBasicMaterial({color: 0xff00ff});
		var stageGeom = new THREE.BoxBufferGeometry(2.5, 1.1, 3.5);
		var stageObject = new THREE.Mesh(stageGeom, material);
		this.stageObject = stageObject;

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
