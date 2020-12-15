import * as THREE from "/three/three.module.js";

import * as INTEGRATORS from "./Intergrators.js";

class Particle {

    constructor(pos, mass) {
        this.pos = pos;
        this.vel = new THREE.Vector3();
        this.acc = new THREE.Vector3();

        this.mass = mass;
        this.invMass = 1 / mass;
    }

    update(dt) {
        this.pos = INTEGRATORS.integrateEuler(this.pos, this.vel, dt);
        this.vel = INTEGRATORS.integrateEuler(this.vel, this.acc, dt);
        this.acc.multiplyScalar(0);
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