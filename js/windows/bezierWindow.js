import { GUI } from "../../libJs/dat.gui.module.js";
import {
  BoxGeometry,
  Mesh,
  MeshBasicMaterial,
  PerspectiveCamera,
  Scene,
} from "../../libJs/three.module.js";
import { Window } from "./window.js";

class BezierWindow extends Window {
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

    this.scene = new Scene();
    this.camera = new PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );

    this.geometry = new BoxGeometry();
    this.material = new MeshBasicMaterial({ color: 0x00ff00 });
    this.cube = new Mesh(this.geometry, this.material);
    this.scene.add(this.cube);

    this.camera.position.z = 5;

    this.gui = new GUI();

    var cam = this.gui.addFolder("Camera");
    cam.add(this.options.camera, "speed", 0, 0.001).listen();
    cam.add(this.camera.position, "y", 0, 100).listen();
    cam.open();

    var velocity = this.gui.addFolder("Velocity");
    velocity.add(this.options, "velx", -0.2, 0.2).name("X").listen();
    velocity.add(this.options, "vely", -0.2, 0.2).name("Y").listen();
    velocity.open();

    var box = this.gui.addFolder("Cube");
    box.add(this.cube.scale, "x", 0, 3).name("Width").listen();
    box.add(this.cube.scale, "y", 0, 3).name("Height").listen();
    box.add(this.cube.scale, "z", 0, 3).name("Length").listen();
    box.add(this.cube.material, "wireframe").listen();
    box.open();

    this.gui.add(this.options, "stop");
    this.gui.add(this.options, "reset");
  }

  update(time) {
    this.cube.rotation.x += this.options.velx;
    this.cube.rotation.y += this.options.vely;
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
export { BezierWindow };
