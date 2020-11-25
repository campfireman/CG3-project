import { GUI } from "../../libJs/dat.gui.module.js";
import { WebGLRenderer } from "../libJs/three.module.js";
import { BezierWindow } from "./windows/bezierWindow/bezierWindow.js";
import { QuaternionWindow } from "./windows/quaternionWindow/quaternionWindow.js";

var windowInstances = [
	new BezierWindow(),
	new QuaternionWindow()
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

var windowsSelectGui = new GUI();

var windowFolder = windowsSelectGui.addFolder("Current window");
windowFolder.add(globalOptions, "window", windowIndecies).onChange((newWindowIndex) => {
	currentWindow.getGUI().hide();

	currentWindow = windowInstances[newWindowIndex];

	currentWindow.getGUI().show();
});
windowFolder.open();

const renderer = new WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

function animate(time) {
	currentWindow.update(time);

	renderer.render(currentWindow.getScene(), currentWindow.getCamera());

	requestAnimationFrame(animate);
}
requestAnimationFrame(animate);
