import * as THREE from "/three/three.module.js";

class ClothDeriv {

    constructor(width, height) {
        this.dPos = [];
        this.dVel = [];

        for(let x = 0; x < width; x++) {
            this.dPos.push([]);
            this.dVel.push([]);
            for(let y = 0; y < height; y++) {
                this.dPos[x].push(new THREE.Vector3());
                this.dVel[x].push(new THREE.Vector3());
            }
        }
    }

    mul(factor) {
        for(let x = 0; x < width; x++) {
            for(let y = 0; y < height; y++) {
                this.positions[x][y].multiplyScalar(factor);
                this.velocities[x][y].multiplyScalar(factor);
            }
        }

        return this;
    }

};

export { ClothDeriv };