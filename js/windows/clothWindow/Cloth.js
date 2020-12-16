import * as THREE from "/three/three.module.js";

import { Particle } from "./Particle.js";
import { Spring } from "./Spring.js";

class Cloth {

    constructor(scene, width, height, pos, partDistance, partMass, toughness) {
        this.width = width;
        this.height = height;

        this.partDistance = partDistance;
        this.toughness = toughness;

        this.particles = [];

        for(let x = 0; x < width; x++) {
            this.particles.push([]);
            for(let y = 0; y < height; y++) {
                let partPos = pos.clone().add(new THREE.Vector3(x * partDistance, y * partDistance, y * partDistance / 2 /*Math.random() / 1000 - 0.001*/));
                this.particles[x].push(new Particle(scene, partPos, partMass));

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

    }

    update(dt) {
        for(let i = 0; i < 10; i++) {
            for(let i = 0; i < this.springs.length; i++) {
                this.springs[i].update(dt);
            }
            // update the particles at last after all forces had been applied
            for(let x = 0; x < this.width; x++) {
                for(let y = 0; y < this.height; y++) {
                    this.particles[x][y].update(dt / 10);
                }
            }
        }
    }

    applyForceUniform(force) {
        for(let x = 0; x < this.width; x++) {
            for(let y = 0; y < this.height; y++) {
                this.particles[x][y].applyForce(force);
            }
        }
    }

    setAnchorParticle(x, y) {
        this.particles[x][y].setInfiniteMass();
    }

}

export { Cloth };