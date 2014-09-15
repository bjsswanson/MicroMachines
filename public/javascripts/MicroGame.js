var scene = new THREE.Scene();
var camera = createCamera();
var renderer = createRenderer();
var world = {
	camera: camera,
	scene: scene,
	cars: [],
	surfaces: [createGround()],
	obstacles: []
}

MicroMachines.Loader.load("/levels/test.json", world, function(){
	animate();
});

function animate() {
	requestAnimationFrame( animate );
	update();
	renderer.render(scene, camera);
}

function update() {
	var cars = world.cars;
	var obstacles = world.obstacles;
	var surfaces = world.surfaces;

	for(var i in cars){
		cars[i].update(surfaces, obstacles);
	}

	if(cars.length > 0){
		camera.lookAt(cars[0].position); //this needs to work with multiple cars
		for(var i in obstacles){
			obstacles[i].update(camera, cars[0]); //this needs to work with multiple cars
		}
	}
}

function createGround() {
	var geometry = new THREE.PlaneGeometry( 50, 50 );
	var material = new THREE.MeshBasicMaterial( {color: 0x999999, side: THREE.DoubleSide} );
	var plane = new THREE.Mesh( geometry, material );

	plane.receiveShadow = true;
	plane.position.set(8, -20, -10);
	plane.rotateOnAxis(new THREE.Vector3(1, 0, 0), THREE.Math.degToRad(90));

	scene.add( plane );

	return new MicroMachines.Surface( plane );
}

function createCamera() {
	return new THREE.PerspectiveCamera(45, window.innerWidth/window.innerHeight, 0.01, 10000);
}

function createRenderer() {
	var renderer = new THREE.WebGLRenderer({ antialiasing: true });

	renderer.setClearColor( 0xffffff, 1 );
	renderer.setSize(window.innerWidth, window.innerHeight);
	renderer.shadowMapEnabled = true;
	renderer.shadowMapSoft = true;
	renderer.shadowMapCullFrontFaces = false;

	document.body.appendChild(renderer.domElement);

	return renderer;
}

window.addEventListener( 'resize', onWindowResize, false );

function onWindowResize() {
	camera.aspect = window.innerWidth / window.innerHeight;
	camera.updateProjectionMatrix();
	renderer.setSize( window.innerWidth, window.innerHeight );
}