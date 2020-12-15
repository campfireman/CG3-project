import * as THREE from "/three/three.module.js";
import * as DAT from "/dat/dat.gui.module.js";

import { OrbitControls } from "/jsm/controls/OrbitControls.js";

import { Window } from "../window.js";

var guiOptions = {
    animationSpeed: 0.0005
}

class ClothWindow extends Window {
    constructor(renderer) {
        super(renderer);

        this.gui = new DAT.GUI();

        var windowFolder = this.gui.addFolder("animation");
		windowFolder.add(guiOptions, "animationSpeed", 0.00001, 0.001);

        windowFolder.open();
        
        this.scene = new THREE.Scene();
        this.scene.add(new THREE.GridHelper(50, 20));

        this.camera = new THREE.PerspectiveCamera(
			75,
			window.innerWidth / window.innerHeight,
			0.1,
			1000
        );
        this.camera.position.z = 5;
        
        this.orbitControls = new OrbitControls(this.camera, renderer.domElement);
        this.orbitControls.update();
        this.orbitControls.enabled = true;

    }

    update(time) {
        this.renderer.clearDepth();
    }

    getScene() {
        return this.scene;
    }

    getCamera() {
        return this.camera;
    }

    getGUI() {
        return this.gui;
    }

}

export { ClothWindow };