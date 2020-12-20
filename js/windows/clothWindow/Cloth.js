import { integrateEuler, integrateRungeKutta } from "./Intergrators.js";
import { Particle } from "./Particle.js";
import { Spring } from "./Spring.js";
import { TransformControls } from '/jsm/controls/TransformControls.js';
import * as THREE from "/three/three.module.js";



const INTEGRATORS = [
    integrateEuler,
    integrateRungeKutta
]

class Cloth {

    constructor(scene, camera, renderer, orbitControl, options, width, height, pos, partDistance, partMass, toughness) {
        this.options = options;
        this.width = width;
        this.height = height;

        this.partDistance = partDistance;
        this.toughness = toughness;

        this.particles = [];
        this.selectionGroup = [];

        this.integrator = INTEGRATORS[options.integrator];

        for(let x = 0; x < width; x++) {
            this.particles.push([]);
            for(let y = 0; y < height; y++) {
                let partPos = pos.clone().add(new THREE.Vector3(x * partDistance, y * partDistance, y * partDistance / 2 /*Math.random() / 1000 - 0.001*/));
                this.particles[x].push(new Particle(scene, partPos, partMass, this.integrator));

                this.selectionGroup.push(this.particles[x].sphere);
            }
        }
        
        this.springs = [];

        // basic springs only
        // add shear and bend springs
        for(let y = 0; y < this.height; y++) {
            for(let x = 1; x < this.width; x++) {
                let springH = new Spring(this.particles[x][y], this.particles[x-1][y], this.toughness, this.partDistance);
                this.springs.push(springH);
            }
        }
        for(let x = 0; x < this.width; x++) {
            for(let y = 1; y < this.height; y++) {
                let springV = new Spring(this.particles[x][y], this.particles[x][y-1], this.toughness, this.partDistance);
                this.springs.push(springV);
            }
        }

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
                    this.control.object.particle.setMass(this.options.particle_mass);
                }
                this.control.detach();
                return;
            }
            selectedPoint.particle.setInfiniteMass();
            selectedPoint.particle.vel.multiplyScalar(0);
			this.control.attach(selectedPoint);

        }, true);
        
        this.control.addEventListener("mouseUp", (ev) => {
			this.justMoved = true;
		});
    }

    update(dt) {
        this.updateControls();

        dt = dt / 1000;
        for(let i = 0; i < 5; i++) {
            for(let i = 0; i < this.springs.length; i++) {
                this.springs[i].update(dt / 1000);
            }
            // update the particles at last after all forces had been applied
            for(let x = 0; x < this.width; x++) {
                for(let y = 0; y < this.height; y++) {
                    this.particles[x][y].update(dt / 5);
                }
            }
        }
    }

    updateControls() {
        if(this.control.dragging) {
            let newPos = this.control.object.position;
            let targetParticle = this.control.object.particle;
            targetParticle.pos.x = newPos.x;
            targetParticle.pos.y = newPos.y;
            targetParticle.pos.z = newPos.z;
        }
    }

    applyForceUniform(force) {
        for(let x = 0; x < this.width; x++) {
            for(let y = 0; y < this.height; y++) {
                this.particles[x][y].applyForce(force);
            }
        }
    }

    setParticlePos(x, y, pos) {
        this.particles[x][y].pos.x = pos.x;
        this.particles[x][y].pos.y = pos.y;
        this.particles[x][y].pos.z = pos.z;
    }

    setAnchorParticle(x, y) {
        this.particles[x][y].setInfiniteMass();
        this.particles[x][y].vel.multiplyScalar(0);
    }

    setParticleDistance(newDistance) {
        for(let i = 0; i < this.springs.length; i++) {
            this.springs[i].setRestLength(newDistance);
        }
    }

    setAllParticleMass(newMass) {
        for(let x = 0; x < this.width; x++) {
            for(let y = 0; y < this.height; y++) {
                if(this.particles[x][y].invMass != 0) {
                    this.particles[x][y].setMass(newMass);
                }
            }
        }
    }

    setParticleMass(x, y, newMass) {
        this.particles[x][y].setMass(newMass);
    }

    setToughness(newToughness) {
        for(let i = 0; i < this.springs.length; i++) {
            this.springs[i].setSpringConstant(newToughness);
        }
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
