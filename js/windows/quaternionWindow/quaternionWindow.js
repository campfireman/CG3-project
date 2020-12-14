import { GUI } from "../../../libJs/dat.gui.module.js";
import { GLTFLoader } from "../../../libJs/GLTFLoader.js";
import {
  AmbientLight,
  ArrowHelper,
  GridHelper,
  Mesh,
  MeshPhongMaterial,
  PerspectiveCamera,
  Scene,
  SphereGeometry,
  Vector3,
} from "../../../libJs/three.module.js";
import { Window } from "../window.js";
import { QuaternionAngle } from "./Quaternion.js";
import { OrbitControls } from "/jsm/controls/OrbitControls.js";
import { Line2 } from "/jsm/lines/Line2.js";
import { LineGeometry } from "/jsm/lines/LineGeometry.js";
import { LineMaterial } from "/jsm/lines/LineMaterial.js";
const MODEL_PATH = "../../../models/";

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
        this.quaternionFolder.removeFolder(
          this.quaternions[this.count() - 1].folder
        );
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

    // scene
    this.scene = new Scene();
    const color = 0xffffff;
    const intensity = 1;
    this.scene.add(new AmbientLight(color, intensity));
    this.scene.add(new GridHelper(50, 20));

    // camera
    this.camera = new PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    this.camera.position.z = 5;
    this.orbitControls = new OrbitControls(
      this.camera,
      this.renderer.domElement
    );
    this.orbitControls.update();

    // objects
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
    const sgeometry = new SphereGeometry(1, 32, 32);
    // sgeometry.translate(2.5, 0, -2.5);
    const smaterial = new MeshPhongMaterial({
      color: 0xffffff,
      opacity: 0.5,
      transparent: true,
    });
    this.sphere = new Mesh(sgeometry, smaterial);
    this.scene.add(this.sphere);
    // GUI
    this.gui = new GUI();

    this.quaternionFolder = this.gui.addFolder("Quaternions");
    this.quaternionFolder.open();

    this.quaternionFolder
      .add(this.options, "addQuaternion")
      .name("Add quaternion");
    this.quaternionFolder
      .add(this.options, "removeQuaternion")
      .name("Remove quaternion");

    this.addQuaternion();
    this.animationFolder = this.gui.addFolder("Animation");
    this.animationFolder
      .add(this.options, "toggleAnimation")
      .name("Start/Stop");
    this.animationFolder
      .add(
        this.options,
        "animationTime",
        MIN_ANIMATION_TIME,
        MAX_ANIMATION_TIME
      )
      .name("Animation time")
      .listen();
    this.animationFolder.open();

    // animation
    this.startQ = new QuaternionAngle(0, 0, 1, 0);
    this.resetAnimation();
    this.rotationAxisArrow = null;
    this.rotationArrowLine = null;
    this.rotationArrowTip = null;
    this.test = null;
    this.test2 = null;
    this.visualizeQuaternions();
    const pointerGeometry = new SphereGeometry(0.05, 12, 12);
    pointerGeometry.translate(this.curQ.x, this.curQ.y, this.curQ.z);
    // pointerGeometry.applyMatrix4(this.curQ.matrix);
    const pointerMaterial = new MeshPhongMaterial({
      color: 0xff0000,
      opacity: 1,
    });
    this.pointer = new Mesh(pointerGeometry, pointerMaterial);
    this.sphere.add(this.pointer);
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
      this.scene.remove(this.rotationAxisArrow);
      delete this.rotationAxisArrow;
      this.scene.remove(this.rotationArrowLine);
      delete this.rotationArrowLine;
      this.scene.remove(this.rotationArrowTip);
      delete this.rotationArrowTip;
      this.scene.remove(this.test);
      delete this.test;
      this.scene.remove(this.test2);
      delete this.test2;
      this.scene.remove(this.test3);
      delete this.test3;
      this.scene.remove(this.startP);
      delete this.startP;
      this.scene.remove(this.endP);
      delete this.endP;
    }
    let current = this.quaternions[this.cur].quaternion;
    let origin = new Vector3(0, 0, 0);
    let rotationAxis = new Vector3()
      .copy(current.getRotationAxis())
      .applyMatrix4(this.curQ.matrix);
    this.rotationAxisArrow = new ArrowHelper(
      rotationAxis,
      origin,
      rotationAxis.length(),
      ROTATION_AXIS_COLOR
    );

    let start = new Vector3().copy(new Vector3(0, 1, 0));
    start.applyMatrix4(this.curQ.matrix);

    let endQ = new QuaternionAngle(
      current.getTheta(),
      rotationAxis.x,
      rotationAxis.y,
      rotationAxis.z
    );
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
    this.test = new ArrowHelper(
      new Vector3(0, 0, 0).copy(start),
      new Vector3(0, 0, 0),
      start.length(),
      0x00ff00
    );
    this.test2 = new ArrowHelper(
      new Vector3(0, 0, 0).copy(end),
      new Vector3(0, 0, 0),
      end.length(),
      0x0000ff
    );

    // Interpolate between rotation start and end with SLERP to indicate rotation around axis
    const steps = 50;
    let omega = current.getTheta();
    let points = [start.x, start.y, start.z];
    let lastP;
    for (let i = 1; i < steps - 1; i++) {
      let t = i / steps;
      let p_0 = new Vector3().copy(start);
      let p_1 = new Vector3().copy(end);
      let p = p_0
        .multiplyScalar(Math.sin((1 - t) * omega) / Math.sin(omega))
        .add(p_1.multiplyScalar(Math.sin(t * omega) / Math.sin(omega)));
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
    this.rotationArrowTip = new ArrowHelper(
      new Vector3(0, 0, 0).copy(end).sub(lastP).normalize(),
      lastP,
      l,
      ROTATION_ARROW_COLOR,
      l,
      0.05
    );

    // visualize slerp and orientation
    const startPGeometry = new SphereGeometry(0.05, 12, 12);
    startPGeometry.translate(this.curQ.x, this.curQ.y, this.curQ.z);
    // startPGeometry.applyMatrix4(this.curQ.matrix);
    const startPMaterial = new MeshPhongMaterial({
      color: 0x00ff00,
      opacity: 1,
    });
    this.startP = new Mesh(startPGeometry, startPMaterial);
    let projectionPoint = new Vector3(0, -1, 0);

    let radius = 1;
    let C = new Vector3(0, 0, 0);
    let new_pos = this.project(
      projectionPoint,
      new Vector3(this.curQ.x, this.curQ.y, this.curQ.z)
        .sub(projectionPoint)
        .normalize(),
      C,
      radius
    );
    const testP = new SphereGeometry(0.05, 12, 12);
    testP.translate(new_pos.x, new_pos.y, new_pos.z);
    // testP.applyMatrix4(this.nextQ.matrix);
    const testPMaterial = new MeshPhongMaterial({
      color: 0xffffff,
      opacity: 1,
    });
    let testP2 = new Mesh(testP, testPMaterial);
    this.scene.add(testP2);

    const endPGeometry = new SphereGeometry(0.05, 12, 12);
    // endPGeometry.translate(0, 2, 0);
    endPGeometry.translate(this.nextQ.x, this.nextQ.y, this.nextQ.z);
    // endPGeometry.applyMatrix4(this.nextQ.matrix);
    const endPMaterial = new MeshPhongMaterial({
      color: 0x0000ff,
      opacity: 1,
    });
    this.endP = new Mesh(endPGeometry, endPMaterial);
    this.scene.add(
      new ArrowHelper(
        new Vector3(this.nextQ.x, this.nextQ.y, this.nextQ.z)
          .sub(projectionPoint)
          .normalize(),
        projectionPoint,
        10
      )
    );
    new_pos = this.project(
      projectionPoint,
      new Vector3(this.nextQ.x, this.nextQ.y, this.nextQ.z)
        .sub(projectionPoint)
        .normalize(),
      C,
      radius
    );
    const testP3 = new SphereGeometry(0.05, 12, 12);
    testP3.translate(new_pos.x, new_pos.y, new_pos.z);
    // testP.applyMatrix4(this.nextQ.matrix);
    let testPMaterial2 = new MeshPhongMaterial({
      color: 0xffffff,
      opacity: 1,
    });
    const testP4 = new Mesh(testP3, testPMaterial2);
    this.scene.add(testP4);
    this.sphere.add(this.startP);
    this.sphere.add(this.endP);

    this.scene.add(this.test);
    this.scene.add(this.test2);
    this.scene.add(this.rotationArrowLine);
    this.scene.add(this.rotationArrowTip);
    this.scene.add(this.rotationAxisArrow);
  }
  /**
   * Animates the given object with the given quaternions, distributes time evenly quaternions
   * @param {int} delta_t milliseconds since last frame
   */
  update(delta_t) {
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
      if (
        this.sum >
        (this.cur + 1) * (this.options.animationTime / this.quaternions.length)
      ) {
        this.cur++;
        this.curQ = this.nextQ;
        this.nextQ = this.curQ.multiply(this.quaternions[this.cur].quaternion);
        this.sumQ = 0;
        this.visualizeQuaternions();
      }
      // interpolate between quaternions based on t
      let t =
        this.sumQ / (this.options.animationTime / this.quaternions.length);
      let pos = this.curQ.slerp(this.nextQ, t);
      this.object.setRotationFromMatrix(pos.matrix);
      this.pointer.position.set(pos.x, pos.y, pos.z);
    }
  }
  random() {
    return (
      Math.floor(Math.random() * QUATERNION_RAND_INTERVAL) -
      QUATERNION_RAND_INTERVAL / 2
    );
  }
  count() {
    return this.quaternions.length;
  }

  project(O, D, C, radius) {
    let L = C.sub(O);
    let t_ca = L.dot(D);
    let d = Math.sqrt(L.dot(L) - Math.pow(t_ca, 2));
    let t_hc = Math.sqrt(Math.pow(radius, 2) - Math.pow(d, 2));
    let t_1 = t_ca + t_hc;
    let new_pos = new Vector3(0, 0, 0).copy(O).add(D.multiplyScalar(t_1));
    return new_pos;
  }
  /**
   * Add quaternion to GUI and its representation to internal datastructure
   */
  addQuaternion() {
    let newQuaternionFolder = this.quaternionFolder.addFolder(
      `Quaternion ${this.count()}`
    );
    let x = this.random();
    let y = this.random();
    let z = this.random();
    let attributes = {
      folder: newQuaternionFolder,
      quaternion: new QuaternionAngle(DEFAULT_THETA_VALUE, x, y, z),
    };
    this.quaternions.push(attributes);
    this.guiValues.push({
      x,
      y,
      z,
      theta: DEFAULT_THETA_VALUE,
    });
    newQuaternionFolder
      .add(
        this.guiValues[this.guiValues.length - 1],
        "x",
        MIN_AXIS_VALUE,
        MAX_AXIS_VALUE,
        AXIS_STEP_SIZE
      )
      .name("X")
      .listen()
      .onChange(() => this.resetAnimation());
    newQuaternionFolder
      .add(
        this.guiValues[this.guiValues.length - 1],
        "y",
        MIN_AXIS_VALUE,
        MAX_AXIS_VALUE,
        AXIS_STEP_SIZE
      )
      .name("Y")
      .listen()
      .onChange(() => this.resetAnimation());
    newQuaternionFolder
      .add(
        this.guiValues[this.guiValues.length - 1],
        "z",
        MIN_AXIS_VALUE,
        MAX_AXIS_VALUE,
        AXIS_STEP_SIZE
      )
      .name("Z")
      .listen()
      .onChange(() => this.resetAnimation());
    newQuaternionFolder
      .add(
        this.guiValues[this.guiValues.length - 1],
        "theta",
        MIN_THETA_VALUE,
        MAX_THETA_VALUE
      )
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
}

export { QuaternionWindow };
