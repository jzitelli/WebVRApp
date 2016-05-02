/* global THREE */

module.exports = ( function () {
    "use strict";

    const UP = THREE.Object3D.DefaultUp;
    const RIGHT = new THREE.Vector3(1, 0, 0);

    function ObjectSelector() {

        var selectables = [];

        this.selection;
        var heading = 0;
        var pitch = 0;

        this.addSelectable = function (obj) {
            selectables.push(obj);
            if (!this.selection) this.selection = obj;
        }.bind(this);

        this.cycleSelection = ( function () {
            var i = 0;
            var euler = new THREE.Euler();
            return function () {
                i = (i + 1) % selectables.length;
                this.selection = selectables[i];
                euler.setFromQuaternion(this.selection.quaternion);
                heading = euler.y;
                pitch = euler.x;
            };
        } )().bind(this);

        const MOVESPEED = 0.3;
        var pitchQuat = new THREE.Quaternion();

        this.moveSelection = function (dt, moveFB, moveRL, moveUD, turnRL, turnUD) {
            var selection = this.selection;
            if (!selection) return;
            if (moveFB || moveRL || moveUD || turnRL || turnUD) {
                heading -= (turnRL) * dt;
                pitch   -= (turnUD) * dt;
                var cos = Math.cos(heading),
                    sin = Math.sin(heading);
                selection.position.z -= dt * MOVESPEED * ((moveFB) * cos + (moveRL) * sin);
                selection.position.x += dt * MOVESPEED * ((moveRL) * cos - (moveFB) * sin);
                selection.position.y += dt * MOVESPEED * moveUD;
                selection.quaternion.multiplyQuaternions(selection.quaternion.setFromAxisAngle(UP, heading), pitchQuat.setFromAxisAngle(RIGHT, pitch));
                selection.updateMatrix();
                selection.updateMatrixWorld();
            }
        }.bind(this);

        this.saveAllTransforms = function (key) {
            if (!window.localStorage) {
                console.error('platform does not support localStorage');
                return;
            }
            key = key || 'YAWVRB_TRANSFORMS';
            var transforms = {};
            selectables.forEach( function (object) {
                if (object.name) {
                    transforms[object.name] = {
                        position: object.position.toArray(),
                        quaternion: object.quaternion.toArray()
                    };
                }
            } );
            window.localStorage[key] = transforms;
        };

        this.loadTransforms = function (key) {
            if (!window.localStorage) {
                console.error('platform does not support localStorage');
                return;
            }
            key = key || 'YAWVRB_TRANSFORMS';
            var transforms = window.localStorage[key];
            selectables.forEach( function (object) {
                if (object.name && transforms[object.name]) {
                    var transform = transforms[object.name];
                    object.position.fromArray(transform.position);
                    object.quaternion.fromArray(transform.quaternion);
                    object.updateMatrix();
                }
            } );
        };
    }

    var DEADSCENE = new THREE.Scene();
    DEADSCENE.name = 'DEADSCENE';
    var displayText = ( function () {
        var textMeshes = {};
        var quadGeom = new THREE.PlaneBufferGeometry(1, 1);
        quadGeom.translate(0.5, 0.5, 0);
        const DEFAULT_OPTIONS = {
            object: DEADSCENE,
            position: [0, 0.05, -0.05],
            quaternion: [0, 0, 0, 1],
            coordSystem: 'local',
            textSize: 21
        };
        function displayText(text, options) {
            options = options || {};
            for (var kwarg in DEFAULT_OPTIONS) {
                if (options[kwarg] === undefined) options[kwarg] = DEFAULT_OPTIONS[kwarg];
            }
            var uuid = options.object.uuid;
            var key = JSON.stringify({text, uuid});
            var mesh = textMeshes[key];
            if (!mesh) {
                var canvas = document.createElement('canvas');
                canvas.height = 2 * options.textSize;
                canvas.width = 256; //2*ctx.measureText(text).width;
                var ctx = canvas.getContext('2d');
                ctx.font = String(options.textSize) + "px serif";
                // ctx.fillStyle   = 'rgba(23, 23, 23, 0.3)';
                // ctx.strokeStyle = 'rgba(23, 23, 23, 0.3)';
                // ctx.fillRect(  0, 0, canvas.width, canvas.height);
                // ctx.strokeRect(0, 0, canvas.width, canvas.height);
                ctx.fillStyle   = 'rgb(255, 72, 23)';
                ctx.strokeStyle = 'rgb(250, 70, 20)';
                ctx.fillText(  text, 0, options.textSize);
                ctx.strokeText(text, 0, options.textSize);
                var aspect = canvas.width / canvas.height;
                var texture = new THREE.Texture(canvas, THREE.UVMapping, THREE.ClampToEdgeWrapping, THREE.ClampToEdgeWrapping, THREE.LinearFilter, THREE.LinearFilter);
                var material = new THREE.MeshBasicMaterial({color: 0xffffff, map: texture, transparent: true});
                mesh = new THREE.Mesh(quadGeom, material);
                material.map.needsUpdate = true;
                if (options.coordSystem === 'local') {
                    options.object.add(mesh);
                    mesh.position.fromArray(options.position);
                    mesh.quaternion.fromArray(options.quaternion);
                    var worldScale = options.object.getWorldScale();
                    mesh.scale.set(aspect * 0.125 / worldScale.x, 0.125 / worldScale.y, 1 / worldScale.z);
                    mesh.updateMatrix();
                }
                textMeshes[key] = mesh;
            }
        }
        return displayText;
    } )();

    return {
        ObjectSelector: ObjectSelector,
        displayText: displayText,
        DEADSCENE: DEADSCENE
    };

} )();
