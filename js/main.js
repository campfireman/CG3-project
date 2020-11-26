import * as THREE from "/three/three.module.js";
import * as DAT from "/dat/dat.gui.module.js";

//import { GUI } from "../../libJs/dat.gui.module.js";
//import { TetrahedronGeometry, WebGLRenderer } from "../libJs/three.module.js";
import { BezierWindow } from "./windows/bezierWindow/bezierWindow.js";
import { QuaternionWindow } from "./windows/quaternionWindow/quaternionWindow.js";

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

var windowInstances = [
	new BezierWindow(renderer),
	new QuaternionWindow(renderer)
]

var windowIndecies = {
	bezier: 0,
	quaternion: 1
};

var globalOptions = {
	window: 0
};

for(let i = 0; i < windowInstances.length; i++) {
	windowInstances[i].getGUI().hide();
}

var currentWindow = windowInstances[globalOptions.window];
currentWindow.getGUI().show();

var windowsSelectGui = new DAT.GUI();

var windowFolder = windowsSelectGui.addFolder("Current window");
windowFolder.add(globalOptions, "window", windowIndecies).onChange((newWindowIndex) => {
	currentWindow.getGUI().hide();

	currentWindow = windowInstances[newWindowIndex];

	currentWindow.getGUI().show();
});
windowFolder.open();

function animate(time) {
	currentWindow.update(time);

	renderer.render(currentWindow.getScene(), currentWindow.getCamera());

	requestAnimationFrame(animate);
}
requestAnimationFrame(animate);
