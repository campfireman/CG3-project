import * as THREE from "/three/three.module.js";

import { LineMaterial } from "/jsm/lines/LineMaterial.js";
import { LineGeometry } from "/jsm/lines/LineGeometry.js";
import { Line2 } from '/jsm/lines/Line2.js';

class MoveControls {

    constructor(scene) {
        let length = 1;
        let linewidth = 0.01;

        const pointsX = [0, 0, 0, length, 0, 0];
        const pointsY = [0, 0, 0, 0, length, 0];
        const pointsZ = [0, 0, 0, 0, 0, length];
        /*pointsX.push( new THREE.Vector3( 0, 0, 0 ) );
        pointsX.push( new THREE.Vector3( length, 0, 0 ) );

        const pointsY = [];
        pointsY.push( new THREE.Vector3( 0, 0, 0 ) );
        pointsY.push( new THREE.Vector3( 0, length, 0 ) );

        const pointsZ = [];
        pointsZ.push( new THREE.Vector3( 0, 0, 0 ) );
        pointsZ.push( new THREE.Vector3( 0, 0, length ) );*/

        const geometryX = new LineGeometry();
        geometryX.setPositions( pointsX );
        geometryX.setColors( [255, 127, 255, 127, 255, 255] );
        /*const geometryY = new LineGeometry();
        geometryY.setPositions( pointsY );
        const geometryZ = new LineGeometry();
        geometryZ.setPositions( pointsZ );*/

        const materialX = new LineMaterial({
            color: 0xff0000,
            linewidth: linewidth,
            vertexColors: true,
        });
        /*const materialY = new LineMaterial({
            color: 0x00ff00,
            linewidth: linewidth
        });
        const materialZ = new LineMaterial({
            color: 0x0000ff,
            linewidth: linewidth
        });*/

        this.lineX = new Line2( geometryX, materialX );
        //this.lineY = new Line2( geometryY, materialY );
        //this.lineZ = new Line2( geometryZ, materialZ );

        this.lineX.visible = false;
        //this.lineY.visible = false;
        //this.lineZ.visible = false;

        this.lineX.computeLineDistances();
		this.lineX.scale.set( 1, 1, 1 );

        scene.add(this.lineX);
        //scene.add(this.lineY);
        //scene.add(this.lineZ);

        const geo = new THREE.BufferGeometry();
        geo.setAttribute( 'position', new THREE.Float32BufferAttribute( pointsX, 3 ) );
        geo.setAttribute( 'color', new THREE.Float32BufferAttribute( [0, 0, 255, 0, 255, 0], 3 ) );

        let matLineBasic = new THREE.LineBasicMaterial( { vertexColors: true } );
        let matLineDashed = new THREE.LineDashedMaterial( { vertexColors: true, scale: 2, dashSize: 1, gapSize: 1 } );

        let line1 = new THREE.Line( geo, matLineBasic );
        line1.computeLineDistances();
        line1.visible = false;
        scene.add( line1 );
    }

    selectObject(object) {
        this.object = object;

        this.lineX.visible = true;
        //this.lineY.visible = true;
        //this.lineZ.visible = true;
    }



}

export { MoveControls }