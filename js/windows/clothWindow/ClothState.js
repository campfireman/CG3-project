import * as THREE from "/three/three.module.js";

import { ClothDeriv } from "./ClothDeriv.js";

var isInfiniteMass = [];

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

    getDeriv(h) {
        let deriv = new ClothDeriv(this.width, this.height);

        for(let x = 0; x < this.width; x++) {
            for(let y = 0; y < this.height; y++) {
                deriv.dPos[x][y] = this.velocities[x][y].clone().multiplyScalar(h);

                let force = new THREE.Vector3();

                // Gravity
                force.y += -this.options.gravity;

                // Air resistance
                let velMag = this.velocities[x][y].length();
                let dragMag = velMag * velMag * this.options.air_resistance;
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

                if(isInfiniteMass[x][y]) {
                    force.multiplyScalar(0);
                } else {
                    force.multiplyScalar(1 / this.options.particle_mass);
                }
                
                deriv.dVel[x][y] = force.multiplyScalar(h);
            }
        }

        return deriv;
    }

    clone() {
        let ret = new ClothState(this.width, this.height, this.options);

        for(let x = 0; x < this.width; x++) {
            for(let y = 0; y < this.height; y++) {
                ret.positions[x][y] = this.positions[x][y].clone();
                ret.velocities[x][y] = this.velocities[x][y].clone();
            }
        }

        return ret;
    }

    calcSpringForce(pos1, pos2) {
        let direction =  pos2.clone().sub(pos1);
        let displacement = direction.length() - this.options.particle_distance;
        let force = direction.setLength(this.options.toughness * displacement);
        
        return force;
    }

};

function distance(s1, s2) {
    let sum = 0;
    for(let x = 0; x < s1.width; x++) {
        for(let y = 0; y < s1.height; y++) {
            let diffPos = s1.positions[x][y].clone().sub(s2.positions[x][y]);
            sum += diffPos.x * diffPos.x + diffPos.y * diffPos.y + diffPos.z * diffPos.z;

            let diffVel = s1.velocities[x][y].clone().sub(s2.velocities[x][y]);
            sum += diffVel.x * diffVel.x + diffVel.y * diffVel.y + diffVel.z * diffVel.z;
        }
    }
    return Math.sqrt(sum);
}

function initMassArray(width, height) {
    for(let x = 0; x < width; x++) {
        isInfiniteMass.push([]);
        for(let y = 0; y < height; y++) {
            isInfiniteMass[x].push(false);
        }
    }
}

function setInfiniteMass(x, y, isInfinite) {
    isInfiniteMass[x][y] = isInfinite;
}

export { ClothState, distance, initMassArray, setInfiniteMass };