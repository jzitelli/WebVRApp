function WebVRApp(scene, config) {
    "use strict";
    this.scene = scene;

    config = config || {};
    var rendererOptions = config.rendererOptions || {};

    this.renderer = new THREE.WebGLRenderer(rendererOptions);
    var domElement = this.renderer.domElement;
    if (rendererOptions.canvas) {
        domElement = rendererOptions.canvas;
    } else {
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
        }.bind(this);
    } )();

    this.toggleWireframe = ( function () {
        var wireframeMaterial = new THREE.MeshBasicMaterial({color: 0xeeddaa, wireframe: true});
        return function () {
            if (this.scene.overrideMaterial) {
                this.scene.overrideMaterial = null;
            } else {
                this.scene.overrideMaterial = wireframeMaterial;
            }
        }.bind(this);
    } )();

    this.toggleFullscreen = function (options) {
        if (!isFullscreen()) {
            requestFullscreen(options);
        } else {
            exitFullscreen();
        }
    };

    // resize / fullscreen / VR presenting stuff:

    var onResize = function () {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }.bind(this);

    window.addEventListener('resize', onResize, false);

    function isFullscreen() {
        return !!(document.FullscreenElement || document.webkitFullscreenElement || document.mozFullScreenElement);
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

    var fullscreenchange = domElement.mozRequestFullScreen ? 'mozfullscreenchange' : 'webkitfullscreenchange';

    var vrButton = document.createElement('button');
    vrButton.innerHTML = 'ENTER VR';
    vrButton.style.position = 'absolute';
    vrButton.style.right = 0;
    vrButton.style.bottom = 0;
    vrButton.style.margin = '10px';
    vrButton.style.padding = '10px';
    vrButton.style.background = 0x222222;
    vrButton.style['text-color'] = 0xffffff;

    var onFullscreenChange = function () {
        if (isRequestingPresent) {
            isRequestingPresent = false;
            if (isFullscreen() && !isPresenting) {
                this.vrEffect.requestPresent().then( function () {
                    isPresenting = true;
                    vrButton.innerHTML = 'EXIT VR';
                } ).catch( function (error) {
                    console.error(error);
                    vrButton.innerHTML = 'VR ERROR!';
                    vrButton.style.background = 0x992222;
                    vrButton.removeEventListener('click', onClick);
                } );
            } else if (!isFullscreen()) {
                console.error('requestPresent was not performed because fullscreen could not be entered');
            }
        } else {
            if (!isFullscreen() && isPresenting) {
                this.vrEffect.exitPresent().then( function () {
                    isPresenting = false;
                    vrButton.innerHTML = 'ENTER VR';
                    onResize();
                }.bind(this) );
            }
        }
    }.bind(this);

    document.addEventListener(fullscreenchange, onFullscreenChange, false);

    var onClick;
    if (window.VRDisplay) {
        onClick = function () {
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
                    vrButton.innerHTML = 'ENTER VR';
                    this.renderer.setSize(window.innerWidth, window.innerHeight);
                }.bind(this) );
            }
        }.bind(this);
    } else if (window.HMDVRDevice) {
        // deprecated WebVR API
        onClick = function () {
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
    } else {
        throw new Error('WebVR API is not supported');
    }

    vrButton.addEventListener('click', onClick, false);

    document.body.appendChild(vrButton);

    var beforeUnload = function () {
        if (isPresenting) {
            this.vrEffect.exitPresent();
        }
    }.bind(this);

    window.addEventListener("beforeunload", beforeUnload, false);


    // TODO
    // renderer.domElement.requestPointerLock = renderer.domElement.requestPointerLock || renderer.domElement.mozRequestPointerLock || renderer.domElement.webkitRequestPointerLock;
    // function requestPointerLock() {
    //     if (renderer.domElement.requestPointerLock) {
    //         renderer.domElement.requestPointerLock();
    //     }
    // }
    // function releasePointerLock() {
    //     document.exitPointerLock = document.exitPointerLock || document.mozExitPointerLock || document.webkitExitPointerLock;
    //     if (document.exitPointerLock) {
    //         document.exitPointerLock();
    //     }
    // }
    // document.addEventListener(fullscreenchange, function ( event ) {
    //     if (this.vrManager.isVRMode()) {
    //         this.vrControls.enabled = true;
    //     }
    //     var fullscreen = !(document.webkitFullscreenElement === null || document.mozFullScreenElement === null);
    //     if (!fullscreen) {
    //         releasePointerLock();
    //     } else {
    //         requestPointerLock();
    //     }
    // }.bind(this));

}
