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

class BezierWindow extends Window {
	constructor(renderer) {
		super(renderer);

		// flag to remember if an object was moved so it will be not deselected
		this.justMoved = false;
		// flag to remember if the bezier curve is being animated
		this.animating = false;
		// all berstein-curves so they are not recalculated every time
		this.bernsteinCurvesCache = [];

		// objects for casteljau visualization
		this.casteljauLines = [];
		this.casteljauPoints = [];

		// control points for bezier-curve
		this.controlPoints = [];

		// all objects which can be selected
		this.selectionGroup = [];

		// GUI
		this.guiOptions = {
			animationSpeed: 0.0005,
			animationProgress: 0,
			animate: () => {
				this.animating = true;
				this.guiOptions.animationProgress = 0;
			}
		}
		this.gui = new DAT.GUI();
		var windowFolder = this.gui.addFolder("animation");
		windowFolder.add(this.guiOptions, "animationSpeed", 0.00001, 0.001);
		this.progressSlider = windowFolder.add(this.guiOptions, "animationProgress", 0.0, 1.0).step(0.001);
		windowFolder.add(this.guiOptions, "animate");
		windowFolder.open();

		// scene, camera and controls
		this.scene = new THREE.Scene();
		this.scene.add(new THREE.GridHelper(50, 20));

		this.camera = new THREE.PerspectiveCamera(
			75,
			window.innerWidth / window.innerHeight,
			0.1,
			1000
		);
		this.camera.position.z = 5;

		this.orbitControls = new OrbitControls(this.camera, renderer.domElement);
		this.orbitControls.update();

		// init spheres as for control point visualization
		const controlPointGeometry = new THREE.SphereGeometry(0.1, 32, 32);
		const controlPointMaterial = new THREE.MeshBasicMaterial({ color: 0xcf1120 });

		for (let i = 0; i < NUM_CONTROL_POINTS; i++) {
			let sphere = new THREE.Mesh(controlPointGeometry, controlPointMaterial);
			sphere.position.x = i - NUM_CONTROL_POINTS / 2;
			sphere.position.y = i % 2;
			this.scene.add(sphere);
			this.controlPoints.push(sphere);
			this.selectionGroup.push(sphere);
		}

		// init points and lines for the visualization of the casteljau algorithm
		for(let i = 1; i < NUM_CONTROL_POINTS; i++) {
			this.casteljauLines.push([]);
			this.casteljauPoints.push([]);
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

				this.casteljauLines[i-1].push(line);

				let pointGeometry = new THREE.SphereGeometry(0.05, 32, 32);
				let pointMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff });
				let point = new THREE.Mesh(pointGeometry, pointMaterial);

				this.scene.add(point);
				point.visible = true;
				this.casteljauPoints[i-1].push(point);
			}
		}

		// transform controls for moving objects in the scene
		this.control = new TransformControls(this.camera, renderer.domElement);
		this.control.addEventListener("dragging-changed", (event) => {
			this.orbitControls.enabled = !event.value;
		});
		this.scene.add(this.control);

		// object selection on mouse click
		renderer.domElement.addEventListener("click", (ev) => {
			// do not select an object when there is currently other object being moved
			if (this.justMoved) {
				this.justMoved = false;
				return;
			}
			// screen coordinates to NDC
			let x = (ev.clientX / window.innerWidth) * 2 - 1;
			let y = - (ev.clientY / window.innerHeight) * 2 + 1;
			let mouseVector = new THREE.Vector2(x, y);

			// intersect all hit objects
			let raycaster = new THREE.Raycaster();
			raycaster.setFromCamera(mouseVector, this.camera);
			let intersects = raycaster.intersectObjects(this.selectionGroup);

			if (intersects.length == 0) {
				this.control.detach();
				return;
			}

			// select the nearest one and attach controls
			let selectedPoint = intersects[0].object;
			if (selectedPoint.parent.type == "Scene") {
				this.control.attach(selectedPoint);
			} else {
				this.control.attach(selectedPoint.parent);
			}

		}, true);

		// remember if an object was moved so it will be not deselected
		this.control.addEventListener("mouseUp", (ev) => {
			this.justMoved = true;
		});

		// Line for the bezier curve
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

	/**
	 * get called every frame to update the animation
	 * @param {number} time time since the last frame
	 */
	update(time) {
		this.renderer.clearDepth();

		if(this.animating) {
			this.updateBezierCurve(this.guiOptions.animationProgress);

			this.updateBezierControls(this.controlPoints, this.guiOptions.animationProgress);

			this.guiOptions.animationProgress += this.guiOptions.animationSpeed * time;
			this.progressSlider.setValue(this.guiOptions.animationProgress);
		
			if(this.guiOptions.animationProgress >= 1) {
				this.updateBezierCurve(this.guiOptions.animationProgress);
				this.animating = false;
			}

		} else {
			this.updateBezierCurve(1);
			this.updateBezierControls(this.controlPoints, this.guiOptions.animationProgress);
		}
		
	}

	/**
	 * draws a part or whole bezier curve
	 * @param {number} progress normalized value (0-1) representing how much of the bezier curve should be drawn
	 */
	updateBezierCurve(progress) {
		let points = [];
		let colors = [];

		for (let i = 0; i <= STEPS * progress; i++) {
			let point = this.bezier(this.controlPoints, i / STEPS);
			points.push(point.x);
			points.push(point.y);
			points.push(point.z);

			// get the most impactful bernstein curve and set the color accordingly
			let maxBesteinIndex = this.getMaxBernsteinIndex(i / STEPS);
			colors.push(BERSTEIN_COLORS[maxBesteinIndex].r);
			colors.push(BERSTEIN_COLORS[maxBesteinIndex].g);
			colors.push(BERSTEIN_COLORS[maxBesteinIndex].b);
		}

		this.line.geometry.setPositions(points);
		this.line.geometry.setColors(colors);
	}

	/**
	 * draws the visualisation for the casteljau algorithm
	 * @param {[THREE.Mesh]} points control points for the bezeir curve
	 * @param {number} t normalized value representing the point for which the visualization should be drawn.
	 */
	updateBezierControls(points, t) {
		let initialLength = points.length;
		let vectors = [];
		for (let i = 0; i < points.length; i++) {
			vectors.push(points[i].position.clone());
		}

		for (let i = initialLength - 1; i >= 1; i--) {
			for (let j = 0; j < i; j++) {
				
				this.casteljauLines[i-1][j].geometry.setPositions([vectors[j].x,vectors[j].y,vectors[j].z, vectors[j+1].x,vectors[j+1].y,vectors[j+1].z]);

				vectors[j].lerp(vectors[j + 1], t);

				this.casteljauPoints[i-1][j].position.x = vectors[j].x
				this.casteljauPoints[i-1][j].position.y = vectors[j].y
				this.casteljauPoints[i-1][j].position.z = vectors[j].z
			}
		}

		let maxBernsteinIndex = this.getMaxBernsteinIndex(t);
		let color = BERSTEIN_COLORS[maxBernsteinIndex];
		this.casteljauPoints[0][0].material.color.r = color.r;
		this.casteljauPoints[0][0].material.color.g = color.g;
		this.casteljauPoints[0][0].material.color.b = color.b;
	}

	/**
	 * bezier function
	 * @param {[THREE.Mesh]} points control points
	 * @param {number} t variable
	 */
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

	/**
	 * function for calculating berstein polynomials
	 * @param {number} n 
	 * @param {number} k 
	 * @param {number} t 
	 */
	bernsteinPolynomial(n, k, t) {
		let binCoef = PASCALS_TRIANGLE[n][k];
		return binCoef * Math.pow(t, k) * Math.pow(1 - t, n - k);
	}

	/**
	 * calculates the most impactful bernstein polynomial for a given x
	 * @param {number} xNormalized variable between 0-1
	 */
	getMaxBernsteinIndex(xNormalized) {
		let maxBernsteinIndex = 0;
		let position = Math.floor(xNormalized * this.bernsteinCurvesCache[0].length);
		for (let i = 0; i < this.bernsteinCurvesCache.length; i++) {
			if (this.bernsteinCurvesCache[i][position] > this.bernsteinCurvesCache[maxBernsteinIndex][position]) {
				maxBernsteinIndex = i;
			}
		}
		return maxBernsteinIndex;
	}

	/**
	 * caches the bernstein polynomials so they don't have to be calculated every time
	 * @param {number} steps how many steps should be calculated
	 */
	cacheBernsteinCurves(steps) {
		this.bernsteinCurvesCache = [];
		for (let i = 0; i < NUM_CONTROL_POINTS; i++) {
			let points = [];
			for (let j = 0; j <= steps; j++) {
				let y = this.bernsteinPolynomial(NUM_CONTROL_POINTS - 1, i, j / steps);
				points.push(y);
			}
			this.bernsteinCurvesCache.push(points);
		}
	}

	/**
	 * draws the plot with 4 bernstein-curves
	 */
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

		for (let i = 0; i < this.bernsteinCurvesCache.length; i++) {
			let geometry = new LineGeometry();
			let material = new LineMaterial({
				color: BERSTEIN_COLORS[i].getHex(),
				linewidth: 0.003,
				vertexColors: false
			});

			let points = [];
			for (let j = 0; j < this.bernsteinCurvesCache[i].length; j++) {
				points.push(j / this.bernsteinCurvesCache[i].length * PLOT_SIZE);
				points.push(this.bernsteinCurvesCache[i][j] * PLOT_SIZE);
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