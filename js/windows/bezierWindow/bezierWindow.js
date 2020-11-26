import * as THREE from "/three/three.module.js";
import * as DAT from "/dat/dat.gui.module.js";

import { OrbitControls } from "/jsm/controls/OrbitControls.js";
import { TransformControls } from '/jsm/controls/TransformControls.js';
import { Window } from "../window.js";

const NUM_CONTROL_POINTS = 4;

class BezierWindow extends Window {
	constructor(renderer) {
		super(renderer);

		this.justMoved =  false;

		this.guiOptions = {
			
		};

		this.scene = new THREE.Scene();
		this.scene.add( new THREE.GridHelper( 50, 20) );

		this.camera = new THREE.PerspectiveCamera(
			75,
			window.innerWidth / window.innerHeight,
			0.1,
			1000
		);

		this.orbitControls = new OrbitControls(this.camera, renderer.domElement);
		this.orbitControls.update();

		const controlPointGeometry = new THREE.SphereGeometry(0.1, 32, 32);
		const controlPointMaterial = new THREE.MeshBasicMaterial({color: 0xcf1120});

		this.controlPoints = [];
		for(let i = 0; i < NUM_CONTROL_POINTS; i++) {
			let sphere = new THREE.Mesh(controlPointGeometry, controlPointMaterial);
			this.scene.add(sphere);
			this.controlPoints.push(sphere);
		}

		this.control = new TransformControls(this.camera, renderer.domElement);
		this.control.addEventListener("dragging-changed", (event) => {
			this.orbitControls.enabled = !event.value;
		});

		this.scene.add(this.control);

		this.camera.position.z = 5;

		renderer.domElement.addEventListener("click", (ev) => {
			if(this.justMoved) {
				this.justMoved = false;
				return;
			}

			let x = ( ev.clientX / window.innerWidth ) * 2 - 1;
			let y = - ( ev.clientY / window.innerHeight ) * 2 + 1;
			let mouseVector = new THREE.Vector2(x, y);

			let raycaster = new THREE.Raycaster();

			raycaster.setFromCamera(mouseVector, this.camera);
			let intersects = raycaster.intersectObjects(this.controlPoints);

			if(intersects.length == 0) {
				this.control.detach();
				return;
			}
			
			let selectedPoint = intersects[0].object;
			this.control.attach(selectedPoint);

		}, true);

		this.control.addEventListener("mouseUp", (ev) => {
			this.justMoved = true;
		});

		this.gui = new DAT.GUI();
	}

	update(time) {

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
