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

        this.save = function (key) {
            // console.log('saving poses of stage objects');
            key = key || 'StagePoses';
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
            window.localStorage[key] = JSON.stringify(transforms);
        }.bind(this);

        this.load = function (key) {
            console.log('loading poses of stage objects...');
            key = key || 'StagePoses';
            if (!window.localStorage[key]) return;
            var transforms = JSON.parse(window.localStorage[key]);
            if (!transforms) return;
            this.objects.forEach( function (object) {
                if (object.name && transforms[object.name]) {
                    console.log(object.name);
                    var transform = transforms[object.name];
                    console.log(transform.position);
                    console.log(transform.quaternion);
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
