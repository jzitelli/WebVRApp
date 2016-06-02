var GFXTABLET = ( function () {
    "use strict";

    const NP = 3; // number of stroke points to accumulate before drawing

    function drawStroke (width, height, ctx, points) {
        if (points.length === 0)
            return;
        var start = points[0];
        ctx.beginPath();
        ctx.strokeStyle = 'rgba(0,255,50,0.92)'; //stroke.color;
        ctx.lineWidth = start.p * 10; //normalizeLineSize(stroke.size);
        ctx.moveTo(width * start.x, height * start.y);
        for (var j = 1; j < points.length; j++) {
            var end = points[j];
            ctx.lineTo(width * end.x, height * end.y);
        }
        ctx.stroke();
    }

    return {

        addGfxTablet: function (width, height, downScale) {

            downScale = downScale || 1;
            width /= downScale;
            height /= downScale;

            var canvas = document.createElement('canvas');
            canvas.width = width;
            canvas.height = height;

            var texture = new THREE.Texture(canvas, THREE.UVMapping,
                THREE.ClampToEdgeWrapping, THREE.ClampToEdgeWrapping,
                THREE.LinearFilter, THREE.LinearFilter);

            var paintableMaterial = new THREE.MeshBasicMaterial({color: 0xffffff, map: texture});

            var image = paintableMaterial.map.image;
            var ctx = image.getContext('2d');
            ctx.fillStyle = 'rgb(255, 255, 255)';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            paintableMaterial.map.needsUpdate = true;

            ctx.lineCap = 'round';
            //ctx.lineJoin = stroke.join;
            //ctx.miterLimit = stroke.miterLimit;

            var cursorMaterial = new THREE.MeshBasicMaterial({color: 0xee9966});
            cursorMaterial.transparent = true;
            cursorMaterial.opacity = 0.666;

            var cursor = new THREE.Mesh(new THREE.CircleGeometry(1), cursorMaterial);
            cursor.visible = false;
            cursor.matrixAutoUpdate = false;

            var points = [];

            var socket = new WebSocket('ws://' + document.domain + ':' + location.port + '/gfxtablet');

            socket.onopen = function () {
                console.log("GfxTablet WebSocket opened");
            };

            socket.onerror = function (error) {
                console.log("could not connect to GfxTablet WebSocket");
            };

            socket.onmessage = function (message) {
                var data = JSON.parse(message.data);
                if (data.p > 0) {
                    points.push(data);
                    // circle(canvas.width * data.x, canvas.height * data.y,
                    //     2 + 50*data.p * data.p, '255,0,0', 0.1 + 0.9 * data.p);
                    if (points.length > NP) {
                        drawStroke(width, height, ctx, points);
                        paintableMaterial.map.needsUpdate = true;
                        points.splice(0, NP);
                    }
                }
                if (data.button !== undefined) {
                    // button event
                    if (data.button === 255) { // how to interpret as signed, i.e. -1?
                        if (data.down === 1) {
                            // stylus is in range
                            cursor.visible = true;
                        } else {
                            // stylus is out of range
                            cursor.visible = false;
                        }
                    } else if (data.button === 0) {
                        if (data.down === 0) {
                            // stylus lifted
                            drawStroke(width, height, ctx, points);
                            paintableMaterial.map.needsUpdate = true;
                            points = [];
                            cursor.visible = true;
                        } else {
                            // stylus down
                            cursor.visible = false;
                        }
                    }
                    // else {
                    //     if (data.down === 0) {
                    //         console.log('button ' + data.button + ' released');
                    //     } else {
                    //         console.log('button ' + data.button + ' pressed');
                    //     }
                    // }
                }
                if (cursor.visible) {
                    cursor.position.x = -0.5 + data.x;
                    cursor.position.y =  0.5 - data.y;
                    cursor.updateMatrix();
                }
            };

            return {
                paintableMaterial: paintableMaterial,
                cursor: cursor
            };

        }
    }

} )();
