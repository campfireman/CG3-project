

var mainWindow = new BezierWindow();

const renderer = new THREE.WebGLRenderer();
renderer.setSize( window.innerWidth, window.innerHeight );
document.body.appendChild( renderer.domElement );

function animate(time) {

    mainWindow.update(time);

    renderer.render(mainWindow.getScene(), mainWindow.getCamera());

    requestAnimationFrame(animate);

};
requestAnimationFrame(animate);