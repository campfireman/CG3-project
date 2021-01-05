import * as THREE from "/three/three.module.js";
const COLOR_REST = 0xffffff;
const COLOR_STRETCHED = 0xff0000;
const COLOR_SQUEEZED = 0x00ff00;

class ClothVisulization {
    constructor(cloth) {
        this.cloth = cloth;

        this.springs = [];

        this.initSprings();
        this.initMesh();
    }

    initSprings() {
        for (let x = 0; x < this.cloth.width; x++) {
            this.springs.push([]);
            for (let y = 0; y < this.cloth.height; y++) {
                this.springs[x].push(Array(this.cloth.springs.length).fill(null));
                this.cloth.springs.forEach((spring, i) => {
                    let otherX = x + spring.x;
                    let otherY = y + spring.y;
                    if (otherX >= 0 && otherX <= this.cloth.width - 1 && otherY >= 0 && otherY <= this.cloth.height - 1) {
                        let geometry = new THREE.Geometry();
                        geometry.vertices.push(this.cloth.particles[x][y].position, this.cloth.particles[otherX][otherY].position);

                        let line = new THREE.Line(
                            geometry,
                            new THREE.LineBasicMaterial({
                                color: COLOR_REST,
                            })
                        );
                        this.cloth.scene.add(line);
                        this.springs[x][y][i] = {
                            line: line,
                            geometry: geometry,
                            other: {
                                x: otherX,
                                y: otherY,
                            },
                        };
                    }
                });
            }
        }
    }

    initMesh() {
        this.meshVertecies = [];
        this.meshIndecies = [];
        this.meshUVs = [];

        for (let i = 0; i < this.cloth.width * this.cloth.height * 3; i++) {
            this.meshVertecies.push(0);
        }
        for (let i = 0; i < this.cloth.width * this.cloth.height * 2; i++) {
            this.meshUVs.push(0);
        }
        for (let i = 0; i < (this.cloth.width - 1) * (this.cloth.height - 1) * 2; i++) {
            this.meshIndecies.push(0, 0, 0);
        }

        for (let y = 0; y < this.cloth.height - 1; y++) {
            for (let x = 0; x < this.cloth.width - 1; x++) {
                let a = y * this.cloth.width + x;
                let b = (y + 1) * this.cloth.width + x;
                let c = (y + 1) * this.cloth.width + x + 1;
                let d = y * this.cloth.width + x + 1;

                let faceStartIndex = 6 * (y * (this.cloth.width - 1) + x);

                this.meshIndecies[faceStartIndex + 0] = a;
                this.meshIndecies[faceStartIndex + 1] = b;
                this.meshIndecies[faceStartIndex + 2] = c;

                this.meshIndecies[faceStartIndex + 3] = a;
                this.meshIndecies[faceStartIndex + 4] = c;
                this.meshIndecies[faceStartIndex + 5] = d;
            }
        }

        for (let y = 0; y < this.cloth.height; y++) {
            for (let x = 0; x < this.cloth.width; x++) {
                this.meshUVs[2 * (y * this.cloth.width + x) + 0] = x / (this.cloth.width - 1);
                this.meshUVs[2 * (y * this.cloth.width + x) + 1] = y / (this.cloth.height - 1);
            }
        }

        this.meshGeometry = new THREE.BufferGeometry();
        this.meshGeometry.setIndex(this.meshIndecies);

        this.vertexBuffer = new THREE.Float32BufferAttribute(this.meshVertecies, 3);
        this.meshGeometry.setAttribute("position", this.vertexBuffer);
        this.meshGeometry.computeVertexNormals();

        let uvBuffer = new THREE.Float32BufferAttribute(this.meshUVs, 2, true);
        this.meshGeometry.setAttribute("uv", uvBuffer);

        this.meshMaterial = new THREE.MeshPhongMaterial({
            side: THREE.DoubleSide,
            map: new THREE.TextureLoader().load("/assets/textures/gray_cloth_fabric.jpg"),
        });

        this.mesh = new THREE.Mesh(this.meshGeometry, this.meshMaterial);
        this.cloth.scene.add(this.mesh);

        this.updateMesh();
    }

    update() {
        this.updateSprings();

        if (this.cloth.options.show_mesh) {
            this.mesh.visible = true;
            this.updateMesh();
        } else {
            this.mesh.visible = false;
        }
    }

    updateSprings() {
        for (let x = 0; x < this.cloth.width; x++) {
            for (let y = 0; y < this.cloth.height; y++) {
                this.cloth.springs.forEach((val, i) => {
                    let spring = this.springs[x][y][i];
                    if (spring == null) {
                        return;
                    }

                    if (
                        (i >= 0 && i < 4 && this.cloth.options.showBasicSprings) ||
                        (i >= 4 && i < 8 && this.cloth.options.showShearSprings) ||
                        (i >= 8 && i < 12 && this.cloth.options.showBendSprings)
                    ) {
                        let pos1 = this.cloth.particles[x][y].position;
                        let pos2 = this.cloth.particles[spring.other.x][spring.other.y].position;
                        let direction = pos1.clone().sub(pos2);

                        spring.geometry.vertices[0] = pos1;
                        spring.geometry.vertices[1] = pos2;

                        spring.geometry.verticesNeedUpdate = true;
                        let scale = this.clamp(direction.length() / val.restingDistance, 0, 2);
                        let color = COLOR_REST;
                        if (scale > 1) {
                            color = COLOR_STRETCHED;
                            scale = 1 - (scale - 1);
                        } else if (scale < 1) {
                            color = COLOR_SQUEEZED;
                        }
                        color = this.lerp(color, COLOR_REST, scale);

                        spring.line.material = new THREE.LineBasicMaterial({
                            color: color,
                        });
                        spring.line.visible = true;
                    } else {
                        spring.line.visible = false;
                    }
                });
            }
        }
    }

    updateMesh() {
        let vertecies = this.mesh.geometry.attributes.position.array;

        for (let y = 0; y < this.cloth.height; y++) {
            for (let x = 0; x < this.cloth.width; x++) {
                vertecies[3 * (y * this.cloth.width + x) + 0] = this.cloth.clothState.positions[x][y].x;
                vertecies[3 * (y * this.cloth.width + x) + 1] = this.cloth.clothState.positions[x][y].y;
                vertecies[3 * (y * this.cloth.width + x) + 2] = this.cloth.clothState.positions[x][y].z;
            }
        }

        this.mesh.geometry.computeVertexNormals();

        this.mesh.geometry.attributes.position.needsUpdate = true;
    }

    clamp(value, min, max) {
        if (value > max) {
            return max;
        }
        if (value < min) {
            return min;
        }
        return value;
    }

    /**
     * A linear interpolator for hex colors.
     *
     * Based on:
     * https://gist.github.com/nikolas/b0cce2261f1382159b507dd492e1ceef
     *
     * @param {Number} a  (hex color start val)
     * @param {Number} b  (hex color end val)
     * @param {Number} amount  (the amount to fade from a to b)
     *
     * @returns {Number}
     */
    lerp(a, b, amount) {
        const ar = a >> 16,
            ag = (a >> 8) & 0xff,
            ab = a & 0xff,
            br = b >> 16,
            bg = (b >> 8) & 0xff,
            bb = b & 0xff,
            rr = ar + amount * (br - ar),
            rg = ag + amount * (bg - ag),
            rb = ab + amount * (bb - ab);

        return (rr << 16) + (rg << 8) + (rb | 0);
    }
}

export { ClothVisulization };
