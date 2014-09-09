var _vector3 = new THREE.Vector3()
var gravity = new THREE.Vector3(0, -0.25, 0);
var inputForce = new THREE.Vector3(0, 0, 0);
var forward = new THREE.Vector3(0, 0, 1);
var down = new THREE.Vector3(0, -1, 0);

var forwardPress = false;
var backPress = false;
var leftPress = false;
var rightPress = false;

var floating = true;
var dragCoefficient = 0.05;

var scene = new THREE.Scene();
var camera = createCamera();
var renderer = createRenderer();
var light  = createLight();
var ground = createGround();

var car;
var table;

var jsonLoader = new THREE.JSONLoader();
jsonLoader.load( "/models/table/table.json", createTable );
jsonLoader.load( "/models/buggy/buggy.json", createCar );

keybind();
animate();

function resetCar() {
	car.mesh.position.set(10, 0, -20);
	car.mesh.rotation.x = 0;
	car.mesh.rotation.y = 0;
	car.mesh.rotation.z = 0;
	forward = new THREE.Vector3(0, 0, 1);
}
function update() {
	var forces = new THREE.Vector3();
	forces.add(gravity);

	if(car != undefined && table != undefined){
		camera.lookAt(car.mesh.position);
		transparentTable();

		var tCollide = collide( car.groundRaycaster, table.mesh );
		var gCollide = collide( car.groundRaycaster, ground );

		if(tCollide || gCollide) {
			forces.add(gravity.clone().negate())
			floating = false;
			dragCoefficient = 0.05;
		} else {
			floating = true;
			dragCoefficient = 0.02;
		}

		if(!floating) {
			if(forwardPress) {
				inputForce.add(forward.clone().multiplyScalar(0.02));
			}

			if(backPress) {
				inputForce.add(forward.clone().multiplyScalar(-0.02));
			}

			if(leftPress) {
				var axis = new THREE.Vector3( 0, 1, 0 );
				var angle = THREE.Math.degToRad(2);
				car.mesh.rotateOnAxis(axis, angle);
				var matrix = new THREE.Matrix4().makeRotationAxis( axis, angle );
				forward.applyMatrix4( matrix );
			}

			if(rightPress) {
				var axis = new THREE.Vector3( 0, 1, 0 );
				var angle = THREE.Math.degToRad(-2);
				car.mesh.rotateOnAxis(axis, angle);
				var matrix = new THREE.Matrix4().makeRotationAxis( axis, angle );
				forward.applyMatrix4( matrix );
			}
		}

		var fCollide = collide( car.forwardRaycaster, table.mesh);
		if(fCollide) {
			inputForce.add(inputForce.clone().negate().multiplyScalar(2));
		}

		if(car.mesh.position.y < -50) {
			resetCar();
		}

		var drag = inputForce.clone().multiplyScalar(dragCoefficient);

		inputForce.sub(drag);
		inputForce.clamp(new THREE.Vector3(-1, -1, -1), new THREE.Vector3(1, 1, 1));

		forces.add(inputForce);
		car.mesh.position.add(forces);
	}
}

function collide( raycaster, mesh ) {
	var intersects = raycaster.intersectObject(mesh);
	if (intersects.length > 0) {
		if (intersects[0].distance < 0.3) {
			return true;
		}
	}

	return false;
}

function visible( mesh ) {
	var frustum = new THREE.Frustum();
	frustum.setFromMatrix( new THREE.Matrix4().multiplyMatrices( camera.projectionMatrix, camera.matrixWorldInverse ) );
	return frustum.containsPoint(mesh.position); // This only checks if the center of the mesh is in view, not the whole mesh.
}

function keybind(){
	document.onkeydown = function(e) {
		switch (e.keyCode) {
			case 37:
				leftPress = true;
				break;
			case 38:
				forwardPress = true;
				break;
			case 39:
				rightPress = true;
				break;
			case 40:
				backPress = true;
				break;
			case 82:
				resetCar();
				break;
		}
	};

	document.onkeyup = function(e) {
		switch (e.keyCode) {
			case 37:
				leftPress = false;
				break;
			case 38:
				forwardPress = false;
				break;
			case 39:
				rightPress = false;
				break;
			case 40:
				backPress = false;
				break;
		}
	};



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

	table = {
		mesh: mesh
	};
}

function createCar( geometry, materials) {
	var mesh = createModel( geometry, materials, 1);
	mesh.scale.set(0.5,0.5, 0.5);
	mesh.position.set(10, 0, -20);
	mesh.castShadow = true;
	mesh.receiveShadow = true;

	scene.add(mesh);

	car = {
		mesh: mesh,
		groundRaycaster: new THREE.Raycaster(mesh.position, down),
		forwardRaycaster: new THREE.Raycaster(mesh.position, forward)
	}

	//drawLine(car.groundRaycaster);
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