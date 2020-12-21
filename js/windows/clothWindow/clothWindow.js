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
 *  triangle mesh (coloring)    
 *  shear bend springs          Ture done
 *  integrating                 Ture, Albert
 *  adaptive steps
 *  spring visualizing          Ture done
 *  wind
 */

const CLOTH_SIZE = 20;
const CLOTH_TO_FLOOR_DISTANCE = 0.5;

const LIGHT_COLOR = 0xff0000;
const AMBIENT_LIGHT_INTENSITY = 0.2;
const POINT_LIGHT_INTENSITY = 1;
const POINT_LIGHT_DISTANCE = 100;

class ClothWindow extends Window {
    constructor(renderer) {
        super(renderer);

        this.guiOptions = {
            particle_distance:  0.1,
            particle_mass: 1.0,
            toughness: 200,

            fix_left_corner: true,
            fix_right_corner: true,

            gravity: 2,
            integrator: 0,
        }

        this.gui = new DAT.GUI();

        let clothFolder = this.gui.addFolder("cloth");
        clothFolder.add(this.guiOptions, "particle_distance", 0.001, 1.0)
        .step(0.001)
        .onChange((newDistance) => {
            this.cloth.setParticleDistance(newDistance);
        });
        clothFolder.add(this.guiOptions, "particle_mass", 0.1, 10)
        .step(0.001)
        .onChange((newMass) => {
            this.cloth.setAllParticleMass(newMass);
        });
        clothFolder.add(this.guiOptions, "toughness", 1, 1000)
        .step(0.001)
        .onChange((newToughness) => {
            this.cloth.setToughness(newToughness);
        });

        clothFolder.add(this.guiOptions, "fix_left_corner")
        .onChange((leftCornerFixed) => {
            if(leftCornerFixed) {
                this.cloth.setParticlePos(0, CLOTH_SIZE-1, this.getLeftCornerPos());
                this.cloth.setAnchorParticle(0, CLOTH_SIZE-1);
            } else {
                this.cloth.setParticleMass(0, CLOTH_SIZE-1, this.guiOptions.particle_mass);
            }
        });
        clothFolder.add(this.guiOptions, "fix_right_corner")
        .onChange((rightCornerFixed) => {
            if(rightCornerFixed) {
                this.cloth.setParticlePos(CLOTH_SIZE-1, CLOTH_SIZE-1, this.getRightCornerPos());
                this.cloth.setAnchorParticle(CLOTH_SIZE-1, CLOTH_SIZE-1);
            } else {
                this.cloth.setParticleMass(CLOTH_SIZE-1, CLOTH_SIZE-1, this.guiOptions.particle_mass);
            }
        });
        clothFolder.open();

        let envFolder = this.gui.addFolder("environment");
        envFolder.add(this.guiOptions, "gravity", 1, 100);
        envFolder.open();
        
        let generalFolder = this.gui.addFolder("general");
        generalFolder.add(this.guiOptions, "integrator", {
            euler: 0,
            runge_kutta: 1,
        }).onChange((newIntegratorIndex) => {
            this.cloth.setIntegrator(newIntegratorIndex);
        })
        generalFolder.open();
        this.scene = new THREE.Scene();
        this.scene.add(new THREE.GridHelper(50, 20));

        // lighting
        this.pointLight = new THREE.PointLight(LIGHT_COLOR , POINT_LIGHT_INTENSITY, POINT_LIGHT_DISTANCE );
        this.pointLight.position.set( 0, 10, 0 );
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

        this.cloth = new Cloth(this.scene, this.camera, renderer, this.orbitControls, this.guiOptions, CLOTH_SIZE, CLOTH_SIZE, new THREE.Vector3(-CLOTH_SIZE * this.guiOptions.particle_distance / 2, 0.5, 0), this.guiOptions.particle_distance, this.guiOptions.particle_mass, this.guiOptions.toughness);
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

