import * as THREE from "/three/three.module.js";

/**
 * represents the derivative of the ClothState
 */
class ClothDeriv {
    constructor(width, height) {
        this.width = width;
        this.height = height;

        this.dPos = [];
        this.dVel = [];

        for (let x = 0; x < width; x++) {
            this.dPos.push([]);
            this.dVel.push([]);
            for (let y = 0; y < height; y++) {
                this.dPos[x].push(new THREE.Vector3());
                this.dVel[x].push(new THREE.Vector3());
            }
        }
    }

    /**
     * multiplies the derivative with a scalar value
     * @param {Number} factor factor for the derivative to be multiplied with
     */
    mul(factor) {
        for (let x = 0; x < this.width; x++) {
            for (let y = 0; y < this.height; y++) {
                this.dPos[x][y].multiplyScalar(factor);
                this.dVel[x][y].multiplyScalar(factor);
            }
        }

        return this;
    }
}

export { ClothDeriv };
