module.exports = ( function () {
    "use strict";

    function Stage() {
        this.hmdCalibrationPose = null;
        this.deskHeight = 29 * 0.0254;
        this.objects = [];

        var vrDisplay;

        navigator.getVRDisplays().then( function (displays) {
            for (var i = 0; i < displays.length; i++) {
                vrDisplay = displays[i];
                console.log('vrDisplay:\n' + vrDisplay);
                if (vrDisplay.stageParameters && vrDisplay.stageParameters.sittingToStandingTransform) {
                    console.log('sittingToStandingTransform:\n' + vrDisplay.stageParameters.sittingToStandingTransform);
                } else {
                    console.warn('no sittingToStandingTransform provided by the VRDisplay');
                }
            }
        } );

        this.updateCalibrationPose = function ( pose, t ) {
            if (pose) console.log(pose);
            if (t) console.log(t);
        }.bind(this);

        this.save = function () {
            // console.log('saving poses of stage objects');
            var transforms = {};
            this.objects.forEach( function (object) {
                if (object.name) {
                    transforms[object.name] = {
                        position: object.position.toArray(),
                        quaternion: object.quaternion.toArray()
                    };
                    console.log(transforms);
                }
            } );
            return transforms;
        }.bind(this);

        this.load = function (transforms) {
            console.log('loading poses of stage objects...');
            if (!transforms) return;
            this.objects.forEach( function (object) {
                if (object.name && transforms[object.name]) {
                    var transform = transforms[object.name];
                    object.position.fromArray(transform.position);
                    object.quaternion.fromArray(transform.quaternion);
                    object.updateMatrix();
                    object.updateMatrixWorld();
                }
            } );
        }.bind(this);

    }

    return Stage;
} )();
