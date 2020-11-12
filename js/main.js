import { WebGLRenderer } from "../libJs/three.module.js";
import { BezierWindow } from "./windows/bezierWindow.js";
import { QuaternionWindow } from "./windows/quaternionWindow.js";

var mainWindow = new BezierWindow();
mainWindow.hideGUI();
var mainWindow = new QuaternionWindow();

const renderer = new WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

function animate(time) {
  mainWindow.update(time);

  renderer.render(mainWindow.getScene(), mainWindow.getCamera());

  requestAnimationFrame(animate);
}
requestAnimationFrame(animate);
