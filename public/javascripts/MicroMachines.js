var MicroMachines = window.MicroMachines || {};

var UP = new THREE.Vector3(0, 1, 0);
var DOWN = new THREE.Vector3(0, -1, 0);
var MIN_VELOCITY = new THREE.Vector3(-1, -1, -1);
var MAX_VELOCITY = new THREE.Vector3(1, 1, 1);
var GRAVITY = new THREE.Vector3(0, -0.25, 0);
var DEFAULT_SPEED = 0.02;
var GROUND_DISTANCE = 0.3;
var DEFAULT_DRAG = 0.05;
var FLOAT_DRAG = 0.02;
var TURN_ANGLE = 2;
var COLLIDE_DISTANCE = 0.3;
var COLLISION_MULTIPLIER = 2;

MicroMachines.Car = function ( mesh ) {
	this.mesh = mesh;

	this.forward = new THREE.Vector3(0, 0, 1);
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

		setPosition: function (x, y, z) {
			this.mesh.position.x = x;
			this.mesh.position.y = y;
			this.mesh.position.z = z;

			return this;
		},

		setRotation: function (x, y, z) {
			this.mesh.rotation.x = x;
			this.mesh.rotation.y = y;
			this.mesh.rotation.z = z;

			return this;
		},

		reset: function (x, y, z) {
			this.setPosition(x, y, z);
			this.setRotation(0, 0, 0);
			this.forward = new THREE.Vector3(0, 0, 1);
		},

		init: function(){
			handleInput( this );
		},

		update: function (groundMeshes, obstacleMeshes) {
			var car = this;

			var updateVelocity = new THREE.Vector3();
			handleGround(car, updateVelocity, groundMeshes);

			if (!car.floating) {
				handleInputForce( car );
			}

			handleCollisions(car, obstacleMeshes );
			handleDrag( car );

			car.velocity.clamp(MIN_VELOCITY, MAX_VELOCITY);
			updateVelocity.add(car.velocity);
			car.mesh.position.add(updateVelocity);
		}
	}

	function handleCollisions( car, obstacleMeshes ) {
		for(var i in obstacleMeshes){
			if(forwardCollide(car, obstacleMeshes[i], COLLIDE_DISTANCE)){
				car.velocity.add(car.velocity.clone().negate().multiplyScalar(COLLISION_MULTIPLIER));
			}
		}
	}

	function handleDrag( car ) {
		car.velocity.sub( car.velocity.clone().multiplyScalar(car.drag) );
	}

	var handleGround = function( car, updateVelocity, groundMeshes ) {
		var onGround = false;
		for (var i in groundMeshes) {
			if (downCollide(car, groundMeshes[i], GROUND_DISTANCE)) {
				onGround = true;
			}
		}

		if (onGround) {
			car.floating = false;
			car.drag = DEFAULT_DRAG;
		} else {
			updateVelocity.add(GRAVITY);
			car.floating = true;
			car.drag = FLOAT_DRAG;
		}
	};

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
