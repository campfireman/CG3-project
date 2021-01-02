import { Window } from "../window.js";
import { Cloth } from "./Cloth.js";
import * as DAT from "/dat/dat.gui.module.js";
import { OrbitControls } from "/jsm/controls/OrbitControls.js";
import * as THREE from "/three/three.module.js";

/**
 * TODO
 *  licht                       Ture done
 *  gui                         Albert done
 *  controls (tuch anheben)     Albert done
 *  fixed points (gui)          Albert done
 *  triangle mesh (coloring)    Albert done (coloring left)
 *  shear bend springs          Ture
 *  integrating                 Ture, Albert done
 *  intergrator switching       Ture
 *  airresistance gui           Albert done
 *  adaptive steps              Albert done
 *  spring visualizing          Ture
 *  wind + gui                  Ture
 */

const CLOTH_SIZE = 20;
const CLOTH_TO_FLOOR_DISTANCE = 0.5;
const PARTICLE_DISTANCE = 0.1;

const LIGHT_COLOR = 0xffffff;
const AMBIENT_LIGHT_INTENSITY = 0.2;
const POINT_LIGHT_INTENSITY = 10;
const POINT_LIGHT_DISTANCE = 100;

class ClothWindow extends Window {
    constructor(renderer) {
        super(renderer);

        this.guiOptions = {
            particle_distance: PARTICLE_DISTANCE,
            particle_mass: 1.0,
            toughness: 1000,

            fix_left_corner: true,
            fix_right_corner: true,

            gravity: 2,
            air_resistance: 10,

            integrator: 0,
            adaptive_step_size: true,
            max_error: 2,
            max_steps_per_frame: 13,
            current_steps_per_frame: 0,
            current_step_size: 0
        };

        this.gui = new DAT.GUI();

        let clothFolder = this.gui.addFolder("cloth");
        //clothFolder.add(this.guiOptions, "particle_distance", 0.001, 1.0).step(0.001);
        clothFolder.add(this.guiOptions, "particle_mass", 0.1, 10).step(0.001);
        clothFolder.add(this.guiOptions, "toughness", 1, 30000).step(0.001);

        clothFolder.add(this.guiOptions, "fix_left_corner")
        .onChange((leftCornerFixed) => {
            if(leftCornerFixed) {
                this.cloth.setParticlePos(0, CLOTH_SIZE-1, this.getLeftCornerPos());
                this.cloth.setAnchorParticle(0, CLOTH_SIZE-1);
            } else {
                this.cloth.unsetAnchorParticle(0, CLOTH_SIZE-1);
            }
        });
        clothFolder.add(this.guiOptions, "fix_right_corner")
        .onChange((rightCornerFixed) => {
            if(rightCornerFixed) {
                this.cloth.setParticlePos(CLOTH_SIZE-1, CLOTH_SIZE-1, this.getRightCornerPos());
                this.cloth.setAnchorParticle(CLOTH_SIZE-1, CLOTH_SIZE-1);
            } else {
                this.cloth.unsetAnchorParticle(CLOTH_SIZE-1, CLOTH_SIZE-1);
            }
        });
        clothFolder.open();

        let envFolder = this.gui.addFolder("environment");
        envFolder.add(this.guiOptions, "gravity", 1, 100);
        envFolder.add(this.guiOptions, "air_resistance", 0, 100);
        envFolder.open();
        
        let generalFolder = this.gui.addFolder("general");
        generalFolder.add(this.guiOptions, "integrator", {
            euler: 0,
            runge_kutta: 1,
        }).onChange((newIntegratorIndex) => {
            this.cloth.setIntegrator(newIntegratorIndex);
        });
        generalFolder.add(this.guiOptions, "adaptive_step_size");
        generalFolder.add(this.guiOptions, "max_error", 0.1, 20);
        generalFolder.add(this.guiOptions, "max_steps_per_frame", 3, 20);
        generalFolder.add(this.guiOptions, "current_steps_per_frame");
        generalFolder.add(this.guiOptions, "current_step_size").step(0.0001);
        generalFolder.open();

        this.scene = new THREE.Scene();
        this.scene.add(new THREE.GridHelper(50, 20));

        // lighting
        this.pointLight = new THREE.PointLight(LIGHT_COLOR , POINT_LIGHT_INTENSITY, POINT_LIGHT_DISTANCE );
        this.pointLight.position.set( 2, 3, 2 );
        this.scene.add( this.pointLight );

        this.ambientLight = new THREE.AmbientLight(LIGHT_COLOR, AMBIENT_LIGHT_INTENSITY);
        this.scene.add(this.ambientLight);

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

        let clothPos = new THREE.Vector3(-CLOTH_SIZE * this.guiOptions.particle_distance / 2, 0.5, 0);
        this.cloth = new Cloth(this.scene, this.camera, renderer, this.orbitControls, this.guiOptions, generalFolder, CLOTH_SIZE, CLOTH_SIZE, clothPos, this.guiOptions.particle_distance);
        this.cloth.setParticlePos(CLOTH_SIZE-1, CLOTH_SIZE-1, this.getRightCornerPos());
        this.cloth.setAnchorParticle(CLOTH_SIZE-1, CLOTH_SIZE-1);
        this.cloth.setParticlePos(0, CLOTH_SIZE-1, this.getLeftCornerPos());
        this.cloth.setAnchorParticle(0, CLOTH_SIZE-1);
    }

    update(time) {
        this.renderer.clearDepth();

        this.cloth.update(time);
        
    }

    getLeftCornerPos() {
        return new THREE.Vector3(-CLOTH_SIZE * this.guiOptions.particle_distance / 2, CLOTH_SIZE * this.guiOptions.particle_distance + CLOTH_TO_FLOOR_DISTANCE, 0);
    }

    getRightCornerPos() {
        return new THREE.Vector3(CLOTH_SIZE * this.guiOptions.particle_distance / 2, CLOTH_SIZE * this.guiOptions.particle_distance + CLOTH_TO_FLOOR_DISTANCE, 0);
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

