import * as THREE from "/three/three.module.js";

import { ClothDeriv } from "./ClothDeriv.js";

const AIR_RESISTANCE = 10;

class ClothState {

    constructor(width, height, options) {
        this.width = width;
        this.height = height;
        this.options = options;

        this.positions = [];
        this.velocities = [];

        for(let x = 0; x < width; x++) {
            this.positions.push([]);
            this.velocities.push([]);
            for(let y = 0; y < height; y++) {
                this.positions[x].push(new THREE.Vector3());
                this.velocities[x].push(new THREE.Vector3());
            }
        }
    }

    add(clothDeriv) {
        for(let x = 0; x < this.width; x++) {
            for(let y = 0; y < this.height; y++) {
                this.positions[x][y].add(clothDeriv.dPos[x][y]);
                if(this.positions[x][y].y < 0) {
                    this.positions[x][y].y = 0;
                    this.velocities[x][y].y = 0;
                }
                this.velocities[x][y].add(clothDeriv.dVel[x][y]);
            }
        }

        return this;
    }

    getDeriv() {
        let deriv = new ClothDeriv(this.width, this.height);

        for(let x = 0; x < this.width; x++) {
            for(let y = 0; y < this.height; y++) {
                deriv.dPos[x][y] = this.velocities[x][y].clone();

                let force = new THREE.Vector3();

                // Gravity
                force.y += -this.options.gravity;

                // Air resistance
                let velMag = this.velocities[x][y].length();
                let dragMag = velMag * velMag * AIR_RESISTANCE;
                let drag = this.velocities[x][y].clone().normalize().multiplyScalar(-dragMag);
                force.add(drag);

                // Springs
                if(x < this.positions.length - 1)
                    force.add(this.calcSpringForce(this.positions[x][y], this.positions[x+1][y]));
                if(y < this.positions[x].length - 1)
                    force.add(this.calcSpringForce(this.positions[x][y], this.positions[x][y+1]));
                if(x > 0)
                    force.add(this.calcSpringForce(this.positions[x][y], this.positions[x-1][y]));
                if(y > 0)
                    force.add(this.calcSpringForce(this.positions[x][y], this.positions[x][y-1]));

                
                force.multiplyScalar(1 / this.options.particle_mass);
                deriv.dVel[x][y] = force;
            }
        }

        return deriv;
    }

    calcSpringForce(pos1, pos2) {
        let direction =  pos2.clone().sub(pos1);
        let displacement = direction.length() - this.options.particle_distance;
        let force = direction.setLength(this.options.toughness * displacement);
        
        return force;
    }

};

export { ClothState };