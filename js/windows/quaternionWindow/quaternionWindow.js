import { GUI } from "../../../libJs/dat.gui.module.js";
import { GLTFLoader } from "../../../libJs/GLTFLoader.js";
import {
  AmbientLight,
  GridHelper,
  PerspectiveCamera,
  Scene,
} from "../../../libJs/three.module.js";
import { Window } from "../window.js";
import { QuaternionAngle } from "./Quaternion.js";
import { OrbitControls } from "/jsm/controls/OrbitControls.js";

const MODEL_PATH = "../../../models/";

const MIN_AXIS_VALUE = -10.0;
const MIN_THETA_VALUE = 0.0;
const MIN_ANIMATION_TIME = 100;

const MAX_AXIS_VALUE = 10.0;
const MAX_THETA_VALUE = 2.0 * Math.PI;
const MAX_ANIMATION_TIME = 5000;

const DEFAULT_THETA_VALUE = 0.5 * Math.PI;
const DEFAULT_ANIMATION_TIME = 2000;

const QUATERNION_RAND_INTERVAL = 4;

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
        console.log(this.count() - 1);
        console.log(this.quaternions);
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
    this.resetAnimation();
  }

  /**
   * All variables that need to be reset when animation loops starts
   */
  resetAnimation() {
    this.sum = 0;
    this.prevQ = new QuaternionAngle(0, 1, 0, 0);
    this.curQ = this.quaternions[0].quaternion;
    this.prevT = 0;
    this.first = true;
    this.cur = 1;
    this.sumQ = 0;
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
        this.cur * (this.options.animationTime / this.quaternions.length)
      ) {
        this.prevQ = this.curQ;
        this.curQ = this.quaternions[this.cur].quaternion;
        this.cur++;
        this.sumQ = 0;
      }
      // interpolate between quaternions based on t
      let t =
        this.sumQ / (this.options.animationTime / this.quaternions.length);
      let pos = this.prevQ.slerp(this.curQ, t);
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
        MAX_AXIS_VALUE
      )
      .name("X")
      .listen();
    newQuaternionFolder
      .add(
        this.quaternions[this.count() - 1].quaternion.a,
        "y",
        MIN_AXIS_VALUE,
        MAX_AXIS_VALUE
      )
      .name("Y")
      .listen();
    newQuaternionFolder
      .add(
        this.quaternions[this.count() - 1].quaternion.a,
        "z",
        MIN_AXIS_VALUE,
        MAX_AXIS_VALUE
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
