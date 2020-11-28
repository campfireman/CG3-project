import * as THREE from "/three/three.module.js";
import * as DAT from "/dat/dat.gui.module.js";

import { OrbitControls } from "/jsm/controls/OrbitControls.js";
import { TransformControls } from '/jsm/controls/TransformControls.js';
import { LineMaterial } from "/jsm/lines/LineMaterial.js";
import { LineGeometry } from "/jsm/lines/LineGeometry.js";
import { Line2 } from '/jsm/lines/Line2.js';

import { Window } from "../window.js";

const PLOT_SIZE = 10;
const PLOT_ORIGIN = new THREE.Vector3(-PLOT_SIZE / 2, 0, -4);
const STEPS = 50;

/*const BERSTEIN_COLORS = [
	new THREE.Color(0x0033cc),
	new THREE.Color(0x33cc33),
	new THREE.Color(0xff3300),
	new THREE.Color(0xcc00ff)
];*/

const BERSTEIN_COLORS = [
	new THREE.Color(0xff0000),
	new THREE.Color(0x00ff00),
	new THREE.Color(0x0000ff),
	new THREE.Color(0xffffff)
];

const NUM_CONTROL_POINTS = 4;
const PASCALS_TRIANGLE = [
	[1],
    [1,1],
    [1,2,1],
    [1,3,3,1],
    [1,4,6,4,1],
    [1,5,10,10,5,1]
];

var bernsteinCurvesCache = [];

class BezierWindow extends Window {
	constructor(renderer) {
		super(renderer);

		this.justMoved =  false;

		this.guiOptions = {

		};

		this.gui = new DAT.GUI();

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
		this.selectionGroup = [];
		for(let i = 0; i < NUM_CONTROL_POINTS; i++) {
			let sphere = new THREE.Mesh(controlPointGeometry, controlPointMaterial);
			sphere.position.x = i;
			sphere.position.y = i % 2;
			this.scene.add(sphere);
			this.controlPoints.push(sphere);
			this.selectionGroup.push(sphere);
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
			let intersects = raycaster.intersectObjects(this.selectionGroup);

			if(intersects.length == 0) {
				this.control.detach();
				return;
			}
			let selectedPoint = intersects[0].object;
			if(selectedPoint.parent.type == "Scene") {
				this.control.attach(selectedPoint);
			} else {
				this.control.attach(selectedPoint.parent);
			}
			

		}, true);

		this.control.addEventListener("mouseUp", (ev) => {
			this.justMoved = true;
		});

		let geometry = new LineGeometry();

		let material = new LineMaterial({
            linewidth: 0.003,
            vertexColors: true,
		});

		this.line = new Line2(geometry, material);
		this.scene.add(this.line);

		this.cacheBernsteinCurves(STEPS);
		this.plotBernstein();
	}

	update(time) {
		this.renderer.clearDepth();
		let points = [];
		let colors = [];

		for(let i = 0; i <= STEPS; i++) {
			let point = this.bezier(this.controlPoints, i / STEPS);
			points.push(point.x);
			points.push(point.y);
			points.push(point.z);

			let maxBernsteinIndex = 0;
			for(let j = 0; j < bernsteinCurvesCache.length; j++) {
				if(bernsteinCurvesCache[j][i] > bernsteinCurvesCache[maxBernsteinIndex][i]) {
					maxBernsteinIndex = j;
				}
			}

			colors.push(BERSTEIN_COLORS[maxBernsteinIndex].r);
			colors.push(BERSTEIN_COLORS[maxBernsteinIndex].g);
			colors.push(BERSTEIN_COLORS[maxBernsteinIndex].b);
			/*colors.push(0x000000);
			colors.push(0xff);
			colors.push(0x000000);*/
		}
		
		this.line.geometry.setPositions(points);
		this.line.geometry.setColors(colors);

	}

	bezier(points, t) {
		let initialLength = points.length;
		let vectors = [];
		for(let i = 0; i < points.length; i++) {
			vectors.push(points[i].position.clone());
		}

		for(let i = initialLength - 1; i >= 1; i--) {
			for(let j = 0; j < i; j++) {
				vectors[j].lerp(vectors[j + 1], t);
			}
		}

		return vectors[0];
	}

	plotBernstein() {
		this.plot = new THREE.Group();

		let xAxis = new THREE.ArrowHelper(
			new THREE.Vector3(1, 0, 0),
			new THREE.Vector3(0, 0, 0),
			PLOT_SIZE + 1,
			0xffffff,
			0.1 * PLOT_SIZE,
			0.1 * 0.1 * PLOT_SIZE
		);
		this.plot.add(xAxis);

		let yAxis = new THREE.ArrowHelper(
			new THREE.Vector3(0, 1, 0),
			new THREE.Vector3(0, 0, 0),
			PLOT_SIZE + 1,
			0xffffff,
			0.1 * PLOT_SIZE,
			0.1 * 0.1 * PLOT_SIZE
		);
		this.plot.add(yAxis);

		for (let i = 0; i < bernsteinCurvesCache.length; i++) {
			let geometry = new LineGeometry();
			let material = new LineMaterial({
				color: BERSTEIN_COLORS[i].getHex(),
				linewidth: 0.003,
				vertexColors: false
			});
			
			let points = [];
			for(let j = 0; j < bernsteinCurvesCache[i].length; j++) {
				points.push(j / bernsteinCurvesCache[i].length * PLOT_SIZE);
				points.push(bernsteinCurvesCache[i][j] * PLOT_SIZE);
				points.push(0);
			}
			geometry.setPositions(points);
			let bernsteinLine = new Line2(geometry, material);

			this.plot.add(bernsteinLine);
		}

		let selectionPlaneGeometry = new THREE.PlaneGeometry(PLOT_SIZE, PLOT_SIZE);
		let selectionPlaneMaterial = new THREE.MeshBasicMaterial({
			color: 0xffff00, 
			side: THREE.DoubleSide,
			visible: false
		});
		let selectionPlane = new THREE.Mesh(selectionPlaneGeometry, selectionPlaneMaterial);
		selectionPlane.position.x += PLOT_SIZE / 2;
		selectionPlane.position.y += PLOT_SIZE / 2;
		selectionPlane.material.transparent = true;
		this.plot.add(selectionPlane);

		this.selectionGroup.push(selectionPlane);

		this.plot.position.x = PLOT_ORIGIN.x;
		this.plot.position.y = PLOT_ORIGIN.y;
		this.plot.position.z = PLOT_ORIGIN.z;

		this.scene.add(this.plot);
	}

	cacheBernsteinCurves(steps) {
		bernsteinCurvesCache = [];
		for (let i = 0; i < NUM_CONTROL_POINTS; i++) {
			let points = [];
			for(let j = 0; j <= steps; j++) {
				let y = this.bernsteinPolynomial(NUM_CONTROL_POINTS - 1, i, j / steps);
				points.push(y);
			}
			bernsteinCurvesCache.push(points);
		}
	}

	bernsteinPolynomial(n, k, t) {
		let binCoef = PASCALS_TRIANGLE[n][k];
		return binCoef * Math.pow(t, k) * Math.pow(1 - t, n - k);
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