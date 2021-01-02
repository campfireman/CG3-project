import { ClothState, distance, initMassArray, setInfiniteMass } from "./ClothState.js";
import { integrateEuler, integrateRungeKutta } from "./Intergrators.js";
import * as INTEGRATORS from "./Intergrators.js";
import { Spring } from "./Spring.js";
import { TransformControls } from '/jsm/controls/TransformControls.js';
import * as THREE from "/three/three.module.js";

/*const INTEGRATORS = [
    integrateEuler,
    integrateRungeKutta
];*/

const sphereGeometry = new THREE.SphereGeometry(0.05, 32, 32);
const sphereMaterial = new THREE.MeshPhongMaterial({ color: 0xcf1120 });

class Cloth {

    constructor(scene, camera, renderer, orbitControl, options, generalGui, width, height, pos, partDistance, partMass, toughness) {
        this.options = options;
        this.generalGui = generalGui;
        this.width = width;
        this.height = height;
        this.scene = scene

        this.partDistance = partDistance;
        this.toughness = toughness;

        this.particles = [];
        this.selectionGroup = [];

        this.clothState = new ClothState(width, height, options);

        this.integrator = INTEGRATORS[options.integrator];

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


        this.meshVertecies = [];
        this.meshIndecies = [];
        this.meshColors = [];
        for(let i = 0; i < width * height * 3; i++) {
            this.meshVertecies.push(0);
            this.meshColors.push(0);
        }
        for(let i = 0; i < (width - 1) * (height - 1) * 2; i++) {
            this.meshIndecies.push(0, 0, 0);
        }

        for(let y = 0; y < this.height - 1; y++) {
            for(let x = 0; x < this.width - 1; x++) {
                let a = (y * this.width + x);
                let b = ((y + 1) * this.width + x);
                let c = ((y + 1) * this.width + x + 1);
                let d = (y * this.width + x + 1);

                let faceStartIndex = 6 * (y * (this.width - 1) + x);

                this.meshIndecies[faceStartIndex + 0] = a;
                this.meshIndecies[faceStartIndex + 1] = b;
                this.meshIndecies[faceStartIndex + 2] = c;

                this.meshIndecies[faceStartIndex + 3] = a;
                this.meshIndecies[faceStartIndex + 4] = c;
                this.meshIndecies[faceStartIndex + 5] = d;
            }
        }

        this.meshGeometry = new THREE.BufferGeometry();
        this.meshGeometry.setIndex(this.meshIndecies);

        this.vertexBuffer = new THREE.Float32BufferAttribute(this.meshVertecies, 3);
        this.vertexBuffer.needsUpdate = true;
        this.meshGeometry.setAttribute("position", this.vertexBuffer);
        this.meshGeometry.computeVertexNormals();
        let colorsBuffer = new THREE.Float32BufferAttribute(this.meshColors, 3, true);
        this.meshGeometry.setAttribute("color", colorsBuffer);

        this.meshMaterial = new THREE.MeshPhongMaterial({
            side: THREE.DoubleSide,
            vertexColors: true
        });

        this.mesh = new THREE.Mesh(this.meshGeometry, this.meshMaterial);
        this.mesh.geometry.attributes.position.needsUpdate = true;
        this.mesh.geometry.attributes.color.needsUpdate = true;
        scene.add(this.mesh);

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
    
            INTEGRATORS.integrateRungeKutta(singleStepState, dt);
    
            INTEGRATORS.integrateRungeKutta(doubleStepState, dt / 2);
            INTEGRATORS.integrateRungeKutta(doubleStepState, dt / 2);
    
            let error = distance(singleStepState, doubleStepState);
    
            let newH = dt * Math.pow(this.options.max_error / error, 0.2);
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
                INTEGRATORS.integrateRungeKutta(this.clothState, newH);
                //INTEGRATORS.integrateEuler(this.clothState, dt / numH);
            }

        } else {
            let numSteps = this.options.max_steps_per_frame;
            this.options.current_step_size = dt / numSteps;
            this.options.current_steps_per_frame = numSteps;

            for(let miniStep = 0; miniStep < numSteps; miniStep++) {
                INTEGRATORS.integrateRungeKutta(this.clothState, dt / numSteps);
                //INTEGRATORS.integrateEuler(this.clothState, dt / numH);
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
            }
        }

        this.updateMesh();
        this.mesh.geometry.attributes.position.needsUpdate = true;
        this.mesh.geometry.attributes.color.needsUpdate = true;
    }

    updateMesh() {
        let vertecies = this.mesh.geometry.attributes.position.array;
        let colors = this.mesh.geometry.attributes.color.array;

        // vertecies, colors
        for(let y = 0; y < this.height; y++) {
            for(let x = 0; x < this.width; x++) {
                vertecies[3 * (y * this.width + x) + 0] = this.clothState.positions[x][y].x;
                vertecies[3 * (y * this.width + x) + 1] = this.clothState.positions[x][y].y;
                vertecies[3 * (y * this.width + x) + 2] = this.clothState.positions[x][y].z;

                colors[3 * (y * this.width + x) + 0] = 1;
                colors[3 * (y * this.width + x) + 1] = 0;
                colors[3 * (y * this.width + x) + 2] = 1;
            }
        }

        this.mesh.geometry.computeVertexNormals();
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
        this.integrator = INTEGRATORS[index];
        for(let x = 0; x < this.width; x++) {
            for(let y = 0; y < this.height; y++) {
                this.particles[x][y].setIntegrator(this.integrator);
            }
        }
    }

}

export { Cloth };
