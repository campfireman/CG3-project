import { GUI } from "../../../libJs/dat.gui.module.js";
import { GLTFLoader } from "../../../libJs/GLTFLoader.js";
import {
  AmbientLight,
  ArrowHelper,
  BufferGeometry,
  GridHelper,
  Line,
  LineBasicMaterial,
  PerspectiveCamera,
  Scene,
  Vector3,
} from "../../../libJs/three.module.js";
import { Window } from "../window.js";
import { QuaternionAngle } from "./Quaternion.js";
import { OrbitControls } from "/jsm/controls/OrbitControls.js";

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

class QuaternionWindow extends Window {
  constructor(renderer) {
    super(renderer);
    // holds the quaternion's gui folder and it's representation
    this.quaternions = [];
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
    this.rotationAxis = null;
    this.rotationArrow = null;
    this.test = null;
    this.test2 = null;
    this.visualizeQuaternions();
  }

  /**
   * All variables that need to be reset when animation loops starts
   */
  resetAnimation() {
    this.sum = 0;
    this.cur = 0;
    this.prevT = 0;
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
    this.quaternions.forEach((val) => {
      val.quaternion.updateValues();
    });
  }
  visualizeQuaternions() {
    // cleanup old visualiziation
    if (this.rotationAxis != null) {
      this.scene.remove(this.rotationAxis);
      delete this.rotationAxis;
      this.scene.remove(this.rotationArrow);
      delete this.rotationArrow;
      this.scene.remove(this.test);
      delete this.test;
      this.scene.remove(this.test2);
      delete this.test2;
    }
    let current = this.quaternions[this.cur].quaternion;
    let origin = new Vector3(0, 0, 0);
    let direction = new Vector3().copy(current.getRotationAxis());
    let length = direction.length();
    this.rotationAxis = new ArrowHelper(
      direction,
      origin,
      length,
      ROTATION_AXIS_COLOR
    );
    //
    let start = new Vector3().copy(new Vector3(0, 1, 0));
    start.applyMatrix4(this.curQ.matrix);

    let rotationAxis = new Vector3().copy(current.getRotationAxis());
    let endQ = new QuaternionAngle(
      current.getTheta(),
      rotationAxis.x,
      rotationAxis.y,
      rotationAxis.z
    );
    let dot = -new Vector3().copy(start).dot(rotationAxis);
    if (Math.abs(dot) == 1) {
      start = new Vector3(0, 0, 1);
    } else {
      start.add(rotationAxis.multiplyScalar(dot));
    }

    start.normalize();
    let end = new Vector3().copy(start);
    end.applyMatrix4(endQ.matrix);
    end.normalize();
    this.test = new ArrowHelper(
      new Vector3(0, 0, 0).copy(start),
      new Vector3(0, 0, 0),
      length,
      0x00ff00
    );
    this.test2 = new ArrowHelper(
      new Vector3(0, 0, 0).copy(end),
      new Vector3(0, 0, 0),
      length,
      0x0000ff
    );

    const steps = 50;
    let omega = current.getTheta();
    let points = [start];
    for (let i = 1; i < steps - 1; i++) {
      let t = i / steps;
      let p_0 = new Vector3().copy(start);
      let p_1 = new Vector3().copy(end);
      points.push(
        p_0
          .multiplyScalar(Math.sin((1 - t) * omega) / Math.sin(omega))
          .add(p_1.multiplyScalar(Math.sin(t * omega) / Math.sin(omega)))
      );
    }
    points.push(end);
    const geometry = new BufferGeometry().setFromPoints(points);
    const material = new LineBasicMaterial({ color: 0xff0000 });
    this.rotationArrow = new Line(geometry, material);

    this.rotationAxis.applyMatrix4(this.curQ.matrix);
    this.rotationArrow.applyMatrix4(this.curQ.matrix);
    this.test.applyMatrix4(this.curQ.matrix);
    this.test2.applyMatrix4(this.curQ.matrix);

    this.scene.add(this.test);
    this.scene.add(this.test2);
    this.scene.add(this.rotationArrow);
    this.scene.add(this.rotationAxis);
  }
  /**
   * Animates the given object with the given quaternions, distributes time evenly quaternions
   * @param {int} time milliseconds since start
   */
  update(time) {
    if (this.object != null && this.options.animate) {
      // fencepost: if animation just started set values
      if (this.first) {
        this.prevT = time;
        this.first = false;
        this.updateQuaternions();
        this.visualizeQuaternions();
      }
      // calculate progress of animation
      let delta = time - this.prevT;
      this.prevT = time;
      this.sum += delta;
      this.sumQ += delta;
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
    newQuaternionFolder
      .add(
        this.quaternions[this.count() - 1].quaternion.a,
        "x",
        MIN_AXIS_VALUE,
        MAX_AXIS_VALUE,
        AXIS_STEP_SIZE
      )
      .name("X")
      .listen();
    newQuaternionFolder
      .add(
        this.quaternions[this.count() - 1].quaternion.a,
        "y",
        MIN_AXIS_VALUE,
        MAX_AXIS_VALUE,
        AXIS_STEP_SIZE
      )
      .name("Y")
      .listen();
    newQuaternionFolder
      .add(
        this.quaternions[this.count() - 1].quaternion.a,
        "z",
        MIN_AXIS_VALUE,
        MAX_AXIS_VALUE,
        AXIS_STEP_SIZE
      )
      .name("Z")
      .listen();
    newQuaternionFolder
      .add(
        this.quaternions[this.count() - 1].quaternion,
        "theta",
        MIN_THETA_VALUE,
        MAX_THETA_VALUE
      )
      .name("Theta")
      .listen();
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
