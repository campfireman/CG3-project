import { ClothDeriv } from "./ClothDeriv.js";
import * as THREE from "/three/three.module.js";


const AIR_RESISTANCE = 10;

var isInfiniteMass = [];

class ClothState {

    constructor(cloth) {
        this.width = cloth.width;
        this.height = cloth.height;
        this.cloth = cloth;

        this.positions = [];
        this.velocities = [];

        for(let x = 0; x < this.width; x++) {
            this.positions.push([]);
            this.velocities.push([]);
            for(let y = 0; y < this.height; y++) {
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
                force.y += -this.cloth.gravity();

                // Air resistance
                let velMag = this.velocities[x][y].length();
                let dragMag = velMag * velMag * AIR_RESISTANCE;
                let drag = this.velocities[x][y].clone().normalize().multiplyScalar(-dragMag);
                force.add(drag);

                // Springs
                this.cloth.springs.forEach((spring) => {
                    let otherX = x + spring.x;
                    let otherY = y + spring.y;
                    if (otherX >= 0 && otherX <= this.width - 1 && otherY >= 0 && otherY <= this.height -1) {
                        force.add(this.calcSpringForce(this.positions[x][y], this.positions[otherX][otherY], spring.toughness(), spring.restingDistance));
                    }
                })

                if(isInfiniteMass[x][y]) {
                    force.multiplyScalar(0);
                } else {
                    force.multiplyScalar(1 / this.cloth.partMass);
                }
                
                deriv.dVel[x][y] = force.multiplyScalar(h);
            }
        }

        return deriv;
    }

    clone() {
        let ret = new ClothState(this.cloth);

        for(let x = 0; x < this.width; x++) {
            for(let y = 0; y < this.height; y++) {
                ret.positions[x][y] = this.positions[x][y].clone();
                ret.velocities[x][y] = this.velocities[x][y].clone();
            }
        }

        return ret;
    }

    calcSpringForce(pos1, pos2, toughness, restingDistance) {
        let direction =  pos2.clone().sub(pos1);
        let displacement = direction.length() - restingDistance;
        let force = direction.setLength(toughness * displacement);
        
        return force;
    }

};

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

export { ClothState, initMassArray, setInfiniteMass };
