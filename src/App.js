window.YAWVRB = window.YAWVRB || {};

YAWVRB.App = function (scene, config, rendererOptions) {
    "use strict";
    this.scene = scene;

    config = config || {};

    rendererOptions = rendererOptions || {};

    this.renderer = new THREE.WebGLRenderer(rendererOptions);
    var domElement = this.renderer.domElement;

    if (!rendererOptions.canvas) {
        document.body.appendChild(domElement);
        domElement.id = 'webgl-canvas';
    }

    var devicePixelRatio = config.devicePixelRatio || window.devicePixelRatio;
    this.renderer.setPixelRatio(devicePixelRatio);
    this.renderer.setSize(window.innerWidth, window.innerHeight);

    this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    this.camera.matrixAutoUpdate = true;

    this.vrEffect = new THREE.VREffect(this.renderer, function(error) { throw new Error(error); });

    this.vrControls = new THREE.VRControls(this.camera, function(error) { throw new Error(error); });
    this.vrControlsEnabled = true;

    // public methods:

    this.render = function () {
        if (this.vrControlsEnabled) this.vrControls.update();
        this.vrEffect.render(this.scene, this.camera);
    }.bind(this);

    this.toggleVRControls = function () {
        if (this.vrControlsEnabled) {
            this.vrControlsEnabled = false;
            this.camera.position.set(0, 0, 0);
            this.camera.quaternion.set(0, 0, 0, 1);
            this.camera.updateMatrixWorld();
        } else {
            this.vrControlsEnabled = true;
        }
    }.bind(this);

    this.resetVRSensor = ( function () {
        var onResetVRSensor = config.onResetVRSensor;
        var lastPosition = new THREE.Vector3();
        return function () {
            if (this.vrControlsEnabled) {
                this.vrControls.update(true);
                lastPosition.copy(this.camera.position);
                var lastRotation = this.camera.rotation.y;
                this.vrControls.resetSensor();
                this.vrControls.update(true);
                if (onResetVRSensor) {
                    onResetVRSensor(lastRotation, lastPosition);
                }
            }
        };
    } )().bind(this);

    this.toggleFullscreen = function (options) {
        if (!isFullscreen()) {
            requestFullscreen(options);
            if (!useDeprecatedWebVR) requestPointerLock();
        } else {
            exitFullscreen();
            if (!useDeprecatedWebVR) releasePointerLock();
        }
    };

    this.toggleWireframe = ( function () {
        var wireframeMaterial = new THREE.MeshBasicMaterial({color: 0xeeddaa, wireframe: true});
        return function () {
            if (this.scene.overrideMaterial === wireframeMaterial) {
                this.scene.overrideMaterial = null;
            } else {
                this.scene.overrideMaterial = wireframeMaterial;
            }
        };
    } )().bind(this);

    this.toggleNormalMaterial = ( function () {
        var normalMaterial = new THREE.MeshNormalMaterial();
        return function () {
            if (this.scene.overrideMaterial === normalMaterial) {
                this.scene.overrideMaterial = null;
            } else {
                this.scene.overrideMaterial = normalMaterial;
            }
        };
    } )().bind(this);

    // WebVR setup

    this.vrDisplay = null;
    var isPresenting = false;
    var useDeprecatedWebVR = false;
    var vrDisplay;

    this.toggleVR = function () {
        if (!isPresenting) {
            this.vrEffect.requestPresent().then( function () {
                isPresenting = true;
                if (!useDeprecatedWebVR && vrDisplay.capabilities.canPresent && vrDisplay.capabilities.hasExternalDisplay) {
                    presentingElement.style.display = "block";
                    requestPointerLock();
                }
            } );
        } else {
            this.vrEffect.exitPresent().then( function () {
                isPresenting = false;
                if (!useDeprecatedWebVR && vrDisplay.capabilities.canPresent && vrDisplay.capabilities.hasExternalDisplay) {
                    presentingElement.style.display = "none";
                    releasePointerLock()
                }
            } );
        }
    }.bind(this);

    // configure VR presenting element (for non-mirrored usage)

    var presentingElement = document.createElement('div');
    presentingElement.style.position = "absolute";
    presentingElement.style.width = "100%";
    presentingElement.style.height = "100%";
    presentingElement.style.left = '0';
    presentingElement.style.top = '0';
    presentingElement.style.paddingTop = '24vh';
    presentingElement.style.color = '#993';
    presentingElement.style.backgroundColor = '#433';
    presentingElement.style['z-index'] = 1;
    presentingElement.style['text-align'] = 'center';
    presentingElement.style.display = "none";
    presentingElement.innerHTML = "<h2>VR CONTENT IS BEING PRESENTED ON THE VR DISPLAY</h2><h2>CLICK INSIDE THIS WINDOW TO RETURN TO NORMAL</h2>";
    document.body.appendChild(presentingElement);
    presentingElement.addEventListener('click', this.toggleVR, false);

    // configure VR button

    var vrButton = config.vrButton;
    if (!vrButton) {
        // no button was specified, so create one
        vrButton = document.createElement('button');
        vrButton.id = 'vrButton';
        vrButton.innerHTML = 'TOGGLE VR';
        vrButton.style.position = 'absolute';
        vrButton.style.right = 0;
        vrButton.style.bottom = '40px';
        vrButton.style.margin = '0.75vh';
        vrButton.style.padding = '0.75vh';
    }
    vrButton.addEventListener('click', this.toggleVR, false);

    if (navigator.getVRDisplays) {

        navigator.getVRDisplays().then( function (displays) {

            if (displays.length > 0) {

                vrDisplay = displays[0];
                this.vrDisplay = vrDisplay;

                if (!config.vrButton) document.body.appendChild(vrButton);

            }

        }.bind(this) );

    } else if (navigator.getVRDevices) {

        console.warn('using the deprecated WebVR API');
        useDeprecatedWebVR = true;
        navigator.getVRDevices().then( function (devices) {

            if (devices.length > 0) {

                if (!config.vrButton) document.body.appendChild(vrButton);

            }

        }.bind(this) );

    } else {

        console.error('WebVR API is not supported');

    }

    // configure fullscreen button:

    var fsButton = config.fsButton;
    if (!fsButton) {
        // no button was specified, so create one
        fsButton = document.createElement('button');
        fsButton.id = 'fsButton';
        fsButton.innerHTML = 'TOGGLE FULLSCREEN';
        fsButton.style.position = 'absolute';
        fsButton.style.right = 0;
        fsButton.style.bottom = 0;
        fsButton.style.margin = '0.75vh';
        fsButton.style.padding = '0.75vh';
        document.body.appendChild(fsButton);
    }
    fsButton.addEventListener('click', this.toggleFullscreen, false);

    // resize, fullscreen/VR listener functions and other useful functions:

    var onResize = function () {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }.bind(this);

    var onFullscreenChange = function () {
        onResize();
        if (useDeprecatedWebVR) {
            if (isFullscreen()) {
                requestPointerLock();
            } else {
                releasePointerLock();
            }
        }
    };

    function isFullscreen() {
        return !!(document.fullscreenElement || document.webkitFullscreenElement || document.mozFullScreenElement);
    }

    function requestFullscreen(options) {
        if (domElement.requestFullscreen) {
            domElement.requestFullscreen(options);
        } else if (domElement.msRequestFullscreen) {
            domElement.msRequestFullscreen();
        } else if (domElement.mozRequestFullScreen) {
            domElement.mozRequestFullScreen(options);
        } else if (domElement.webkitRequestFullscreen) {
            domElement.webkitRequestFullscreen();
        } else {
            throw 'Fullscreen API is not supported';
        }
    }

    function exitFullscreen() {
        if (document.exitFullscreen) {
            document.exitFullscreen();
        } else if (document.mozCancelFullScreen) {
            document.mozCancelFullScreen();
        } else if (document.webkitExitFullscreen) {
            document.webkitExitFullscreen();
        } else {
            console.warn('exitFullscreen is not supported');
        }
    }

    function requestPointerLock() {
        if (domElement.requestPointerLock) {
            domElement.requestPointerLock();
        } else if (domElement.mozRequestPointerLock) {
            domElement.mozRequestPointerLock();
        } else if (domElement.webkitRequestPointerLock) {
            domElement.webkitRequestPointerLock();
        }
    }

    function releasePointerLock() {
        if (document.exitPointerLock) {
            document.exitPointerLock();
        } else if (document.mozExitPointerLock) {
            document.mozExitPointerLock();
        } else if (document.webkitExitPointerLock) {
            document.webkitExitPointerLock();
        }
    }

    var beforeUnload = function () {
        // stop VR presenting when exiting the app
        if (isPresenting) {
            this.vrEffect.exitPresent();
        }
    }.bind(this);

    // add standard event listeners

    window.addEventListener('resize', onResize, false);
    document.addEventListener(domElement.mozRequestFullScreen ? 'mozfullscreenchange' : 'webkitfullscreenchange',
        onFullscreenChange, false);
    window.addEventListener("beforeunload", beforeUnload, false);

}
