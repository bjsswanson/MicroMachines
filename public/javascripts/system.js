var scene = new THREE.Scene();
var camera = createCamera();
var renderer = createRenderer();
var light  = createLight();

var car;
var table;
var ground = createGround();

var jsonLoader = new THREE.JSONLoader();
jsonLoader.load( "/models/table/table.json", createTable );
jsonLoader.load( "/models/buggy/buggy.json", createCar );

animate();

function update() {
	if(car != undefined && table != undefined){
		camera.lookAt(car.mesh.position);
		car.update([ground, table], [table]);
	}
}


function visible( mesh ) {
	var frustum = new THREE.Frustum();
	frustum.setFromMatrix( new THREE.Matrix4().multiplyMatrices( camera.projectionMatrix, camera.matrixWorldInverse ) );
	return frustum.containsPoint(mesh.position); // This only checks if the center of the mesh is in view, not the whole mesh.
}

function animate() {
	requestAnimationFrame( animate );
	update();
	renderer.render(scene, camera);
}

function transparentTable(){
	if(car != undefined){
		var direction = car.mesh.position.clone().sub(camera.position).normalize();
		var distance = car.mesh.position.distanceTo(camera.position);
		var raycaster = new THREE.Raycaster(camera.position, direction);

		var intersects = raycaster.intersectObject(table.mesh);
		if (intersects.length > 0) {
			if (distance > intersects[0].distance) {
				//console.log("behind");
				table.mesh.material.materials[0].opacity = 0.5;
			} else {
				//console.log("front");
				table.mesh.material.materials[0].opacity = 1;
			}
		} else {
			table.mesh.material.materials[0].opacity = 1;
		}

	}
}

function createTable( geometry, materials ) {
	var mesh = createModel( geometry, materials);
	mesh.scale.set(3, 3, 3);
	mesh.position.set(20, -20, 0);
	mesh.castShadow = true;
	mesh.receiveShadow = true;
	mesh.material.transparent = true;
	mesh.material.materials[0].transparent = true

	scene.add(mesh);
	table = mesh;
}

function createCar( geometry, materials) {
	var mesh = createModel( geometry, materials, 1);
	mesh.scale.set(0.5,0.5, 0.5);
	mesh.position.set(10, 0, -20);
	mesh.castShadow = true;
	mesh.receiveShadow = true;

	scene.add(mesh);

	car = new MicroMachines.Car( mesh );
	car.init();
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
	//camera.position.set( -20, 40, 20);
	camera.position.set( -10, 20, 10);
	camera.lookAt( scene.position );
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

function drawLine( raycaster ) {
	var material = new THREE.LineBasicMaterial({
		color: 0x0000ff
	});

	var geometry = new THREE.Geometry();

	var origin = raycaster.ray.origin;
	var direction = raycaster.ray.direction;

	geometry.vertices.push(origin);
	geometry.vertices.push(_vector3.addVectors(origin, direction));
	var line = new THREE.Line(geometry, material);

	scene.add(line);
}