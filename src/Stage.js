module.exports = ( function () {
    "use strict";

    function Stage() {
        this.hmdCalibrationPose = null;
        this.deskHeight = 29 * 0.0254;
        this.objects = [];

        var vrDisplay;

        if (navigator.getVRDisplays) {
            console.log('checking VRDisplays for stage parameters...');
            navigator.getVRDisplays().then( function (displays) {
                for (var i = 0; i < displays.length; i++) {
                    vrDisplay = displays[i];
                    console.log('%s:\n%s', vrDisplay.deviceName, JSON.stringify(vrDisplay, undefined, 2));
                    if (vrDisplay.stageParameters && vrDisplay.stageParameters.sittingToStandingTransform) {
                        console.log('sittingToStandingTransform:\n' + vrDisplay.stageParameters.sittingToStandingTransform);
                    } else {
                        console.warn('no sittingToStandingTransform provided by the VRDisplay');
                    }
                }
            } );
        } else {
            console.warn('your browser does not support the latest WebVR API');
        }

        this.updateCalibrationPose = function ( pose, t ) {
            if (pose) console.log(pose);
            if (t) console.log(t);
        }.bind(this);

        this.save = function () {
            console.log('saving poses of stage objects...');
            var transforms = {};
            this.objects.forEach( function (object) {
                if (object.name) {
                    transforms[object.name] = {
                        position: object.position.toArray(),
                        quaternion: object.quaternion.toArray(),
                        rotation: object.rotation.toArray()
                    };
                }
            } );
            console.log(transforms);
            return transforms;
        }.bind(this);

        this.load = function (transforms) {
            if (!transforms) return;
            console.log('loading poses of stage objects...');
            this.objects.forEach( function (object) {
                if (object.name && transforms[object.name]) {
                    var transform = transforms[object.name];
                    object.position.fromArray(transform.position);
                    //object.quaternion.fromArray(transform.quaternion);
                    object.quaternion.setFromEuler(object.rotation.fromArray(transform.rotation));
                    object.updateMatrix();
                    object.updateMatrixWorld();
                }
            } );
        }.bind(this);

    }

    return Stage;
} )();
