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

const DEFAULT_X_VALUE = 1.0;
const DEFAULT_Y_VALUE = 0.0;
const DEFAULT_Z_VALUE = 0.0;
const DEFAULT_THETA_VALUE = 0.5 * Math.PI;
const DEFAULT_ANIMATION_TIME = 2000;

class QuaternionWindow extends Window {
  constructor(renderer) {
    super(renderer);
    this.count = 0;
    this.quaternions = [];
    this.options = {
      animate: false,
      animationTime: DEFAULT_ANIMATION_TIME,
      camera: {
        speed: 0.0001,
      },
      addQuaternion: () => {
        if (this.count > 0) {
          this.quaternions[this.count - 1].folder.close();
        }
        this.addQuaternion();
      },
      removeQuaternion: () => {
        if (this.count == 1) {
          return;
        }
        this.count--;
        this.quaternionFolder.removeFolder(this.quaternions[this.count].folder);
        delete this.quaternions[this.count];
        if (this.count > 0) {
          this.quaternions[this.count - 1].folder.open();
        }
      },
      startAnimation: () => {
        this.options.animate = !this.options.animate;
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
    this.animationFolder.add(this.options, "startAnimation");
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
  resetAnimation() {
    this.sum = 0;
    this.prevQ = new QuaternionAngle(0, 1, 0, 0);
    this.curQ = this.quaternions[0].quaternion;
    this.prevT = 0;
    this.first = true;
    this.cur = 1;
    this.sumQ = 0;
  }
  updateQuaternions() {
    this.quaternions.forEach((val) => {
      val.quaternion.updateValues();
    });
  }
  update(time) {
    if (this.object != null && this.options.animate) {
      if (this.first) {
        this.prevT = time;
        this.first = false;
        this.updateQuaternions();
      }
      let delta = time - this.prevT;
      this.prevT = time;
      this.sum += delta;
      this.sumQ += delta;
      if (this.sum > this.options.animationTime) {
        this.resetAnimation();
        return;
      }
      if (
        this.sum >
        this.cur * (this.options.animationTime / this.quaternions.length)
      ) {
        this.prevQ = this.curQ;
        this.curQ = this.quaternions[this.cur].quaternion;
        this.cur++;
        this.sumQ = 0;
      }
      let t =
        this.sumQ / (this.options.animationTime / this.quaternions.length);
      let pos = this.prevQ.slerp(this.curQ, t);
      this.object.setRotationFromMatrix(pos.matrix);
    }
  }
  addQuaternion() {
    let newQuaternionFolder = this.quaternionFolder.addFolder(
      `Quaternion ${this.count}`
    );
    let attributes = {
      folder: newQuaternionFolder,
      quaternion: new QuaternionAngle(
        DEFAULT_THETA_VALUE + this.count * DEFAULT_THETA_VALUE,
        DEFAULT_X_VALUE +
          this.count * DEFAULT_X_VALUE * ((this.count % 2) * -1),
        DEFAULT_Y_VALUE,
        DEFAULT_Z_VALUE
      ),
    };
    this.quaternions[this.count] = attributes;
    newQuaternionFolder
      .add(
        this.quaternions[this.count].quaternion.a,
        "x",
        MIN_AXIS_VALUE,
        MAX_AXIS_VALUE
      )
      .name("X")
      .listen();
    newQuaternionFolder
      .add(
        this.quaternions[this.count].quaternion.a,
        "y",
        MIN_AXIS_VALUE,
        MAX_AXIS_VALUE
      )
      .name("Y")
      .listen();
    newQuaternionFolder
      .add(
        this.quaternions[this.count].quaternion.a,
        "z",
        MIN_AXIS_VALUE,
        MAX_AXIS_VALUE
      )
      .name("Z")
      .listen();
    newQuaternionFolder
      .add(
        this.quaternions[this.count].quaternion,
        "theta",
        MIN_THETA_VALUE,
        MAX_THETA_VALUE
      )
      .name("Theta")
      .listen();
    newQuaternionFolder.open();
    this.count++;
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
