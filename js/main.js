import * as THREE from "/three/three.module.js";
import * as DAT from "/dat/dat.gui.module.js";

import Stats from "/jsm/libs/stats.module.js";

import { BezierWindow } from "./windows/bezierWindow/bezierWindow.js";
import { ClothWindow } from "./windows/clothWindow/clothWindow.js";
import { QuaternionWindow } from "./windows/quaternionWindow/quaternionWindow.js";

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

var windowInstances = [
    new BezierWindow(renderer),
    new QuaternionWindow(renderer),
    new ClothWindow(renderer),
];

var windowIndecies = {
    bezier: 0,
    quaternion: 1,
    cloth: 2,
};

var globalOptions = {
    window: 0,
};

var stats = new Stats();
stats.showPanel(0);
document.body.appendChild(stats.dom);

var lastTme = 0;

for (let i = 0; i < windowInstances.length; i++) {
    windowInstances[i].hide();
}

var currentWindow = windowInstances[globalOptions.window];
currentWindow.show();

var windowsSelectGui = new DAT.GUI({ autoPlace: false });

var windowFolder = windowsSelectGui.addFolder("Current window");
windowFolder
    .add(globalOptions, "window", windowIndecies)
    .onChange((newWindowIndex) => {
        // hide gui of the old window
        currentWindow.hide();

        // select new window
        currentWindow = windowInstances[newWindowIndex];

        // show gui of the old window
        currentWindow.show();
    });
windowFolder.open();
document
    .getElementById("window-control")
    .appendChild(windowsSelectGui.domElement);

// render loop
function animate(time) {
    stats.begin();
    currentWindow.update(time - lastTme);
    lastTme = time;

    renderer.render(currentWindow.getScene(), currentWindow.getCamera());

    requestAnimationFrame(animate);
    stats.end();
}
requestAnimationFrame(animate);
