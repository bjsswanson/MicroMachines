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
	waypoints: [],
	prevWaypoint: undefined,
	nextWaypoint: undefined
}

MicroMachines.Loader.loadLevel("/levels/test.json", world, function(){

	MicroMachines.Loader.loadCar("/cars/buggy_blue.json", function( car ){	});
	MicroMachines.Loader.loadCar("/cars/buggy_red.json", function( car ){	});

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

	updateCamera( cars );

	for(var i in cars) {
		for (var j in obstacles) {
			obstacles[j].update(camera, cars[i]);
		}
	}

	gameplay( cars );
}

function gameplay( cars ) {
	for(var i in cars) {
		tooFarFromLeadCar(cars, i);
		onGround(cars, i);
		//notVisible(cars, i);
	}
}

function tooFarFromLeadCar(cars, i) {
	var closestCar = world.nextWaypoint.getClosestCar();
	var distanceToLeader = closestCar.position.distanceTo(cars[i].position);

	if (distanceToLeader > 30) {
		decreaseScore(i);
		world.prevWaypoint.resetCars();
	}
}
function onGround(cars, i) {
	if (cars[i].position.y < 2) {
		decreaseScore(i);
		world.prevWaypoint.resetCars();
	}
}

function notVisible(cars, i) {
	if (!cars[i].isVisible(world.camera)) {
		world.prevWaypoint.resetCars();
	}
}

function decreaseScore( index ){
	$(".player").eq(index).find('span:last').remove()
}

function updateCamera( cars ){
	if(cars.length > 0) {
		var avgPos = calculateAveragePosition( cars );
		camera.lookAt(avgPos);
		//camera.position.copy(avgPos.clone().add(new THREE.Vector3(-8, 16, 8)));
		camera.position.copy(avgPos.clone().add(new THREE.Vector3(-4, 16, 4)));
		//camera.position.copy(avgPos.clone().add(new THREE.Vector3(-2, 16, 2)));
	}
}

function calculateAveragePosition( cars ){
	var weight = cars.length;
	//var closestCar = world.nextWaypoint.getClosestCar();
	//var avgPos = closestCar.position.clone().multiplyScalar(weight);
	var avgPos = new THREE.Vector3();

	for(var i in cars) {
		avgPos.add(cars[i].position);
	}

	//return avgPos.divideScalar(cars.length + weight);
	return avgPos.divideScalar(cars.length);
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