import { BezierWindow } from "./windows/bezierWindow/bezierWindow.js";
import { QuaternionWindow } from "./windows/quaternionWindow/quaternionWindow.js";

import * as DAT from "/dat/dat.gui.module.js";
import * as THREE from "/three/three.module.js";

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

var windowInstances = [
    new BezierWindow(renderer),
    new QuaternionWindow(renderer),
];

var windowIndecies = {
    bezier: 0,
    quaternion: 1,
};

var globalOptions = {
    window: 1,
};

var lastTme = 0;

for (let i = 0; i < windowInstances.length; i++) {
    windowInstances[i].getGUI().hide();
}

var currentWindow = windowInstances[globalOptions.window];
currentWindow.getGUI().show();

var windowsSelectGui = new DAT.GUI({ autoPlace: false });

var windowFolder = windowsSelectGui.addFolder("Current window");
windowFolder
    .add(globalOptions, "window", windowIndecies)
    .onChange((newWindowIndex) => {
        currentWindow.getGUI().hide();

        currentWindow = windowInstances[newWindowIndex];

        currentWindow.getGUI().show();
    });
windowFolder.open();
document
    .getElementById("window-control")
    .appendChild(windowsSelectGui.domElement);

function animate(time) {
    currentWindow.update(time - lastTme);
    lastTme = time;

    renderer.render(currentWindow.getScene(), currentWindow.getCamera());

    requestAnimationFrame(animate);
}
requestAnimationFrame(animate);
