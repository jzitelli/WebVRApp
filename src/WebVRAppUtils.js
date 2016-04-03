var WebVRAppUtils = ( function () {
	"use strict";

	function ObjectSelector() {

		var selectables = [];
		// var selected = [];
		var headings = [];
		var pitches = [];

		var selection;
		var heading = 0;
		var pitch = 0;

		this.addSelectable = function (obj) {
			selectables.push(obj);
			pitches.push(obj.rotation.x);
			headings.push(obj.rotation.y);
			if (!selection) selection = obj;
		};

		this.cycleSelection = ( function () {
			var i = 0;
			return function () {
				headings[i] = heading;
				pitches[i] = pitch;
				i = (i + 1) % selectables.length;
				selection = selectables[i];
				heading = headings[i];
				pitch = pitches[i];
			};
		} )();


		const MOVESPEED = 0.3;
		const RIGHT = new THREE.Vector3(1, 0, 0);
		var pitchQuat = new THREE.Quaternion();

		this.moveByKeyboard = function (dt, moveFB, moveRL, moveUD, turnLR, turnUD) {
			if (!selection) return;
			if (moveFB || moveRL || moveUD || turnLR || turnUD) {
				heading += (turnLR) * dt;
				pitch   -= (turnUD) * dt;
				var cos = Math.cos(heading),
					sin = Math.sin(heading);
				selection.position.z -= dt * MOVESPEED * ((moveFB) * cos + (moveRL) * sin);
				selection.position.x += dt * MOVESPEED * ((moveRL) * cos - (moveFB) * sin);
				selection.position.y += dt * MOVESPEED * moveUD;
				selection.quaternion.multiplyQuaternions(selection.quaternion.setFromAxisAngle(THREE.Object3D.DefaultUp, heading),
				                                   pitchQuat.setFromAxisAngle(RIGHT, pitch));
				selection.updateMatrix();
				selection.updateMatrixWorld();
			}
		};

	}

	return {
		ObjectSelector: ObjectSelector
	};

} )();
