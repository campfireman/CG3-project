import { GLTFLoader } from "../../../libJs/GLTFLoader.js";
import { Label } from "./Label.js";
import { QuaternionAngle } from "./Quaternion.js";
import { Window } from "../window.js";

import * as DAT from "/dat/dat.gui.module.js";
import * as THREE from "/three/three.module.js";
import { Vector3 } from "/three/three.module.js";

import { Line2 } from "/jsm/lines/Line2.js";
import { LineGeometry } from "/jsm/lines/LineGeometry.js";
import { LineMaterial } from "/jsm/lines/LineMaterial.js";
import { OrbitControls } from "/jsm/controls/OrbitControls.js";

const MODEL_PATH = "../../../assets/models/";

const MIN_AXIS_VALUE = -10.0;
const MIN_THETA_VALUE = 0.0;
const MIN_ANIMATION_TIME = 100;

const MAX_AXIS_VALUE = 10.0;
const MAX_THETA_VALUE = 2.0 * Math.PI - 0.00001;
const MAX_ANIMATION_TIME = 5000;

const AXIS_STEP_SIZE = 1;

const DEFAULT_THETA_VALUE = 0.5 * Math.PI;
const DEFAULT_ANIMATION_TIME = 2000;

const QUATERNION_RAND_INTERVAL = 2;
const ROTATION_AXIS_COLOR = 0x66d9ef;
const ROTATION_ARROW_COLOR = 0xff0000;
const POINT_MARKER_RADIUS = 0.04;
const POINT_SEGMENT_WIDTH = 12;
const POINT_SEGMENT_HEIGHT = 12;

const I_AXIS_COLOR = 0xffffff;
const J_AXIS_COLOR = 0xffffff;
const K_AXIS_COLOR = 0xffffff;

class QuaternionWindow extends Window {
    constructor(renderer) {
        super(renderer);
        // holds the quaternion's gui folder and it's representation
        this.quaternions = [];
        this.guiValues = [];
        // all attributes and functions related to the GUI
        this.options = {
            animate: false,
            animationTime: DEFAULT_ANIMATION_TIME,
            camera: {
                speed: 0.0001,
            },
            addQuaternion: () => {
                if (this.count() > 0) {
                    this.quaternions[this.count() - 1].folder.close();
                }
                this.addQuaternion();
                this.resetAnimation();
            },
            removeQuaternion: () => {
                if (this.count() == 1) {
                    return;
                }
                this.quaternionFolder.removeFolder(this.quaternions[this.count() - 1].folder);
                delete this.quaternions[this.count() - 1];
                this.quaternions.pop();
                this.guiValues.pop();
                if (this.count() > 0) {
                    this.quaternions[this.count() - 1].folder.open();
                }
                this.resetAnimation();
            },
            toggleAnimation: () => {
                this.options.animate = !this.options.animate;
                this.resetAnimation();
            },
        };

        // init
        this.init();
        this.initObjects();
        this.initGUI();
        this.initAnimation();
        this.initQuaternionVisualization();
    }

    init() {
        // scene
        this.scene = new THREE.Scene();
        const color = 0xffffff;
        const intensity = 1;
        this.scene.add(new THREE.AmbientLight(color, intensity));
        this.scene.add(new THREE.GridHelper(50, 20));

        // camera
        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        this.camera.position.z = 5;
        this.orbitControls = new OrbitControls(this.camera, this.renderer.domElement);
        this.orbitControls.update();
    }

    initObjects() {
        this.object = null;
        var loader = new GLTFLoader();
        loader.load(
            MODEL_PATH + "BrainStem.glb",
            (gltf) => {
                this.object = gltf.scene;
                this.scene.add(this.object);
                this.object.setRotationFromMatrix(this.startQ.matrix);
            },
            undefined,
            function (error) {
                console.error(error);
            }
        );
    }

    initGUI() {
        this.gui = new DAT.GUI();

        this.quaternionFolder = this.gui.addFolder("Quaternions");
        this.quaternionFolder.open();

        this.quaternionFolder.add(this.options, "addQuaternion").name("Add quaternion");
        this.quaternionFolder.add(this.options, "removeQuaternion").name("Remove quaternion");

        this.addQuaternion();

        this.animationFolder = this.gui.addFolder("Animation");
        this.animationFolder.add(this.options, "toggleAnimation").name("Start/Stop");
        this.animationFolder.add(this.options, "animationTime", MIN_ANIMATION_TIME, MAX_ANIMATION_TIME).name("Animation time").listen();
        this.animationFolder.open();
    }

    initAnimation() {
        // animation
        this.startQ = new QuaternionAngle(0, 0, 0, 0);
        this.interpolationPathLines = [];
        this.resetAnimation();
    }

    initQuaternionVisualization() {
        this.interpolationPath = [];
        this.rotationAxisArrow = null;
        this.rotationArrowLine = null;
        this.rotationArrowTip = null;
        this.rotationStart = null;
        this.rotationEnd = null;
        this.objectsToPurge = [];

        this.sphereRadius = 1;
        this.sphereCenter = new Vector3(0, 0, 0);
        this.projectionPoint = new Vector3(0, 0, 0);
        const sgeometry = new THREE.SphereGeometry(this.sphereRadius, 32, 32);
        const smaterial = new THREE.MeshPhongMaterial({
            color: 0xffffff,
            opacity: 0.5,
            transparent: true,
        });
        this.sphere = new THREE.Mesh(sgeometry, smaterial);
        this.scene.add(this.sphere);
        this.sphere.translateX(2.5);

        let origin = new Vector3(0, 0, 0);
        this.iAxis = new THREE.ArrowHelper(new Vector3(1, 0, 0), origin, 2, I_AXIS_COLOR);
        this.jAxis = new THREE.ArrowHelper(new Vector3(0, 1, 0), origin, 2, J_AXIS_COLOR);
        this.kAxis = new THREE.ArrowHelper(new Vector3(0, 0, 1), origin, 2, K_AXIS_COLOR);

        this.sphereAxisLabels = [];
        this.sphereAxisLabels.push(
            new Label(new Vector3(2.5, 0, 0), "1", this.camera),
            new Label(new Vector3(4.5, 0, 0), "i", this.camera),
            new Label(new Vector3(2.5, 2, 0), "j", this.camera),
            new Label(new Vector3(2.5, 0, 2), "k", this.camera)
        );

        const pointerGeometry = new THREE.SphereGeometry(POINT_MARKER_RADIUS, POINT_SEGMENT_WIDTH, POINT_SEGMENT_HEIGHT);
        pointerGeometry.translate(this.curQ.x, this.curQ.y, this.curQ.z);
        const pointerMaterial = new THREE.MeshPhongMaterial({
            color: 0xff0000,
            opacity: 1,
        });
        this.pointer = new THREE.Mesh(pointerGeometry, pointerMaterial);
        this.sphere.add(this.pointer);

        this.sphere.add(this.iAxis);
        this.sphere.add(this.jAxis);
        this.sphere.add(this.kAxis);

        this.visualizeQuaternions();
    }

    /**
     * All variables that need to be reset when animation loops starts
     */
    resetAnimation() {
        this.sum = 0;
        this.cur = 0;
        this.first = true;
        this.sumQ = 0;
        this.curQ = this.startQ;
        this.nextQ = this.curQ.multiply(this.quaternions[this.cur].quaternion);
        delete this.interpolationPath;
        this.interpolationPath = [];
        this.interpolationPathLines.forEach((val) => {
            this.sphere.remove(val);
        });
        delete this.interpolationPathLines;
        this.interpolationPathLines = [];
    }
    /**
     * Angle based quaternions need to be updated if values changed
     * For compatibility with dat.GUI all quaternions are updated regardless if they changed or not
     */
    updateQuaternions() {
        this.quaternions.forEach((val, index) => {
            let newValues = this.guiValues[index];
            val.quaternion.a.x = newValues.x;
            val.quaternion.a.y = newValues.y;
            val.quaternion.a.z = newValues.z;
            val.quaternion.theta = newValues.theta;
            val.quaternion.updateValues();
        });
    }
    /**
     * inserts objects into scene to visualize the quaternions specified by the user
     */
    visualizeQuaternions() {
        // cleanup old visualiziation
        if (this.rotationAxisArrow != null) {
            this.objectsToPurge.forEach((obj) => {
                this.scene.remove(obj);
            });
            this.sphere.remove(this.interpolationStart);
            this.sphere.remove(this.interpolationEnd);
        }
        let current = this.quaternions[this.cur].quaternion;
        let origin = new Vector3(0, 0, 0);
        let rotationAxis = new Vector3().copy(current.getRotationAxis()).applyMatrix4(this.curQ.matrix);
        this.rotationAxisArrow = new THREE.ArrowHelper(rotationAxis, origin, rotationAxis.length(), ROTATION_AXIS_COLOR);

        let start = new Vector3().copy(new Vector3(0, 1, 0));
        start.applyMatrix4(this.curQ.matrix);

        let endQ = new QuaternionAngle(current.getTheta(), rotationAxis.x, rotationAxis.y, rotationAxis.z);
        let dot = -new Vector3().copy(start).dot(rotationAxis);
        if (1 - Math.abs(dot) < 0.02) {
            // if start is (roughly) perpendicular to rotation axis, use direction object is looking into (assuming z direction)
            start = new Vector3(0, 0, 1).applyMatrix4(this.curQ.matrix);
        } else {
            // else move start into the layer of the rotation axis
            start.add(rotationAxis.multiplyScalar(dot));
        }

        start.normalize();
        let end = new Vector3().copy(start);
        end.applyMatrix4(endQ.matrix);
        end.normalize();
        this.rotationStart = new THREE.ArrowHelper(new Vector3(0, 0, 0).copy(start), new Vector3(0, 0, 0), start.length(), 0x00ff00);
        this.rotationEnd = new THREE.ArrowHelper(new Vector3(0, 0, 0).copy(end), new Vector3(0, 0, 0), end.length(), 0x0000ff);

        // Interpolate between rotation start and end with SLERP to indicate rotation around axis
        const steps = 50;
        let omega = current.getTheta();
        let points = [start.x, start.y, start.z];
        let lastP;
        for (let i = 1; i < steps - 1; i++) {
            let t = i / steps;
            let p_0 = new Vector3().copy(start);
            let p_1 = new Vector3().copy(end);
            let p = p_0.multiplyScalar(Math.sin((1 - t) * omega) / Math.sin(omega)).add(p_1.multiplyScalar(Math.sin(t * omega) / Math.sin(omega)));
            points.push(p.x, p.y, p.z);
            lastP = p;
        }
        const geometry = new LineGeometry();
        geometry.setPositions(points);
        let material = new LineMaterial({
            linewidth: 0.0012,
            color: ROTATION_ARROW_COLOR,
        });
        this.rotationArrowLine = new Line2(geometry, material);
        let l = new Vector3(0, 0, 0).copy(end).sub(lastP).length();
        this.rotationArrowTip = new THREE.ArrowHelper(new Vector3(0, 0, 0).copy(end).sub(lastP).normalize(), lastP, l, ROTATION_ARROW_COLOR, l, 0.05);

        // visualize slerp and orientation
        let new_pos = this.project(
            this.projectionPoint,
            new Vector3(this.curQ.x, this.curQ.y, this.curQ.z).sub(this.projectionPoint).normalize(),
            this.sphereCenter,
            this.sphereRadius
        );
        const startPGeometry = new THREE.SphereGeometry(POINT_MARKER_RADIUS, POINT_SEGMENT_WIDTH, POINT_SEGMENT_HEIGHT);
        startPGeometry.translate(new_pos.x, new_pos.y, new_pos.z);
        const startPMaterial = new THREE.MeshPhongMaterial({
            color: 0x00ff00,
            opacity: 1,
        });
        this.interpolationStart = new THREE.Mesh(startPGeometry, startPMaterial);

        new_pos = this.project(
            this.projectionPoint,
            new Vector3(this.nextQ.x, this.nextQ.y, this.nextQ.z).sub(this.projectionPoint).normalize(),
            this.sphereCenter,
            this.sphereRadius
        );
        const endPGeometry = new THREE.SphereGeometry(POINT_MARKER_RADIUS, POINT_SEGMENT_WIDTH, POINT_SEGMENT_HEIGHT);
        endPGeometry.translate(new_pos.x, new_pos.y, new_pos.z);
        const endPMaterial = new THREE.MeshPhongMaterial({
            color: 0x0000ff,
            opacity: 1,
        });
        this.interpolationEnd = new THREE.Mesh(endPGeometry, endPMaterial);

        this.sphere.add(this.interpolationStart);
        this.sphere.add(this.interpolationEnd);

        this.scene.add(this.rotationStart);
        this.scene.add(this.rotationEnd);
        this.scene.add(this.rotationArrowLine);
        this.scene.add(this.rotationArrowTip);
        this.scene.add(this.rotationAxisArrow);
        this.scene.remove(this.rotationAxisArrow);

        this.objectsToPurge.push(this.rotationAxisArrow, this.rotationArrowLine, this.rotationArrowTip, this.rotationStart, this.rotationEnd);
    }
    /**
     * Animates the given object with the given quaternions, distributes time evenly quaternions
     * @param {int} delta_t milliseconds since last frame
     */
    update(delta_t) {
        this.sphereAxisLabels.forEach((label) => {
            label.updatePosition();
        });
        if (this.object != null && this.options.animate) {
            // fencepost: if animation just started set values
            if (this.first) {
                this.first = false;
                this.updateQuaternions();
                this.visualizeQuaternions();
            }
            // calculate progress of animation
            this.sum += delta_t;
            this.sumQ += delta_t;
            // restart animation
            if (this.sum > this.options.animationTime) {
                this.resetAnimation();
                return;
            }
            // check if share of quaternions time has been exceeded and go to next quaternion
            if (this.sum > (this.cur + 1) * (this.options.animationTime / this.quaternions.length)) {
                this.cur++;
                this.curQ = this.nextQ;
                this.nextQ = this.curQ.multiply(this.quaternions[this.cur].quaternion);
                this.sumQ = 0;
                this.visualizeQuaternions();
            }
            // interpolate between quaternions based on t
            let t = this.sumQ / (this.options.animationTime / this.quaternions.length);
            let pos = this.curQ.slerp(this.nextQ, t);
            this.object.setRotationFromMatrix(pos.matrix);

            // update position in quaternion visualization
            let new_pos = pos;

            // only project interpolated points after the first couple
            if (this.cur > 0) {
                new_pos = this.project(
                    this.projectionPoint,
                    new Vector3(pos.x, pos.y, pos.z).sub(this.projectionPoint).normalize(),
                    this.sphereCenter,
                    this.sphereRadius
                );
            }

            this.pointer.position.set(new_pos.x, new_pos.y, new_pos.z);
            this.interpolationPath.push(new Vector3(new_pos.x, new_pos.y, new_pos.z));
            if (this.interpolationPath.length > 1) {
                this.interpolationPathGeometry = new LineGeometry();
                let prev = this.interpolationPath[this.interpolationPath.length - 2];
                let cur = this.interpolationPath[this.interpolationPath.length - 1];
                this.interpolationPathGeometry.setPositions([prev.x, prev.y, prev.z, cur.x, cur.y, cur.z]);
                let interpolationPathMaterial = new LineMaterial({
                    linewidth: 0.0012,
                    color: ROTATION_ARROW_COLOR,
                });
                let line = new Line2(this.interpolationPathGeometry, interpolationPathMaterial);
                this.interpolationPathLines.push(line);
                this.sphere.add(line);
            }
        }
    }
    random() {
        return Math.floor(Math.random() * QUATERNION_RAND_INTERVAL) - QUATERNION_RAND_INTERVAL / 2;
    }
    count() {
        return this.quaternions.length;
    }

    project(O, D, C, radius) {
        let L = new Vector3(0, 0, 0).copy(C).sub(O);
        let t_ca = L.dot(D);
        let d = Math.sqrt(L.dot(L) - Math.pow(t_ca, 2));
        let t_hc = Math.sqrt(Math.pow(radius, 2) - Math.pow(d, 2));
        let t_1 = t_ca + t_hc;
        let new_pos = new Vector3(0, 0, 0).copy(O).add(new Vector3(0, 0, 0).copy(D).multiplyScalar(t_1));
        return new_pos;
    }
    /**
     * Add quaternion to GUI and its representation to internal datastructure
     */
    addQuaternion() {
        let newQuaternionFolder = this.quaternionFolder.addFolder(`Quaternion ${this.count()}`);
        let x = this.random();
        let y = this.random();
        let z = this.random();
        let theta = Math.floor(Math.random() * Math.PI * 1.5 + DEFAULT_THETA_VALUE);

        if (x == 0 && y == 0 && z == 0) {
            x = 1;
        }

        let attributes = {
            folder: newQuaternionFolder,
            quaternion: new QuaternionAngle(theta, x, y, z),
        };
        this.quaternions.push(attributes);
        this.guiValues.push({
            x,
            y,
            z,
            theta: theta,
        });
        newQuaternionFolder
            .add(this.guiValues[this.guiValues.length - 1], "x", MIN_AXIS_VALUE, MAX_AXIS_VALUE, AXIS_STEP_SIZE)
            .name("X")
            .listen()
            .onChange(() => this.resetAnimation());
        newQuaternionFolder
            .add(this.guiValues[this.guiValues.length - 1], "y", MIN_AXIS_VALUE, MAX_AXIS_VALUE, AXIS_STEP_SIZE)
            .name("Y")
            .listen()
            .onChange(() => this.resetAnimation());
        newQuaternionFolder
            .add(this.guiValues[this.guiValues.length - 1], "z", MIN_AXIS_VALUE, MAX_AXIS_VALUE, AXIS_STEP_SIZE)
            .name("Z")
            .listen()
            .onChange(() => this.resetAnimation());
        newQuaternionFolder
            .add(this.guiValues[this.guiValues.length - 1], "theta", MIN_THETA_VALUE, MAX_THETA_VALUE)
            .name("Theta")
            .listen()
            .onChange(() => this.resetAnimation());
        newQuaternionFolder.open();
    }
    getScene() {
        return this.scene;
    }

    getCamera() {
        return this.camera;
    }

    getGUI() {
        return this.gui;
    }

    hide() {
        super.hide();
        this.sphereAxisLabels.forEach((label) => {
            label.hide();
        });
    }

    show() {
        super.show();
        this.sphereAxisLabels.forEach((label) => {
            label.show();
        });
    }
}

export { QuaternionWindow };
