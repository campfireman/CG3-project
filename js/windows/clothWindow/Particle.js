import * as THREE from "/three/three.module.js";


const sphereGeometry = new THREE.SphereGeometry(0.05, 32, 32);
const sphereMaterial = new THREE.MeshPhongMaterial({ color: 0xcf1120 });

const AIR_RESISTANCE = 10;

class Particle {

    constructor(scene, pos, mass, integrator) {
        this.pos = pos;
        this.vel = new THREE.Vector3();
        this.acc = new THREE.Vector3();

        this.mass = mass;
        this.invMass = 1 / mass;

        this.integrator = integrator

        this.sphere = new THREE.Mesh(sphereGeometry, sphereMaterial);
        this.sphere.position.x = this.pos.x;
        this.sphere.position.y = this.pos.y;
        this.sphere.position.z = this.pos.z;
        this.sphere.particle = this;
        scene.add(this.sphere);
    }

    update(dt, num_h) {
        let velMag = this.vel.length();
        let dragMag = velMag * velMag * AIR_RESISTANCE;

        let drag = this.vel.clone().normalize().multiplyScalar(-dragMag);

        this.applyForce(drag);
        let new_pos = null;
        let new_vel = null;
        let h = dt / num_h;
        for (let i = 0; i < num_h; i++) {
            new_pos = this.integrator(this.pos, this.vel, h);
            new_vel = this.integrator(this.vel, this.acc, h);
        }
        this.pos = new_pos
        this.vel = new_vel
        
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

    setIntegrator(integrator) {
        this.integrator = integrator;
    }

}

export { Particle };
