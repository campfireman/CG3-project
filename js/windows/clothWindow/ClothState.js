import { ClothDeriv } from "./ClothDeriv.js";

import * as THREE from "/three/three.module.js";

// static 2D-array of boolean values which shows which particles are inmovable
var isInfiniteMass = [];

/**
 * Represents the State of the cloth including all particles
 */
class ClothState {
    constructor(cloth) {
        this.width = cloth.width;
        this.height = cloth.height;
        this.cloth = cloth;

        this.positions = [];
        this.velocities = [];

        for (let x = 0; x < this.width; x++) {
            this.positions.push([]);
            this.velocities.push([]);
            for (let y = 0; y < this.height; y++) {
                // set initial position
                let partPos = cloth.pos
                    .clone()
                    .add(new THREE.Vector3(x * cloth.options.particle_distance, y * cloth.options.particle_distance, (y * cloth.options.particle_distance) / 2));
                this.positions[x].push(partPos);

                // set initial velocity
                this.velocities[x].push(new THREE.Vector3());
            }
        }
    }

    /**
     * adds a cloth derivative onto this cloth state
     * @param {ClothDeriv} clothDeriv derivative of the clothState which is to be added onto this State
     */
    add(clothDeriv) {
        for (let x = 0; x < this.width; x++) {
            for (let y = 0; y < this.height; y++) {
                this.positions[x][y].add(clothDeriv.dPos[x][y]);
                if (this.positions[x][y].y < 0) {
                    this.positions[x][y].y = 0;
                    this.velocities[x][y].y = 0;
                }
                this.velocities[x][y].add(clothDeriv.dVel[x][y]);
            }
        }

        return this;
    }

    /**
     * calculates the derivative of this state
     * @param {Number} h step size
     */
    getDeriv(h) {
        let deriv = new ClothDeriv(this.width, this.height);
        let windForce = new THREE.Vector3(0, 0, 0);
        if (this.cloth.options.wind) {
            const windStrength = Math.cos(h * 7) * this.cloth.options.windForce;

            windForce.set(Math.sin(h / 20), Math.cos(h / 30), Math.sin(h / 10));
            windForce.normalize();
            windForce.multiplyScalar(windStrength);
        }

        for (let x = 0; x < this.width; x++) {
            for (let y = 0; y < this.height; y++) {
                deriv.dPos[x][y] = this.velocities[x][y].clone().multiplyScalar(h);

                let force = new THREE.Vector3();
                let normals = [];

                // Gravity
                // force.y += -this.cloth.gravity();
                force.y += -this.cloth.options.gravity;

                // Air resistance
                let velMag = this.velocities[x][y].length();
                let dragMag = velMag * velMag * this.cloth.options.air_resistance;
                let drag = this.velocities[x][y].clone().normalize().multiplyScalar(-dragMag);
                force.add(drag);

                // Springs
                this.cloth.springs.forEach((spring, i) => {
                    let otherX = x + spring.x;
                    let otherY = y + spring.y;
                    if (otherX >= 0 && otherX <= this.width - 1 && otherY >= 0 && otherY <= this.height - 1) {
                        force.add(
                            this.calcSpringForce(
                                this.positions[x][y],
                                this.positions[otherX][otherY],
                                this.cloth.options.toughness,
                                spring.restingDistance
                            )
                        );

                        // use the chance to calculate normals as well
                        if (this.cloth.options.wind && i >= 0 && i < 4) {
                            normals.push(this.positions[x][y].clone().sub(this.positions[otherX][otherY]));
                        }
                    }
                });

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

                if (isInfiniteMass[x][y]) {
                    force.multiplyScalar(0);
                } else {
                    force.multiplyScalar(1 / this.cloth.options.particle_mass);
                }

                deriv.dVel[x][y] = force.multiplyScalar(h);
            }
        }

        return deriv;
    }

    /**
     * Creates a deep copy of this state
     */
    clone() {
        let ret = new ClothState(this.cloth);

        for (let x = 0; x < this.width; x++) {
            for (let y = 0; y < this.height; y++) {
                ret.positions[x][y] = this.positions[x][y].clone();
                ret.velocities[x][y] = this.velocities[x][y].clone();
            }
        }

        return ret;
    }

    /**
     * calculates the force of a spring between two points
     * @param {THREE.Vector3} pos1 first end of the Spring
     * @param {THREE.Vector3} pos2 second end of the spring
     * @param {Number} toughness spring konstant
     * @param {Number} restingDistance spring length is the resting state
     */
    calcSpringForce(pos1, pos2, toughness, restingDistance) {
        let direction = pos2.clone().sub(pos1);
        let displacement = direction.length() - restingDistance;
        let force = direction.setLength(toughness * displacement);

        return force;
    }
}

/**
 * Calculates the geometric distance between two cloth states
 * @param {ClothState} s1 Clothstate 1
 * @param {ClothState} s2 ClothState 2
 */
function geometricDistance(s1, s2) {
    let sum = 0;
    for (let x = 0; x < s1.width; x++) {
        for (let y = 0; y < s1.height; y++) {
            let diffPos = s1.positions[x][y].clone().sub(s2.positions[x][y]);
            sum += diffPos.x * diffPos.x + diffPos.y * diffPos.y + diffPos.z * diffPos.z;

            let diffVel = s1.velocities[x][y].clone().sub(s2.velocities[x][y]);
            sum += diffVel.x * diffVel.x + diffVel.y * diffVel.y + diffVel.z * diffVel.z;
        }
    }
    return Math.sqrt(sum);
}

/**
 * Calculates the mean geometric distances between all positions and velocities in two clothStates
 * @param {ClothState} s1 Clothstate 1
 * @param {ClothState} s2 ClothState 2
 */
function meanDistance(s1, s2) {
    let sum = 0;
    for (let x = 0; x < s1.width; x++) {
        for (let y = 0; y < s1.height; y++) {
            let diffPos = s1.positions[x][y].clone().sub(s2.positions[x][y]);
            sum += diffPos.length();

            let diffVel = s1.velocities[x][y].clone().sub(s2.velocities[x][y]);
            sum += diffVel.length();
        }
    }
    return sum / (s1.width * s1.height * 2);
}

/**
 * Calculates the max geometric distance between all positions and velocities in two clothStates
 * @param {ClothState} s1 Clothstate 1
 * @param {ClothState} s2 ClothState 2
 */
function maxDistance(s1, s2) {
    let max = 0;
    for (let x = 0; x < s1.width; x++) {
        for (let y = 0; y < s1.height; y++) {
            let diffPos = s1.positions[x][y].clone().sub(s2.positions[x][y]);
            let diffLen = diffPos.length();
            if(diffLen > max) {
                max = diffLen;
            }

            let diffVel = s1.velocities[x][y].clone().sub(s2.velocities[x][y]);
            diffLen = diffVel.length();
            if(diffLen > max) {
                max = diffLen;
            }
        }
    }
    return max;
}

/**
 * initializes the static array which indicates the inmovable particles
 * @param {Number} width cloth width
 * @param {Number} height cloth height
 */
function initMassArray(width, height) {
    for (let x = 0; x < width; x++) {
        isInfiniteMass.push([]);
        for (let y = 0; y < height; y++) {
            isInfiniteMass[x].push(false);
        }
    }
}

/**
 * sets a particle to be moveable or inmoveable based on isInfinite
 * @param {Number} x x position of the particle in the particle matrix
 * @param {Number} y y position of the particle in the particle matrix
 * @param {Boolean} isInfinite flag whether the particle should be inmoveable
 */
function setInfiniteMass(x, y, isInfinite) {
    isInfiniteMass[x][y] = isInfinite;
}

export { ClothState, geometricDistance, meanDistance, maxDistance, initMassArray, setInfiniteMass };
