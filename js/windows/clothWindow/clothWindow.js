import * as THREE from "/three/three.module.js";
import * as DAT from "/dat/dat.gui.module.js";

import { OrbitControls } from "/jsm/controls/OrbitControls.js";

import { Window } from "../window.js";
import { Cloth } from "./Cloth.js";

var guiOptions = {
    animationSpeed: 0.0005
}

/**
 * TODO
 *  licht                       Ture
 *  gui                         Albert
 *  controls (tuch anheben)     Albert
 *  fixed points (gui)          Albert
 *  triangle mesh (coloring)    
 *  shear bend springs          Ture
 *  more intergrtors            Ture
 *  adaptive steps
 *  spring visualizing
 *  wind
 */

class ClothWindow extends Window {
    constructor(renderer) {
        super(renderer);

        this.gui = new DAT.GUI();

        var windowFolder = this.gui.addFolder("animation");
		windowFolder.add(guiOptions, "animationSpeed", 0.00001, 0.001);

        windowFolder.open();
        
        this.scene = new THREE.Scene();
        this.scene.add(new THREE.GridHelper(50, 20));

        const light = new THREE.PointLight( 0xff0000, 1, 100 );
        light.position.set( 0, 10, 0 );
        this.scene.add( light );

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

        let size = 50;
        let partDistance = 0.1;
        let partMass = 1.0;
        let toughness = 10;

        this.cloth = new Cloth(this.scene, size, size, new THREE.Vector3(-size * partDistance / 2, 0.5, 0), partDistance, partMass, toughness);
    }

    update(time) {
        this.renderer.clearDepth();

        this.cloth.applyForceUniform(new THREE.Vector3(0, -10, 0));

        this.cloth.update(time);
        
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