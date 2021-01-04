import { ClothState, initMassArray, setInfiniteMass } from "./ClothState.js";
import * as INTEGRATORS from "./Intergrators.js";
import { TransformControls } from '/jsm/controls/TransformControls.js';
import * as THREE from "/three/three.module.js";

const INTEGRATOR_LIST = [
    INTEGRATORS.integrateEuler,
    INTEGRATORS.integrateRungeKutta
];

const sphereGeometry = new THREE.SphereGeometry(0.03, 32, 32);
const sphereMaterial = new THREE.MeshPhongMaterial({ color: 0xcf1120 });

class Cloth {

    constructor(scene, camera, renderer, orbitControl, options, width, height, pos, partDistance, partMass, toughness) {
        this.options = options;
        this.width = width;
        this.height = height;
        this.scene = scene

        this.partDistance = partDistance;
        this.toughness = toughness;

        this.particles = [];
        this.selectionGroup = [];

        this.integrator = INTEGRATOR_LIST[options.integrator];

        this.clothState = new ClothState(width, height, options);

        for(let x = 0; x < width; x++) {
            this.particles.push([]);
            for(let y = 0; y < height; y++) {
                let partPos = pos.clone().add(new THREE.Vector3(x * partDistance, y * partDistance, y * partDistance / 2 /*Math.random() / 1000 - 0.001*/));

                let sphere = new THREE.Mesh(sphereGeometry, sphereMaterial);
                sphere.position.x = partPos.x;
                sphere.position.y = partPos.y;
                sphere.position.z = partPos.z;
                sphere.clothPosX = x;
                sphere.clothPosY = y;
                scene.add(sphere);

                this.particles[x].push(sphere);
                this.clothState.positions[x][y] = partPos.clone();

                this.selectionGroup.push(sphere);
            }
        }

        initMassArray(width, height);

        this.initControls(scene, camera, renderer, orbitControl);

    }

    initControls(scene, camera, renderer, orbitControl) {
        this.justMoved = false;

        this.control = new TransformControls(camera, renderer.domElement);
		this.control.addEventListener("dragging-changed", (event) => {
			orbitControl.enabled = !event.value;
        });

		scene.add(this.control);

		renderer.domElement.addEventListener("click", (ev) => {
			if (this.justMoved) {
				this.justMoved = false;
				return;
			}

			let x = (ev.clientX / window.innerWidth) * 2 - 1;
			let y = - (ev.clientY / window.innerHeight) * 2 + 1;
			let mouseVector = new THREE.Vector2(x, y);

			let raycaster = new THREE.Raycaster();

			raycaster.setFromCamera(mouseVector, camera);
            let intersects = raycaster.intersectObjects( scene.children );

            let selectedPoint;
            for(let i = 0; i < intersects.length; i++) {
                if(intersects[i].object.type == "Mesh") {
                    selectedPoint = intersects[i].object;
                }
            }
            if(!selectedPoint) {
                if(this.control.object) {
                    this.unsetAnchorParticle(this.control.object.clothPosX, this.control.object.clothPosY);
                }
                this.control.detach();
                return;
            }
            this.setAnchorParticle(selectedPoint.clothPosX, selectedPoint.clothPosY);
			this.control.attach(selectedPoint);

        }, true);
        
        this.control.addEventListener("mouseUp", (ev) => {
			this.justMoved = true;
		});
    }

    update(dt) {
        this.updateControls();

        dt = dt / 1000;
        let numH = 15;

        for(let miniStep = 0; miniStep < numH; miniStep++) {
            this.integrator(this.clothState, dt / numH);
        }

        for(let x = 0; x < this.width; x++) {
            for(let y = 0; y < this.height; y++) {
                this.particles[x][y].position.x = this.clothState.positions[x][y].x;
                this.particles[x][y].position.y = this.clothState.positions[x][y].y;
                this.particles[x][y].position.z = this.clothState.positions[x][y].z;
            }
        }

    }

    updateControls() {
        if(this.control.dragging) {
            let newPos = this.control.object.position;
            let targetX = this.control.object.clothPosX;
            let targetY = this.control.object.clothPosY;
            this.clothState.positions[targetX][targetY].x = newPos.x;
            this.clothState.positions[targetX][targetY].y = newPos.y;
            this.clothState.positions[targetX][targetY].z = newPos.z;
        }
    }

    setParticlePos(x, y, pos) {
        this.clothState.positions[x][y].x = pos.x;
        this.clothState.positions[x][y].y = pos.y;
        this.clothState.positions[x][y].z = pos.z;
    }

    setAnchorParticle(x, y) {
        setInfiniteMass(x, y, true);
        this.clothState.velocities[x][y].x = 0;
        this.clothState.velocities[x][y].y = 0;
        this.clothState.velocities[x][y].z = 0;
    }

    unsetAnchorParticle(x, y) {
        setInfiniteMass(x, y, false);
    }

    setIntegrator(index) {
        this.integrator = INTEGRATOR_LIST[index];
    }

}

export { Cloth };
