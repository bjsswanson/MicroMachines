var MicroMachines = window.MicroMachines || {};

var UP = new THREE.Vector3(0, 1, 0);
var DOWN = new THREE.Vector3(0, -1, 0);
var FORWARD = new THREE.Vector3(0, 0, 1);
var MIN_VELOCITY = new THREE.Vector3(-1, -1, -1);
var MAX_VELOCITY = new THREE.Vector3(1, 1, 1);
var GRAVITY = new THREE.Vector3(0, -0.25, 0);
var DEFAULT_SPEED = 0.02;
var SURFACE_DISTANCE = 0.3;
var DEFAULT_DRAG = 0.05;
var FLOAT_DRAG = 0.02;
var TURN_ANGLE = 2;
var COLLIDE_DISTANCE = 0.8;
var COLLISION_MULTIPLIER = 2;

MicroMachines.Car = function ( mesh ) {
	this.mesh = mesh;
	this.mesh.castShadow = true;
	this.mesh.receiveShadow = true;

	this.forward = FORWARD.clone();
	this.velocity = new THREE.Vector3();

	this.fowardRaycaster = new THREE.Raycaster(mesh.position, this.forward);
	this.downRaycaster = new THREE.Raycaster(mesh.position, DOWN);

	this.floating = true;
	this.speed = DEFAULT_SPEED;
	this.drag = DEFAULT_DRAG;

	this.input = {
		forward: false,
		backwards: false,
		left: false,
		right: false
	}
};

MicroMachines.Car.prototype = function() {

	var expose = {

		constructor: MicroMachines.Car,

		getPosition: function() {
			return this.mesh.position;
		},

		setPosition: function (x, y, z) {
			this.mesh.position.x = x;
			this.mesh.position.y = y;
			this.mesh.position.z = z;

			return this;
		},

		setRotation: function ( angle ) {
			this.mesh.rotation.x = 0;
			this.mesh.rotation.y = 0;
			this.mesh.rotation.z = 0;
			this.mesh.rotateOnAxis(UP, THREE.Math.degToRad( angle ));
			this.forward = FORWARD.clone();
			this.forward.applyMatrix4( new THREE.Matrix4().makeRotationAxis( UP, THREE.Math.degToRad( angle )));
			return this;
		},

		reset: function (x, y, z) {
			this.setPosition(x, y, z);
			this.setRotation( 0 );
		},

		init: function(){
			handleInput( this );
		},

		// This only checks if the center of the mesh is in view, not the whole mesh
		isVisible: function( camera ) {
			var frustum = new THREE.Frustum();
			frustum.setFromMatrix( new THREE.Matrix4().multiplyMatrices( camera.projectionMatrix, camera.matrixWorldInverse ) );
			return frustum.containsPoint(mesh.position);
		},

		//Everything needed in the update cycle for the car should go here
		update: function (surfaces, obstacles) {
			var car = this;

			var updateVelocity = new THREE.Vector3();
			handleSurfaces(car, updateVelocity, surfaces);

			if (!car.floating) {
				handleInputForce( car );
			}

			handleCollisions(car, obstacles );
			handleDrag( car );

			car.velocity.clamp(MIN_VELOCITY, MAX_VELOCITY);
			updateVelocity.add(car.velocity);
			car.mesh.position.add(updateVelocity);
		}
	}

	//If the car collides with an obstacle then it bounces the car away with twice the velocity of the hit.
	//If the car is in the air then it doesn't bounce.
	//Might need more than one forward raycaster in order to prevent clipping of model. 1 forward and 2 diagonal?
	function handleCollisions( car, obstacles) {
		for(var i in obstacles){
			if(forwardCollide(car, obstacles[i].mesh, COLLIDE_DISTANCE)){
				if(car.floating) {
					car.velocity.add(car.velocity.clone().negate().multiplyScalar(1)); //This doesn't work when reversing off a table. Kills reverse velocity, should maybe inverse forward vector when reversing?
				} else {
					car.velocity.add(car.velocity.clone().negate().multiplyScalar(COLLISION_MULTIPLIER)); //should use Vector3.reflect here? Intersect has a face (which has a normal) which could be used for this.
				}
			}
		}
	}

	//Checks whether car is on a surface and adds gravity if not
	function handleSurfaces( car, updateVelocity, surfaces ) {
		var onSurface = false;
		for (var i in surfaces) {
			if (downCollide(car, surfaces[i].mesh, SURFACE_DISTANCE)) {
				onSurface = true;
			}
		}

		if (onSurface) {
			car.floating = false;
			car.drag = DEFAULT_DRAG;
		} else {
			updateVelocity.add(GRAVITY);
			car.floating = true;
			car.drag = FLOAT_DRAG;
		}
	};

	//Add drag every update
	function handleDrag( car ) {
		car.velocity.sub( car.velocity.clone().multiplyScalar(car.drag) );
	}

	//Adds forward and back forces as well as turning the car
	function handleInputForce( car ) {
		if(car.input.forward) {
			car.velocity.add(car.forward.clone().multiplyScalar(car.speed));
		}

		if(car.input.backwards) {
			car.velocity.add(car.forward.clone().multiplyScalar(-car.speed));
		}

		if(car.input.left) {
			car.mesh.rotateOnAxis(UP, THREE.Math.degToRad( TURN_ANGLE ));
			car.forward.applyMatrix4( new THREE.Matrix4().makeRotationAxis( UP, THREE.Math.degToRad( TURN_ANGLE )));
		}

		if(car.input.right) {
			car.mesh.rotateOnAxis(UP, THREE.Math.degToRad(-TURN_ANGLE));
			car.forward.applyMatrix4( new THREE.Matrix4().makeRotationAxis( UP, THREE.Math.degToRad(-TURN_ANGLE)));
		}
	}

	function downCollide(car, mesh, distance) {
		return collide(car.downRaycaster, mesh, distance);
	};

	function forwardCollide(car, mesh, distance) {
		return collide(car.fowardRaycaster, mesh, distance);
	};

	function collide(raycaster, mesh, distance) {
		var intersects = raycaster.intersectObject(mesh);
		if (intersects.length > 0) {
			for(var i in intersects) {
				if (intersects[i].distance <= distance) {
					return true;
				}
			}
		}
		return false;
	};

	//temporary keyboard input. This will probably not work with multiple cars
	function handleInput( car ) {

		document.onkeydown = function (e) {
			switch (e.keyCode) {
				case 37:
					car.input.left = true;
					break;
				case 38:
					car.input.forward = true;
					break;
				case 39:
					car.input.right = true;
					break;
				case 40:
					car.input.backwards = true;
					break;
			}
		};

		document.onkeyup = function (e) {
			switch (e.keyCode) {
				case 37:
					car.input.left = false;
					break;
				case 38:
					car.input.forward = false;
					break;
				case 39:
					car.input.right = false;
					break;
				case 40:
					car.input.backwards = false;
					break;
			}
		};
	}

	return expose;
}();


MicroMachines.Obstacle = function ( mesh ) {
	this.mesh = mesh;
	this.cameraRaycaster = new THREE.Raycaster();
};

MicroMachines.Obstacle.prototype = function(){
	var expose = {
		constructor: MicroMachines.Obstacle,

		update: function( camera, car ) {
			var obstacle = this;
			transparent( obstacle, camera, car );
		}
	}

	function transparent( obstacle, camera, car ) {
		obstacle.cameraRaycaster.ray.origin = camera.position;
		obstacle.cameraRaycaster.ray.direction = car.getPosition().clone().sub(camera.position).normalize();

		var distance = car.getPosition().distanceTo(camera.position);
		var intersects = obstacle.cameraRaycaster.intersectObject(obstacle.mesh);
		if (intersects.length > 0) {
			if (distance > intersects[0].distance) {
				setOpacity(obstacle, 0.5);
			} else {
				setOpacity(obstacle, 1);
			}
		} else {
			setOpacity(obstacle, 1);
		}
	}

	function setOpacity( obstacle, opacity) {
		obstacle.mesh.material.materials[0].opacity = opacity;
	}

	return expose;
}();

MicroMachines.Surface = function ( mesh ) {
	this.mesh = mesh;
};

MicroMachines.Surface.prototype = function(){
	var expose = {
		constructor: MicroMachines.Surface
	}

	return expose;
}();