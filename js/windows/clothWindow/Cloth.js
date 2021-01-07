import * as INTEGRATORS from "./Intergrators.js";
import { ClothState, distance, initMassArray, setInfiniteMass } from "./ClothState.js";
import { ClothVisulization } from "./ClothVisulization.js";

import * as THREE from "/three/three.module.js";

import { TransformControls } from "/jsm/controls/TransformControls.js";

const INTEGRATOR_LIST = [
    {
        integrator: INTEGRATORS.integrateEuler,
        order: 2,
    },
    {
        integrator: INTEGRATORS.integrateRungeKutta,
        order: 5,
    },
];

class Cloth {
    constructor(scene, camera, renderer, orbitControl, options, generalGui, width, height, pos) {
        this.scene = scene;
        this.options = options;
        this.generalGui = generalGui;
        this.width = width;
        this.height = height;
        this.pos = pos;

        // all meshes that can be selected
        this.selectionGroup = [];

        // default integrator
        this.integrator = INTEGRATOR_LIST[options.integrator];

        // create new instance of cloth state
        this.clothState = new ClothState(this);

        // initialize the static mass matrix
        initMassArray(width, height);

        // initialize transform controls
        this.initControls(scene, camera, renderer, orbitControl);

        this.springs = [];

        // basic grid
        this.springs.push({ x: 0, y: 1, toughness: options.toughness, restingDistance: options.particle_distance });
        this.springs.push({ x: 1, y: 0, toughness: options.toughness, restingDistance: options.particle_distance });
        this.springs.push({ x: 0, y: -1, toughness: options.toughness, restingDistance: options.particle_distance });
        this.springs.push({ x: -1, y: 0, toughness: options.toughness, restingDistance: options.particle_distance });

        // shear springs
        this.diagonalRestingDistance = Math.sqrt(options.particle_distance * options.particle_distance + options.particle_distance * options.particle_distance);
        this.springs.push({ x: -1, y: -1, toughness: options.toughness, restingDistance: this.diagonalRestingDistance });
        this.springs.push({ x: -1, y: 1, toughness: options.toughness, restingDistance: this.diagonalRestingDistance });
        this.springs.push({ x: 1, y: -1, toughness: options.toughness, restingDistance: this.diagonalRestingDistance });
        this.springs.push({ x: 1, y: 1, toughness: options.toughness, restingDistance: this.diagonalRestingDistance });

        // bend springs
        let bendSpringLength = 2;
        this.bendSpringDistance = options.particle_distance * bendSpringLength;
        this.springs.push({ x: 1 * bendSpringLength, y: 0, toughness: options.toughness, restingDistance: this.bendSpringDistance });
        this.springs.push({ x: 0, y: 1 * bendSpringLength, toughness: options.toughness, restingDistance: this.bendSpringDistance });
        this.springs.push({ x: -1 * bendSpringLength, y: 0, toughness: options.toughness, restingDistance: this.bendSpringDistance });
        this.springs.push({ x: 0, y: -1 * bendSpringLength, toughness: options.toughness, restingDistance: this.bendSpringDistance });

        // cloth visulization
        this.clothVisualization = new ClothVisulization(this);

        // fill the selection group with selectable particles
        let particles = this.clothVisualization.particles;
        for(let i = 0; i < particles.length; i++) {
            for(let j = 0; j < particles[i].length; j++) {
                this.selectionGroup.push(particles[i][j]);
            }
        }
    }

    /**
     * Initializes the functionality for selecting and draging cloth particles
     * @param {THREE.Scene} scene the current scene
     * @param {THREE.Camera} camera current camera
     * @param {THREE.Renderer} renderer current renderer
     * @param {OrbitControl} orbitControl orbit controls
     */
    initControls(scene, camera, renderer, orbitControl) {
        this.justMoved = false;

        // initialize transform controls
        this.control = new TransformControls(camera, renderer.domElement);
        this.control.addEventListener("dragging-changed", (event) => {
            orbitControl.enabled = !event.value;
        });
        scene.add(this.control);

        renderer.domElement.addEventListener("click", (ev) => {
                // if the click event results from a particle being moved do nothing
                if (this.justMoved) {
                    this.justMoved = false;
                    return;
                }

                // calculate NDC from screen coordinates
                let x = (ev.clientX / window.innerWidth) * 2 - 1;
                let y = -(ev.clientY / window.innerHeight) * 2 + 1;
                let mouseVector = new THREE.Vector2(x, y);

                // Raycast into the scene and intersect objects
                let raycaster = new THREE.Raycaster();
                raycaster.setFromCamera(mouseVector, camera);
                let intersects = raycaster.intersectObjects(this.selectionGroup);

                // select the nearest intersection relativve to the camera
                let selectedPoint;
                if(intersects[0]) {
                    selectedPoint = intersects[0].object;
                }

                // if there was an object selected before: unselect it
                if (this.control.object) {
                    this.unsetAnchorParticle(this.control.object.clothPosX, this.control.object.clothPosY);
                }

                // if nothing is selected remove the move controls
                if (!selectedPoint) {
                    this.control.detach();
                    return;
                }

                // attach move controls to the selected particle
                this.setAnchorParticle(selectedPoint.clothPosX, selectedPoint.clothPosY);
                this.control.attach(selectedPoint);
            }, true
        );
        
        // remember if a particle was moved last frame
        this.control.addEventListener("mouseUp", (ev) => {
            this.justMoved = true;
        });
    }

    /**
     * gets called every frame to update the cloth
     * @param {Number} dt time since last frame in miliseconds
     */
    update(dt) {
        dt = dt / 1000;
        this.updateControls();

        let numSteps;

        if (this.options.adaptive_step_size) {
            // make copies for the steps
            let singleStepState = this.clothState.clone();
            let doubleStepState = this.clothState.clone();

            // perform single step with full dt
            this.integrator.integrator(singleStepState, dt);

            // perform two steps with each half dt
            this.integrator.integrator(doubleStepState, dt / 2);
            this.integrator.integrator(doubleStepState, dt / 2);

            // calculate error
            let error = distance(singleStepState, doubleStepState);

            // calculate new step size and number of steps to execute
            let newH = dt * Math.pow(this.options.max_error / error, 1 / this.integrator.order);
            numSteps = dt / newH;

            // clamt the number of steps if the number is too large
            if (numSteps > this.options.max_steps_per_frame) {
                numSteps = this.options.max_steps_per_frame;
                newH = dt / this.options.max_steps_per_frame;
            } else {
                numSteps = Math.ceil(numSteps);
                newH = dt / numSteps;
            }

            // update the numbers in the gui
            this.options.current_steps_per_frame = numSteps;
            this.options.current_step_size = newH;

        } else {
            numSteps = this.options.max_steps_per_frame;
            this.options.current_step_size = dt / numSteps;
            this.options.current_steps_per_frame = numSteps;
        }

        for (let miniStep = 0; miniStep < numSteps; miniStep++) {
            this.integrator.integrator(this.clothState, dt / numSteps);
        }

        // update gui
        for (let i in this.generalGui.__controllers) {
            this.generalGui.__controllers[i].updateDisplay();
        }

        this.clothVisualization.update();
    }

    /**
     * updates the position in the clothState object if a particle is being moved
     */
    updateControls() {
        if (this.control.dragging) {
            // get the moved particle
            let newPos = this.control.object.position;

            // get the position of the particle in the particle matrix
            let targetX = this.control.object.clothPosX;
            let targetY = this.control.object.clothPosY;

            // update the position
            this.clothState.positions[targetX][targetY].x = newPos.x;
            this.clothState.positions[targetX][targetY].y = newPos.y;
            this.clothState.positions[targetX][targetY].z = newPos.z;
        }
    }

    /**
     * 
     * @param {Number} x x position of the particle in the particle matrix
     * @param {Number} y y position of the particle in the particle matrix
     * @param {THREE.Vector3} pos new world position
     */
    setParticlePos(x, y, pos) {
        this.clothState.positions[x][y].x = pos.x;
        this.clothState.positions[x][y].y = pos.y;
        this.clothState.positions[x][y].z = pos.z;
    }

    /**
     * sets a particle to be inmovable
     * @param {Number} x x position of the particle in the particle matrix
     * @param {Number} y y position of the particle in the particle matrix
     */
    setAnchorParticle(x, y) {
        setInfiniteMass(x, y, true);
        this.clothState.velocities[x][y].x = 0;
        this.clothState.velocities[x][y].y = 0;
        this.clothState.velocities[x][y].z = 0;
    }

    /**
     * releases a particle so it can move
     * @param {Number} x x position of the particle in the particle matrix
     * @param {Number} y y position of the particle in the particle matrix
     */
    unsetAnchorParticle(x, y) {
        setInfiniteMass(x, y, false);
    }

    /**
     * sets the integrator by index
     * @param {Number} index new integrator index
     */
    setIntegrator(index) {
        this.integrator = INTEGRATOR_LIST[index];
    }
}

export { Cloth };
