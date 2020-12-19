import * as INTEGRATORS from "./Intergrators.js";
import * as THREE from "/three/three.module.js";


const sphereGeometry = new THREE.SphereGeometry(0.1, 32, 32);
const sphereMaterial = new THREE.MeshPhongMaterial({ color: 0xcf1120 });

const AIR_RESISTANCE = 10;

class Particle {

    constructor(scene, pos, mass) {
        this.pos = pos;
        this.vel = new THREE.Vector3();
        this.acc = new THREE.Vector3();

        this.mass = mass;
        this.invMass = 1 / mass;

        this.sphere = new THREE.Mesh(sphereGeometry, sphereMaterial);
        this.sphere.position.x = this.pos.x;
        this.sphere.position.y = this.pos.y;
        this.sphere.position.z = this.pos.z;
        this.sphere.particle = this;
        scene.add(this.sphere);
    }

    update(dt) {
        let velMag = this.vel.length();
        let dragMag = velMag * velMag * AIR_RESISTANCE;

        let drag = this.vel.clone().normalize().multiplyScalar(-dragMag);

        this.applyForce(drag);
        
        this.pos = INTEGRATORS.integrateEuler(this.pos, this.vel, dt);
        this.vel = INTEGRATORS.integrateEuler(this.vel, this.acc, dt);
        
        this.acc.multiplyScalar(0);

        if(this.pos.y < 0) {
            this.pos.y = 0;
            this.vel.y = 0;
        }

        this.sphere.position.x = this.pos.x;
        this.sphere.position.y = this.pos.y;
        this.sphere.position.z = this.pos.z;
    }

    applyForce(f) {
        let copy = f.clone();
        this.acc.add(copy.multiplyScalar(this.invMass));
    }

    setMass(newMass) {
        this.mass = newMass;
        this.invMass = 1 / newMass;
    }

    setInfiniteMass() {
        this.invMass = 0;
        this.mass = Infinity;   // <-- don't use it
    }

}

export { Particle };
