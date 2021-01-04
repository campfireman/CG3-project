import { ClothState, distance, initMassArray, setInfiniteMass } from "./ClothState.js";
import * as INTEGRATORS from "./Intergrators.js";
import { ClothVisulization } from "./ClothVisulization.js";
import { TransformControls } from '/jsm/controls/TransformControls.js';
import * as THREE from "/three/three.module.js";

const INTEGRATOR_LIST = [
    {
        integrator: INTEGRATORS.integrateEuler,
        order: 2
    },
    {
        integrator: INTEGRATORS.integrateRungeKutta,
        order: 5
    }
];

const sphereGeometry = new THREE.SphereGeometry(0.06, 32, 32);
const sphereMaterial = new THREE.MeshPhongMaterial({ color: 0xcf1120 });

class Cloth {

    constructor(scene, camera, renderer, orbitControl, options, generalGui, width, height, pos, partDistance, partMass, toughness) {
        this.options = options;
        this.generalGui = generalGui;
        this.width = width;
        this.height = height;
        this.scene = scene

        this.partDistance = partDistance;
        this.partMass = partMass;
        this.toughness = () => { return this.options.toughness };
        this.gravity = () => { return this.options.gravity }

        this.particles = [];
        this.selectionGroup = [];

        this.integrator = INTEGRATOR_LIST[options.integrator];

        this.clothState = new ClothState(this);

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

        this.springs = [];

        // basic grid
        this.springs.push({x: 0, y: 1, toughness: this.toughness, restingDistance: this.partDistance})
        this.springs.push({x: 1, y: 0, toughness: this.toughness, restingDistance: this.partDistance})
        this.springs.push({x: 0, y: -1, toughness: this.toughness, restingDistance: this.partDistance})
        this.springs.push({x: -1, y: 0, toughness: this.toughness, restingDistance: this.partDistance})

        // shear springs
        this.diagonalRestingDistance = Math.sqrt(this.partDistance*this.partDistance + this.partDistance*this.partDistance)
        this.springs.push({x: -1, y: -1, toughness: this.toughness, restingDistance: this.diagonalRestingDistance})
        this.springs.push({x: -1, y: 1, toughness: this.toughness, restingDistance: this.diagonalRestingDistance})
        this.springs.push({x: 1, y: -1, toughness: this.toughness, restingDistance: this.diagonalRestingDistance})
        this.springs.push({x: 1, y: 1, toughness: this.toughness, restingDistance: this.diagonalRestingDistance})

        // bend springs
        let bendSpringLength = 2;
        this.bendSpringDistance = this.partDistance * bendSpringLength;
        this.springs.push({x: 1 * bendSpringLength, y: 0, toughness: this.toughness, restingDistance: this.bendSpringDistance})
        this.springs.push({x: 0, y: 1 * bendSpringLength, toughness: this.toughness, restingDistance: this.bendSpringDistance})
        this.springs.push({x: -1 * bendSpringLength, y: 0, toughness: this.toughness, restingDistance: this.bendSpringDistance})
        this.springs.push({x: 0, y: -1 * bendSpringLength, toughness: this.toughness, restingDistance: this.bendSpringDistance})

        // spring visulization
        this.springVisulization = new ClothVisulization(this);
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
            let intersects = raycaster.intersectObjects( this.selectionGroup );

            let selectedPoint;
            for(let i = 0; i < intersects.length; i++) {
                if(intersects[i].object.type == "Mesh") {
                    selectedPoint = intersects[i].object;
                }
            }
            if(this.control.object) {
                this.unsetAnchorParticle(this.control.object.clothPosX, this.control.object.clothPosY);
            }
            if(!selectedPoint) {
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
        dt = dt / 1000;
        this.updateControls();

        if(this.options.adaptive_step_size) {

            let singleStepState = this.clothState.clone();
            let doubleStepState = this.clothState.clone();
    
            this.integrator.integrator(singleStepState, dt);
    
            this.integrator.integrator(doubleStepState, dt / 2);
            this.integrator.integrator(doubleStepState, dt / 2);
    
            let error = distance(singleStepState, doubleStepState);
    
            let newH = dt * Math.pow(this.options.max_error / error, 1 / this.integrator.order);
            let numSteps = dt / newH;
    
            if(numSteps > this.options.max_steps_per_frame) {
                numSteps = this.options.max_steps_per_frame;
                newH = dt / this.options.max_steps_per_frame;
            } else {
                numSteps = Math.ceil(numSteps);
                newH = dt / numSteps;
            }
    
            this.options.current_steps_per_frame = numSteps;
            this.options.current_step_size = newH;
    
            for(let miniStep = 0; miniStep < numSteps; miniStep++) {
                this.integrator.integrator(this.clothState, dt / numSteps);
            }

        } else {
            let numSteps = this.options.max_steps_per_frame;
            this.options.current_step_size = dt / numSteps;
            this.options.current_steps_per_frame = numSteps;

            for(let miniStep = 0; miniStep < numSteps; miniStep++) {
                this.integrator.integrator(this.clothState, dt / numSteps);
            }
        }

        for (let i in this.generalGui.__controllers) {
            this.generalGui.__controllers[i].updateDisplay();
        }

        for(let x = 0; x < this.width; x++) {
            for(let y = 0; y < this.height; y++) {
                this.particles[x][y].position.x = this.clothState.positions[x][y].x;
                this.particles[x][y].position.y = this.clothState.positions[x][y].y;
                this.particles[x][y].position.z = this.clothState.positions[x][y].z;
                this.particles[x][y].visible = this.options.showParticles;
            }
        }

        this.springVisulization.update();
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
