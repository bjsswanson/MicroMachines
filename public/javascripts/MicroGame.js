var scene = new THREE.Scene();
var camera = createCamera();
var renderer = createRenderer();
var world = {
	camera: camera,
	scene: scene,
	cars: [],
	surfaces: [],
	obstacles: [],
	ramps: [],
	waypoints: []
}

MicroMachines.Loader.loadLevel("/levels/test.json", world, function(){
	MicroMachines.Loader.loadCar("/cars/testCar.json", function( car ){	});
	requestAnimationFrame( animate );	
});


function animate() {
	update();
	renderer.render(scene, camera);
	requestAnimationFrame( animate );
}

function update() {
	var cars = world.cars;
	var obstacles = world.obstacles;
	var surfaces = world.surfaces;

	for (var i in cars) {
		cars[i].update( world );
	}

	//updateCamera( cars );

	for(var i in cars){
		for (var j in obstacles) {
			obstacles[j].update(camera, cars[i]);
		}
	}
}

function updateCamera( cars ){
	//TODO Chloe: Camera needs to look at the average position of cars
	//TODO Chloe: Camera needs to bias towards first place car (Need to figure out which car is first)
	
	if(cars.length > 0) {
		camera.lookAt(cars[0].position); //this needs to work with multiple cars
		camera.position.copy(cars[0].position.clone().add(new THREE.Vector3(-8, 16, 8)));
	}
}

function createCamera() {
	var camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.01, 1000);
	camera.position.set(-8, 30, 8);
	camera.lookAt(new THREE.Vector3(0, 0, -10));
	return  camera;
}

function createRenderer() {
	var renderer = new THREE.WebGLRenderer({ antialiasing: false });

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