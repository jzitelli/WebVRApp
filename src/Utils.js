/* global THREE */

module.exports = ( function () {
    "use strict";

    var moveObject = ( function () {
        const MOVESPEED = 0.3;
        var euler = new THREE.Euler(0, 0, 0, 'YXZ');
        return function (object, dt, moveFB, moveRL, moveUD, turnRL, turnUD) {
            if (moveFB || moveRL || moveUD || turnRL || turnUD) {
                euler.setFromQuaternion(object.quaternion);
                euler.y -= (turnRL) * dt;
                euler.x -= (turnUD) * dt;
                object.quaternion.setFromEuler(euler);
                var cos = Math.cos(euler.y),
                    sin = Math.sin(euler.y);
                object.position.z -= dt * MOVESPEED * ((moveFB) * cos + (moveRL) * sin);
                object.position.x += dt * MOVESPEED * ((moveRL) * cos - (moveFB) * sin);
                object.position.y += dt * MOVESPEED * moveUD;
                object.updateMatrix();
                object.updateMatrixWorld();
            }
        };
    } )();

    function ObjectSelector() {
        this.selection;
        var selectables = [];

        this.addSelectable = function (obj) {
            selectables.push(obj);
            if (!this.selection) this.selection = obj;
        }.bind(this);

        this.cycleSelection = ( function () {
            var i = 0;
            return function (inc) {
                i = (i + inc) % selectables.length;
                if (i < 0) i += selectables.length;
                this.selection = selectables[i];
            };
        } )().bind(this);
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
                ctx.strokeStyle = 'rgb(240, 70, 20)';
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
                    mesh.scale.set(aspect * 0.075 / worldScale.x, 0.075 / worldScale.y, 1 / worldScale.z);
                    mesh.updateMatrix();
                }
                textMeshes[key] = mesh;
            }
        }
        return displayText;
    } )();

    var URL_PARAMS = ( function () {
        var params = {};
        location.search.substr(1).split("&").forEach( function(item) {
            var k = item.split("=")[0],
                v = decodeURIComponent(item.split("=")[1]);
            if (k in params) {
                params[k].push(v);
            } else {
                params[k] = [v];
            }
        } );
        for (var k in params) {
            if (params[k].length === 1)
                params[k] = params[k][0];
            if (params[k] === 'true')
                params[k] = true;
            else if (params[k] === 'false')
                params[k] = false;
        }
        return params;
    } )();

    return {
        ObjectSelector: ObjectSelector,
        displayText: displayText,
        moveObject: moveObject,
        DEADSCENE: DEADSCENE,
        URL_PARAMS: URL_PARAMS
    };

} )();
