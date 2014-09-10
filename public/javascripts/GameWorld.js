var scene = new THREE.Scene();
var camera = createCamera();
var renderer = createRenderer();
var light  = createLight();

var cars = [];
var groundMeshes = [createGround()];
var obstacles = [];

var jsonLoader = new THREE.JSONLoader();
jsonLoader.load( "/models/buggy/buggy.json", createCar );
jsonLoader.load( "/models/table/table.json", createTable );

animate();

function update() {
	for(var i in cars){
		cars[i].update(groundMeshes, obstacles);
	}

	if(cars.length > 0){
		camera.lookAt(cars[0].getPosition()); //this needs to work with multiple cars
		for(var i in obstacles){
			obstacles[i].update(camera, cars[0]); //this needs to work with multiple cars
		}
	}
}

function animate() {
	requestAnimationFrame( animate );
	update();
	renderer.render(scene, camera);
}

function createTable( geometry, materials ) {
	var mesh = createModel( geometry, materials);
	mesh.scale.set(3, 3, 3);
	mesh.position.set(20, -20, 0);
	mesh.castShadow = true;
	mesh.receiveShadow = true;
	mesh.material.transparent = true;
	mesh.material.materials[0].transparent = true

	var table = new MicroMachines.Obstacle( mesh );
	scene.add(table.mesh);

	groundMeshes.push( table.mesh );
	obstacles.push( table );
}

function createCar( geometry, materials) {
	var mesh = createModel( geometry, materials, 1);
	mesh.scale.set(0.5,0.5, 0.5);
	mesh.position.set(10, 0, -20);
	scene.add(mesh);

	var car = new MicroMachines.Car( mesh );
	car.init();
	cars.push(car);
}

function createGround() {
	var geometry = new THREE.PlaneGeometry( 50, 50 );
	var material = new THREE.MeshBasicMaterial( {color: 0x999999, side: THREE.DoubleSide} );

	var plane = new THREE.Mesh( geometry, material );
	plane.receiveShadow = true;
	plane.position.set(8, -20, -10);
	plane.rotateOnAxis(new THREE.Vector3(1, 0, 0), THREE.Math.degToRad(90));
	scene.add( plane );

	return plane;
}

function createModel( geometry, materials ) {
	return new THREE.Mesh( geometry, new THREE.MeshFaceMaterial( materials ) );
}

function createCamera() {
	var camera = new THREE.PerspectiveCamera(45, window.innerWidth/window.innerHeight, 0.01, 10000);
	camera.position.set( -20, 40, 20);
	return camera;
}

function createRenderer() {
	var renderer = new THREE.WebGLRenderer({ antialiasing: true });
	renderer.setClearColor( 0xffffff, 1 );
	renderer.shadowMapEnabled = true;
	renderer.shadowMapSoft = true;
	renderer.shadowMapCullFrontFaces = false;
	renderer.setSize(window.innerWidth, window.innerHeight);
	document.body.appendChild(renderer.domElement);
	return renderer;
}

function createLight() {
	var ambient = new THREE.AmbientLight( 0xffffff );
	var spot = new THREE.SpotLight( 0xffffff );
	spot.castShadow = true;
	spot.position.set(0, 50, 0);
	scene.add(spot);
	scene.add(ambient);
}

window.addEventListener( 'resize', onWindowResize, false );

function onWindowResize() {
	camera.aspect = window.innerWidth / window.innerHeight;
	camera.updateProjectionMatrix();
	renderer.setSize( window.innerWidth, window.innerHeight );
}

//function drawLine( raycaster ) {
//	var material = new THREE.LineBasicMaterial({
//		color: 0x0000ff
//	});
//
//	var geometry = new THREE.Geometry();
//
//	var origin = raycaster.ray.origin;
//	var direction = raycaster.ray.direction;
//
//	geometry.vertices.push(origin);
//	geometry.vertices.push(_vector3.addVectors(origin, direction));
//	var line = new THREE.Line(geometry, material);
//
//	scene.add(line);
//}