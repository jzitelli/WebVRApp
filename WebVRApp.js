function WebVRApp(scene, config, rendererOptions) {
    "use strict";
    this.scene = scene;

    config = config || {};

    this.renderer = new THREE.WebGLRenderer(rendererOptions);
    var domElement = this.renderer.domElement;

    if (!rendererOptions.canvas) {
        document.body.appendChild(domElement);
        domElement.id = 'webgl-canvas';
    }

    var devicePixelRatio = config.devicePixelRatio || window.devicePixelRatio;
    this.renderer.setPixelRatio(devicePixelRatio);
    this.renderer.setSize(window.innerWidth, window.innerHeight);

    if (config.useShadowMap) {
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = config.shadowMapType || this.renderer.shadowMap.type;
    }

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
    } )();

    this.toggleFullscreen = function (options) {
        if (!isFullscreen()) {
            requestFullscreen(options);
        } else {
            exitFullscreen();
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
    } )();

    this.toggleNormalMaterial = ( function () {
        var normalMaterial = new THREE.MeshNormalMaterial();
        return function () {
            if (this.scene.overrideMaterial === normalMaterial) {
                this.scene.overrideMaterial = null;
            } else {
                this.scene.overrideMaterial = normalMaterial;
            }
        };
    } )();

    // WebVR setup

    var supportsWebVR = true;
    var vrDisplay;

    var onVRClick = function () {
        if (!isPresenting) {
            isRequestingPresent = true;
            try {
                this.toggleFullscreen();
            } catch (error) {
                console.error(error);
                isRequestingPresent = false;
            }
        } else {
            this.vrEffect.exitPresent().then( function () {
                isPresenting = false;
                this.renderer.setSize(window.innerWidth, window.innerHeight);
            }.bind(this) );
        }
    }.bind(this);

    if (navigator.getVRDisplays) {

        navigator.getVRDisplays().then( function (displays) {

            if (displays.length > 0) {
                vrDisplay = displays[0];
                this.vrDisplay = vrDisplay;
                if (vrDisplay.capabilities.canPresent) {

                    // configure VR button:
                    var vrButton = config.vrButton;
                    if (!vrButton) {
                        // no button was specified, so create one
                        vrButton = document.createElement('button');
                        vrButton.id = 'vrButton';
                        vrButton.innerHTML = 'ENTER VR';
                        vrButton.style.position = 'absolute';
                        vrButton.style.right = 0;
                        vrButton.style.bottom = '40px';
                        vrButton.style.margin = '0.75vh';
                        vrButton.style.padding = '0.75vh';
                        document.body.appendChild(vrButton);
                    }

                    vrButton.addEventListener('click', onVRClick, false);

                }
            }

        }.bind(this) );

    } /* else if (navigator.getVRDevices) {

        console.warn('using the deprecated WebVR API');
        navigator.getVRDevices().then( function (devices) {

            if (devices.length > 0) {
                var onClick = function () {
                    if (!isPresenting) {
                        this.vrEffect.requestPresent().then( function () {
                            isPresenting = true;
                        } );
                    } else {
                        this.vrEffect.exitPresent().then( function () {
                            isPresenting = false;
                        } );
                    }
                }.bind(this);

                vrButton.addEventListener('click', onClick, false);
            }

        }.bind(this) );

    } */ else {

        supportsWebVR = false;
        console.error('WebVR API is not supported');

    }

    // configure fullscreen button:

    var fsButton = config.fsButton;
    if (!fsButton) {
        // no button was specified, so create one
        fsButton = document.createElement('button');
        fsButton.id = 'fsButton';
        fsButton.innerHTML = 'FULLSCREEN';
        fsButton.style.position = 'absolute';
        fsButton.style.right = 0;
        fsButton.style.bottom = 0;
        fsButton.style.margin = '0.75vh';
        fsButton.style.padding = '0.75vh';
        document.body.appendChild(fsButton);
    }
    fsButton.addEventListener('click', this.toggleFullscreen.bind(this), false);

    // resize / fullscreen / VR listeners / helper stuff:

    var onResize = function () {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }.bind(this);

    window.addEventListener('resize', onResize, false);

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

    var isRequestingPresent = false;

    var isPresenting = false;

    var onFullscreenChange = function () {

        if (isFullscreen()) {
            requestPointerLock();
        } else {
            releasePointerLock();
        }

        if (isRequestingPresent) {
            isRequestingPresent = false;
            if (isFullscreen() && !isPresenting) {
                this.vrEffect.requestPresent().then( function () {
                    isPresenting = true;
                } ).catch( function (error) {
                    console.error(error);
                    vrButton.disabled = true;
                    vrButton.removeEventListener('click', onVRClick);
                } );
            } else if (!isFullscreen()) {
                console.error('requestPresent was not performed because fullscreen could not first be entered');
            }
        } else {
            if (!isFullscreen() && isPresenting) {
                this.vrEffect.exitPresent().then( function () {
                    isPresenting = false;
                    onResize();
                } );
            }
        }

    }.bind(this);

    document.addEventListener(domElement.mozRequestFullScreen ? 'mozfullscreenchange' : 'webkitfullscreenchange',
        onFullscreenChange, false);

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

    // stop VR presenting when exiting the app:
    var beforeUnload = function () {
        if (isPresenting) {
            this.vrEffect.exitPresent();
        }
    }.bind(this);
    window.addEventListener("beforeunload", beforeUnload, false);

}
