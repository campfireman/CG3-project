import { ClothDeriv } from "./ClothDeriv.js";
import * as THREE from "/three/three.module.js";


const AIR_RESISTANCE = 10;
const WIND_MULTIPLIER = 3;

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
        let windForce = new THREE.Vector3(0, 0, 0);
        if (this.cloth.options.wind) {
            const windStrength = Math.cos( h * 7 ) * WIND_MULTIPLIER;

            windForce.set( Math.sin( h / 20 ), Math.cos( h / 30), Math.sin( h / 10) );
            windForce.normalize();
            windForce.multiplyScalar( windStrength );
        }

        for(let x = 0; x < this.width; x++) {
            for(let y = 0; y < this.height; y++) {
                deriv.dPos[x][y] = this.velocities[x][y].clone().multiplyScalar(h);

                let force = new THREE.Vector3();
                let normals = [];

                // Gravity
                force.y += -this.cloth.gravity();


                // Air resistance
                let velMag = this.velocities[x][y].length();
                let dragMag = velMag * velMag * AIR_RESISTANCE;
                let drag = this.velocities[x][y].clone().normalize().multiplyScalar(-dragMag);
                force.add(drag);

                // Springs
                this.cloth.springs.forEach((spring, i) => {
                    let otherX = x + spring.x;
                    let otherY = y + spring.y;
                    if (otherX >= 0 && otherX <= this.width - 1 && otherY >= 0 && otherY <= this.height -1) {
                        force.add(this.calcSpringForce(this.positions[x][y], this.positions[otherX][otherY], spring.toughness(), spring.restingDistance));

                        // use the chance to calculate normals as well
                        if (this.cloth.options.wind && i >= 0 && i < 4) {
                            normals.push(this.positions[x][y].clone().sub(this.positions[otherX][otherY]));
                        }
                    }
                })

                // wind
                if (this.cloth.options.wind) {
                    let normal = normals[0].cross(normals[1]);
                    if (normals.length == 4) {
                    let normal1 = normals[0].cross(normals[1]);
                    let normal2 = normals[2].cross(normals[3]);

                    normal = normal1.add(normal2).multiplyScalar(0.5);
                    }
                    normal.normalize();
                    let tmpForce = normal.clone().multiplyScalar(normal.dot(windForce));
                    force.add(tmpForce);
                }

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
