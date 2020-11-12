import { GLTFLoader } from "../../libJs/GLTFLoader.js";
import {
  AmbientLight,
  PerspectiveCamera,
  Scene,
} from "../../libJs/three.module.js";

const MODEL_PATH = "../../models/";

class QuaternionWindow extends Window {
  constructor() {
    super();
    this.options = {
      velx: 0,
      vely: 0,
      camera: {
        speed: 0.0001,
      },
      stop: function () {
        this.velx = 0;
        this.vely = 0;
      },
      reset: function () {
        this.velx = 0.1;
        this.vely = 0.1;
        camera.position.z = 75;
        camera.position.x = 0;
        camera.position.y = 0;
        cube.scale.x = 1;
        cube.scale.y = 1;
        cube.scale.z = 1;
        cube.material.wireframe = true;
      },
    };

    // scene
    this.scene = new Scene();
    const color = 0xffffff;
    const intensity = 1;
    this.scene.add(new AmbientLight(color, intensity));

    // camera
    this.camera = new PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    this.camera.position.z = 5;

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
    this.gui = new dat.GUI();

    var cam = this.gui.addFolder("Camera");
    cam.add(this.camera.position, "y", 0, 100).listen();
    cam.open();

    var velocity = this.gui.addFolder("Velocity");
    velocity.add(this.options, "velx", -0.2, 0.2).name("X").listen();
    velocity.add(this.options, "vely", -0.2, 0.2).name("Y").listen();
    velocity.open();
  }

  update(time) {
    if (this.object != null) {
      this.object.rotation.x += this.options.velx;
      this.object.rotation.y += this.options.vely;
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
