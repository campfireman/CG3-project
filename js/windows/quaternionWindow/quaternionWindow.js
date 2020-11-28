import { GUI } from "../../../libJs/dat.gui.module.js";
import { GLTFLoader } from "../../../libJs/GLTFLoader.js";
import {
  AmbientLight,
  GridHelper,
  PerspectiveCamera,
  Scene,
  Vector3,
} from "../../../libJs/three.module.js";
import { Window } from "../window.js";
import { QuaternionCustom as Quaternion } from "./Quaternion.js";
import { OrbitControls } from "/jsm/controls/OrbitControls.js";

const MODEL_PATH = "../../../models/";

const MIN_AXIS_VALUE = -10.0;
const MIN_THETA_VALUE = 0.0;

const MAX_AXIS_VALUE = 10.0;
const MAX_THETA_VALUE = 2.0;

const DEFAULT_X_VALUE = 1.0;
const DEFAULT_Y_VALUE = 1.0;
const DEFAULT_Z_VALUE = 1.0;
const DEFAULT_THETA_VALUE = 0.5;

class QuaternionWindow extends Window {
  constructor(renderer) {
    super(renderer);
    this.count = 0;
    this.options = {
      velx: 0,
      vely: 0,
      count: 0,
      camera: {
        speed: 0.0001,
      },
      addQuaternion: () => {
        if (this.count > 0) {
          this.quaternions[this.count - 1].folder.close();
        }
        let newQuaternionFolder = this.quaternionFolder.addFolder(
          `Quaternion ${this.count}`
        );
        let attributes = {
          folder: newQuaternionFolder,
          quaternion: new Quaternion(
            new Vector3(DEFAULT_X_VALUE, DEFAULT_Y_VALUE, DEFAULT_Z_VALUE),
            DEFAULT_THETA_VALUE
          ),
        };
        this.quaternions[this.count] = attributes;
        newQuaternionFolder
          .add(
            this.quaternions[this.count].quaternion,
            "x",
            MIN_AXIS_VALUE,
            MAX_AXIS_VALUE
          )
          .name("X")
          .listen();
        newQuaternionFolder
          .add(
            this.quaternions[this.count].quaternion,
            "y",
            MIN_AXIS_VALUE,
            MAX_AXIS_VALUE
          )
          .name("Y")
          .listen();
        newQuaternionFolder
          .add(
            this.quaternions[this.count].quaternion,
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
      },
      removeQuaternion: () => {
        if (this.count == 0) {
          return;
        }
        this.count--;
        this.quaternionFolder.removeFolder(this.quaternions[this.count].folder);
        delete this.quaternions[this.count];
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
    this.quaternions = {};

    this.quaternionFolder
      .add(this.options, "addQuaternion")
      .name("Add quaternion");
    this.quaternionFolder
      .add(this.options, "removeQuaternion")
      .name("Remove quaternion");
    this.quaternionFolder.open();
  }

  update(time) {
    if (this.object != null) {
    }
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
