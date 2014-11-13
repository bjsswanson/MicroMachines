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
};

var level = "/levels/test.json";
MicroMachines.Loader.loadLevel(level, world, function(){
	requestAnimationFrame( animate );
	MicroMachines.Input.init();
});

function animate() {
	update();
	renderer.render(world.scene, world.camera);
	requestAnimationFrame( animate );
}

function update() {
	var cars = world.cars;
	var obstacles = world.obstacles;

	updateCars( cars );
	updateCamera( cars );
	updateObstacles(cars, obstacles);
}

function updateCars(cars) {
	for (var i in cars) {
		cars[i].update(world);
		tooFarFromLeadCar(cars, i);
		onGround(cars, i);
	}
}
function updateObstacles(cars, obstacles) {
	for (var i in cars) {
		for (var j in obstacles) {
			obstacles[j].update(camera, cars[i]);
		}
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
	var player = $(".player").eq(index);
	$(player).find('span:last').remove()
	var score = $(player).children().length;

	if(score <= 0){
		resetGame();
	}
}

function resetGame() {
	var players = $(".player");
	for(var i in players){
		var player = $(players).eq(i);
		$(player).html("");
		for(var j = 0; j < 5 ; j++){
			player.append($("<span></span>"));
		}
	}

	world.prevWaypoint = world.waypoints[0];
	world.nextWaypoint = world.waypoints[1];
	world.prevWaypoint.resetCars();
}

function updateCamera( cars ){
	if(cars.length > 0) {
		var avgPos = calculateAveragePosition( cars );
		camera.lookAt(avgPos);
		camera.position.copy(avgPos.clone().add(new THREE.Vector3(-4, 16, 4)));
	}
}

function calculateAveragePosition( cars ){
	var avgPos = new THREE.Vector3();

	for(var i in cars) {
		avgPos.add(cars[i].position);
	}

	return avgPos.divideScalar(cars.length);
}

function createCamera() {
	var camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.01, 1000);
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