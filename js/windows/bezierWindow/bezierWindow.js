import * as THREE from "/three/three.module.js";
import * as DAT from "/dat/dat.gui.module.js";

import { OrbitControls } from "/jsm/controls/OrbitControls.js";
import { TransformControls } from '/jsm/controls/TransformControls.js';
import { LineMaterial } from "/jsm/lines/LineMaterial.js";
import { LineGeometry } from "/jsm/lines/LineGeometry.js";
import { Line2 } from '/jsm/lines/Line2.js';

import { Window } from "../window.js";

const PLOT_SIZE = 5;
const PLOT_ORIGIN = new THREE.Vector3(-PLOT_SIZE / 2, 0, -4);
const STEPS = 100;

const BERSTEIN_COLORS = [
	new THREE.Color(0x0033cc),
	new THREE.Color(0x33cc33),
	new THREE.Color(0xff3300),
	new THREE.Color(0xcc00ff)
];

const NUM_CONTROL_POINTS = 4;
const PASCALS_TRIANGLE = [
	[1],
	[1, 1],
	[1, 2, 1],
	[1, 3, 3, 1],
	[1, 4, 6, 4, 1],
	[1, 5, 10, 10, 5, 1]
];

var bernsteinCurvesCache = [];

var animating = false;
var dragging = false;
var casteljauLines = [];
var casteljauPoints = [];
var guiOptions = {
	animationSpeed: 0.0005,
	animationProgress: 0,
	animate: function() {
		animating = true;
		dragging = false;
		guiOptions.animationProgress = 0;
		/*for(let i = 0; i < casteljauLines.length; i++) {
			for(let j = 0; j < casteljauLines[i].length; j++) {
				casteljauLines[i][j].visible = true;
				casteljauPoints[i][j].visible = true;
			}
		}*/
	}
}

class BezierWindow extends Window {
	constructor(renderer) {
		super(renderer);

		this.justMoved = false;

		this.gui = new DAT.GUI();

		var windowFolder = this.gui.addFolder("animation");
		windowFolder.add(guiOptions, "animationSpeed", 0.00001, 0.001);
		this.progressSlider = windowFolder.add(guiOptions, "animationProgress", 0.0, 1.0).step(0.001);
		this.progressSlider.onChange((newValue) => {
			if(!animating) {
				dragging = true;
			}
		});

		windowFolder.add(guiOptions, "animate");

		windowFolder.open();

		this.scene = new THREE.Scene();
		this.scene.add(new THREE.GridHelper(50, 20));

		this.camera = new THREE.PerspectiveCamera(
			75,
			window.innerWidth / window.innerHeight,
			0.1,
			1000
		);

		this.orbitControls = new OrbitControls(this.camera, renderer.domElement);
		this.orbitControls.update();

		const controlPointGeometry = new THREE.SphereGeometry(0.1, 32, 32);
		const controlPointMaterial = new THREE.MeshBasicMaterial({ color: 0xcf1120 });

		this.controlPoints = [];
		this.selectionGroup = [];
		for (let i = 0; i < NUM_CONTROL_POINTS; i++) {
			let sphere = new THREE.Mesh(controlPointGeometry, controlPointMaterial);
			sphere.position.x = i;
			sphere.position.y = i % 2;
			this.scene.add(sphere);
			this.controlPoints.push(sphere);
			this.selectionGroup.push(sphere);
		}

		for(let i = 1; i < NUM_CONTROL_POINTS; i++) {
			casteljauLines.push([]);
			casteljauPoints.push([]);
			for(let j = 0; j < i; j++) {
				let casteljauGeometry = new LineGeometry();
				let invertedCounter = NUM_CONTROL_POINTS - i;
				let casteljauMaterial = new LineMaterial({
					color: new THREE.Color(invertedCounter / NUM_CONTROL_POINTS, invertedCounter / NUM_CONTROL_POINTS, invertedCounter / NUM_CONTROL_POINTS),
					linewidth: 0.0015,
					vertexColors: false,
				});

				let line = new Line2(casteljauGeometry, casteljauMaterial);
				line.visible = true;
				this.scene.add(line);

				casteljauLines[i-1].push(line);

				let pointGeometry = new THREE.SphereGeometry(0.05, 32, 32);
				let pointMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff });
				let point = new THREE.Mesh(pointGeometry, pointMaterial);

				this.scene.add(point);
				point.visible = true;
				casteljauPoints[i-1].push(point);
			}
		}

		this.control = new TransformControls(this.camera, renderer.domElement);
		this.control.addEventListener("dragging-changed", (event) => {
			this.orbitControls.enabled = !event.value;
		});

		this.scene.add(this.control);

		this.camera.position.z = 5;

		renderer.domElement.addEventListener("click", (ev) => {
			if (this.justMoved) {
				this.justMoved = false;
				return;
			}

			let x = (ev.clientX / window.innerWidth) * 2 - 1;
			let y = - (ev.clientY / window.innerHeight) * 2 + 1;
			let mouseVector = new THREE.Vector2(x, y);

			let raycaster = new THREE.Raycaster();

			raycaster.setFromCamera(mouseVector, this.camera);
			let intersects = raycaster.intersectObjects(this.selectionGroup);

			if (intersects.length == 0) {
				this.control.detach();
				return;
			}
			let selectedPoint = intersects[0].object;
			if (selectedPoint.parent.type == "Scene") {
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
		//console.log(animating + "  " + dragging);
		if(animating) {
			this.updateBezierCurve(guiOptions.animationProgress);

			this.updateBezierControls(this.controlPoints, guiOptions.animationProgress);

			guiOptions.animationProgress += guiOptions.animationSpeed * time;
			this.progressSlider.setValue(guiOptions.animationProgress);
		
			if(guiOptions.animationProgress >= 1) {
				this.updateBezierCurve(guiOptions.animationProgress);
				animating = false;
				//guiOptions.animationProgress = 0;
				//this.progressSlider.setValue(guiOptions.animationProgress);
			}

		} else {
			this.updateBezierCurve(1);
			this.updateBezierControls(this.controlPoints, guiOptions.animationProgress);
		}
		
	}

	updateBezierCurve(progress) {
		let points = [];
		let colors = [];

		for (let i = 0; i <= STEPS * progress; i++) {
			let point = this.bezier(this.controlPoints, i / STEPS);
			points.push(point.x);
			points.push(point.y);
			points.push(point.z);

			let maxBesteinIndex = this.getMaxBernsteinIndex(i / STEPS);

			colors.push(BERSTEIN_COLORS[maxBesteinIndex].r);
			colors.push(BERSTEIN_COLORS[maxBesteinIndex].g);
			colors.push(BERSTEIN_COLORS[maxBesteinIndex].b);
		}

		this.line.geometry.setPositions(points);
		this.line.geometry.setColors(colors);
	}

	updateBezierControls(points, t) {
		let initialLength = points.length;
		let vectors = [];
		for (let i = 0; i < points.length; i++) {
			vectors.push(points[i].position.clone());
		}

		for (let i = initialLength - 1; i >= 1; i--) {
			for (let j = 0; j < i; j++) {
				if(animating || dragging) {
					casteljauLines[i-1][j].geometry.setPositions([vectors[j].x,vectors[j].y,vectors[j].z, vectors[j+1].x,vectors[j+1].y,vectors[j+1].z]);
				}

				vectors[j].lerp(vectors[j + 1], t);

				if(animating || dragging) {
					casteljauPoints[i-1][j].position.x = vectors[j].x
					casteljauPoints[i-1][j].position.y = vectors[j].y
					casteljauPoints[i-1][j].position.z = vectors[j].z
				}
			}
		}

		if(animating || dragging) {
			let maxBernsteinIndex = this.getMaxBernsteinIndex(t);
			let color = BERSTEIN_COLORS[maxBernsteinIndex];
			casteljauPoints[0][0].material.color.r = color.r;
			casteljauPoints[0][0].material.color.g = color.g;
			casteljauPoints[0][0].material.color.b = color.b;
		}
	}

	bezier(points, t) {
		let initialLength = points.length;
		let vectors = [];
		for (let i = 0; i < points.length; i++) {
			vectors.push(points[i].position.clone());
		}

		for (let i = initialLength - 1; i >= 1; i--) {
			for (let j = 0; j < i; j++) {
				vectors[j].lerp(vectors[j + 1], t);
			}
		}
		return vectors[0];
	}

	getMaxBernsteinIndex(xNormalized) {
		let maxBernsteinIndex = 0;
		let position = Math.floor(xNormalized * bernsteinCurvesCache[0].length);
		for (let i = 0; i < bernsteinCurvesCache.length; i++) {
			if (bernsteinCurvesCache[i][position] > bernsteinCurvesCache[maxBernsteinIndex][position]) {
				maxBernsteinIndex = i;
			}
		}
		return maxBernsteinIndex;
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
			for (let j = 0; j < bernsteinCurvesCache[i].length; j++) {
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
			for (let j = 0; j <= steps; j++) {
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