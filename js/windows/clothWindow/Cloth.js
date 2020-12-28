import { ClothState, initMassArray, setInfiniteMass } from "./ClothState.js";
import { integrateEuler, integrateRungeKutta } from "./Intergrators.js";
import * as INTEGRATORS from "./Intergrators.js";
import { Particle } from "./Particle.js";
import { Spring } from "./Spring.js";
import { TransformControls } from '/jsm/controls/TransformControls.js';
import * as THREE from "/three/three.module.js";

/*const INTEGRATORS = [
    integrateEuler,
    integrateRungeKutta
];*/

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

        this.integrator = INTEGRATORS[options.integrator];

        this.clothState = new ClothState(width, height, options);

        for(let x = 0; x < width; x++) {
            this.particles.push([]);
            for(let y = 0; y < height; y++) {
                let partPos = pos.clone().add(new THREE.Vector3(x * partDistance, y * partDistance, 0/*y * partDistance / 2 /*Math.random() / 1000 - 0.001*/));

                let sphere = new THREE.Mesh(sphereGeometry, sphereMaterial);
                sphere.position.x = partPos.x;
                sphere.position.y = partPos.y;
                sphere.position.z = partPos.z;
                sphere.clothPosX = x;
                sphere.clothPosY = y;
                scene.add(sphere);

                //this.particles.push(new Particle(scene, partPos, partMass, this.integrator));
                this.particles[x].push(sphere);
                this.clothState.positions[x][y] = partPos.clone();

                this.selectionGroup.push(sphere);
            }
        }

        initMassArray(width, height);
        
        /*this.springs = [];

        // basic grid
        for(let y = 0; y < this.height; y++) {
            for(let x = 1; x < this.width; x++) {
                let springH = new Spring(this.particles[x][y], this.particles[x-1][y], this.toughness, this.partDistance, this.scene);
                this.springs.push(springH);
            }
        }
        for(let x = 0; x < this.width; x++) {
            for(let y = 1; y < this.height; y++) {
                let springV = new Spring(this.particles[x][y], this.particles[x][y-1], this.toughness, this.partDistance, this.scene);
                this.springs.push(springV);
            }
        }
        // shear springs
        for (let y = 0; y < this.height - 1; y++) {
            for (let x=0; x < this.width - 1; x++) {
                this.springs.push(
                    new Spring(this.particles[x][y], this.particles[x+1][y+1], this.toughness, this.partDistance, this.scene)
                );
                this.springs.push(
                    new Spring(this.particles[x+1][y], this.particles[x][y+1], this.toughness, this.partDistance, this.scene)
                );
            }
        }
        // bend springs
        let length = 2;
        for (let y=0; y < this.height - length; y++) {
            let createYSpring = y % length == 0;
            for (let x=0; x < this.width - length; x++) {
                if (createYSpring) {
                    this.springs.push(
                        new Spring(this.particles[x][y], this.particles[x][y + length], this.toughness / length, this.partDistance * length, this.scene)
                    )
                }
                if (x % length == 0) {
                    this.springs.push(
                        new Spring(this.particles[x][y], this.particles[x + length][y], this.toughness / length, this.partDistance * length , this.scene)
                    )
                }
            }
        }*/

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
                    //this.control.object.particle.setMass(this.options.particle_mass);
                    this.unsetAnchorParticle(this.control.object.clothPosX, this.control.object.clothPosY);
                }
                this.control.detach();
                return;
            }
            //selectedPoint.particle.setInfiniteMass();
            //selectedPoint.particle.vel.multiplyScalar(0);
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
        let numH = 20;

        /*for(let miniStep = 0; miniStep < numH; miniStep++) {

            this.applyForceUniform(new THREE.Vector3(0, -this.options.gravity, 0));

            for(let i = 0; i < this.springs.length; i++) {
                this.springs[i].update(dt / numH);
            }
            // update the particles at last after all forces had been applied
            for(let x = 0; x < this.width; x++) {
                for(let y = 0; y < this.height; y++) {
                    this.particles[x][y].update(dt / numH, numH);
                }
            }

        }


        for(let i = 0; i < this.springs.length; i++) {
            this.springs[i].updateVisulization();
        }*/

        for(let miniStep = 0; miniStep < numH; miniStep++) {
            INTEGRATORS.integrateRungeKutta2(this.clothState, dt / numH);
            //console.log(this.clothState);
        }

        for(let x = 0; x < this.width; x++) {
            for(let y = 0; y < this.height; y++) {
                //this.particles[x][y].pos = this.clothState.positions[x][y];
                //this.particles[x][y].update(dt / numH, numH);
                this.particles[x][y].position.x = this.clothState.positions[x][y].x;
                this.particles[x][y].position.y = this.clothState.positions[x][y].y;
                this.particles[x][y].position.z = this.clothState.positions[x][y].z;
            }
        }

    }

    updateControls() {
        if(this.control.dragging) {
            let newPos = this.control.object.position;
            //let targetParticle = this.control.object.particle;
            let targetX = this.control.object.clothPosX;
            let targetY = this.control.object.clothPosY;
            //targetParticle.pos.x = newPos.x;
            //targetParticle.pos.y = newPos.y;
            //targetParticle.pos.z = newPos.z;
            this.clothState.positions[targetX][targetY].x = newPos.x;
            this.clothState.positions[targetX][targetY].y = newPos.y;
            this.clothState.positions[targetX][targetY].z = newPos.z;
        }
    }

    /*applyForceUniform(force) {
        for(let x = 0; x < this.width; x++) {
            for(let y = 0; y < this.height; y++) {
                this.particles[x][y].applyForce(force);
            }
        }
    }*/

    setParticlePos(x, y, pos) {
        /*this.particles[x][y].pos.x = pos.x;
        this.particles[x][y].pos.y = pos.y;
        this.particles[x][y].pos.z = pos.z;*/
        this.clothState.positions[x][y].x = pos.x;
        this.clothState.positions[x][y].y = pos.y;
        this.clothState.positions[x][y].z = pos.z;
    }

    setAnchorParticle(x, y) {
        //this.particles[x][y].setInfiniteMass();
        //this.particles[x][y].vel.multiplyScalar(0);

        setInfiniteMass(x, y, true);
        this.clothState.velocities[x][y].x = 0;
        this.clothState.velocities[x][y].y = 0;
        this.clothState.velocities[x][y].z = 0;
    }

    /*setParticleDistance(newDistance) {
        for(let i = 0; i < this.springs.length; i++) {
            this.springs[i].setRestLength(newDistance);
        }
    }*/

    /*setAllParticleMass(newMass) {
        for(let x = 0; x < this.width; x++) {
            for(let y = 0; y < this.height; y++) {
                if(this.particles[x][y].invMass != 0) {
                    this.particles[x][y].setMass(newMass);
                }
            }
        }
    }*/

    /*setParticleMass(x, y, newMass) {
        this.particles[x][y].setMass(newMass);
    }*/

    unsetAnchorParticle(x, y) {
        setInfiniteMass(x, y, false);
    }

    /*setToughness(newToughness) {
        for(let i = 0; i < this.springs.length; i++) {
            this.springs[i].setSpringConstant(newToughness);
        }
    }*/

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
