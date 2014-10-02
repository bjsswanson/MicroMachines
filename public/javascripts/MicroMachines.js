var MicroMachines = window.MicroMachines || {};

var UP = new THREE.Vector3(0, 1, 0);
var DOWN = new THREE.Vector3(0, -1, 0);
var FORWARD = new THREE.Vector3(0, 0, 1);
var MIN_VELOCITY = new THREE.Vector3(-1, -1, -1);
var MAX_VELOCITY = new THREE.Vector3(1, 1, 1);
var GRAVITY = new THREE.Vector3(0, -0.25, 0);

var DEFAULT_SPEED = 0.015;
var BACKWARDS_MULTIPLIER = 0.5;
var SURFACE_DISTANCE = 0.2; //Distance to set car y value when on a surface
var SURFACE_COLLISION_DISTANCE = 0.3; //Values less than 0.3 seem to break current forward ray-casting. The forward vectors probably need to be a bit higher (+y)
var DEFAULT_DRAG = 0.05;
var FLOAT_DRAG = 0.02;
var TURN_ANGLE = 3;
var DAMPEN = 0.5;
var TRANSPARENT = 0.5;
var SOLID = 1;
var COLLISION_CHECK_DISTANCE = 50;
var BOUNCE = 0.05;

MicroMachines.Car = function ( mesh ) {
	this.mesh = mesh;
	this.mesh.castShadow = true;
	this.mesh.receiveShadow = true;

	this.position = mesh.position;
	this.forward = FORWARD.clone();
	this.velocity = new THREE.Vector3();

	//Be careful when updating raycasters because set changes the original values through the pointer.
	this.colliders = [
		{ angle: 0, distance: 0.5, raycaster: new THREE.Raycaster(this.position, new THREE.Vector3()) },
		{ angle: 45, distance: 0.3, raycaster: new THREE.Raycaster(this.position, new THREE.Vector3()) },
		{ angle: -45, distance: 0.3, raycaster: new THREE.Raycaster(this.position, new THREE.Vector3()) },
		{ angle: 180, distance: 0.5, raycaster: new THREE.Raycaster(this.position, new THREE.Vector3()) }
	]

	this.downRaycaster = new THREE.Raycaster(this.position, DOWN);

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
			this.position.set(x, y, z);
			this.setRotation( 0 );
		},

		init: function(){
			handleInput( this );
		},

		// This only checks if the center of the mesh is in view, not the whole mesh
		isVisible: function( car, camera ) {
			var frustum = new THREE.Frustum();
			frustum.setFromMatrix( new THREE.Matrix4().multiplyMatrices( camera.projectionMatrix, camera.matrixWorldInverse ) );
			return frustum.containsPoint(car.position);
		},

		//Everything needed in the update cycle for a car should go here
		update: function ( world ) {
			var car = this;

			var updateVelocity = new THREE.Vector3();
			handleSurfaces(car, updateVelocity, world.surfaces);

			if (!car.floating) {
				handleInputForce( car );
			}

			handleRamps(car, updateVelocity, world.ramps);
			handleCollisions(car, world.obstacles );
			handleDrag( car );

			car.velocity.clamp(MIN_VELOCITY, MAX_VELOCITY);
			updateVelocity.add(car.velocity);
			car.position.add(updateVelocity);
		}
	}

	function handleRamps ( car, updateVelocity, ramps ){
		var ramp;
		for (var i in ramps) {
			var intersect = downCollide(car, ramps[i].mesh, SURFACE_COLLISION_DISTANCE);
			if (intersect) {
				ramp = ramps[i];
			}

			if(ramp) {
				car.velocity.fromArray(ramp.boost);
			}
		}
	}

	//Using intersect face normal to create more realistic collision when colliding at an angle (might be further improved with Vector3.reflect)
	//May need to rule out some far away objects first with distance check, no need to raycast against objects that aren't nearby
	function handleCollisions( car, obstacles) {
		for(var i in obstacles) {
			var obstacle = obstacles[i];
			if (car.position.distanceTo(obstacle.position) < COLLISION_CHECK_DISTANCE) { //No need to check against far away objects (Although this needs to take into account large objects)
				var intersect = forwardCollide(car, obstacle.mesh);
				if (intersect) {
					var velocity = car.velocity.clone(); // Take the current velocity

					var normal = intersect.face.normal.clone();
					normal.applyMatrix4( new THREE.Matrix4().makeRotationAxis( UP, THREE.Math.degToRad( obstacle.rotation ))); // Account for rotation of mesh

					var normalVelocity = normal.clone(); //Create a vector in the direction of the normal
					normalVelocity.multiply(absoluteVector(car.velocity));  //with the length (speed) of the current velocity

					var result = velocity.add(normalVelocity); // Add the current velocity to the normal velocity
					result.normalize(); // Normalize the result (length of 1)
					result.multiplyScalar(car.velocity.length()); // Make the result the same length (speed) as the original car velocity
					result.multiplyScalar(DAMPEN); //Dampen the resulting vector - Problem with intersection
					result.add(normal.multiplyScalar(BOUNCE)); //Add a little bit in case velocity was zero. (Prevents intersection better), Not cloning normal since we don't need it any more

					car.velocity.copy(result); // Set the car's velocity to the result
				}
			}
		}
	}

	function absoluteVector( v ) {
		return new THREE.Vector3(Math.abs(v.x), Math.abs(v.y), Math.abs(v.z))
	}

	//Checks whether car is on a surface and adds gravity if not
	//Currently doesn't handle ramps (would need to maintain distance from surface for ramps)
	function handleSurfaces( car, updateVelocity, surfaces ) {
		//car.downRaycaster.set(car.position.clone().add(new THREE.Vector3(0, 0.1, 0)), DOWN); //WARNING: BREAKS FORWARD RAYCASTING

		var onSurface;
		for (var i in surfaces) {
			var intersect = downCollide(car, surfaces[i].mesh, SURFACE_COLLISION_DISTANCE);
			if (intersect) {
				onSurface = intersect;
			}
		}

		if (onSurface) {
			car.floating = false;
			car.drag = DEFAULT_DRAG;
			car.velocity.y = 0; //Prevents bouncing after jumps (looks glitchy)
			car.position.y = onSurface.point.y + SURFACE_DISTANCE;
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
			car.velocity.add(car.forward.clone().multiplyScalar(-car.speed * BACKWARDS_MULTIPLIER));
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

	function forwardCollide(car, mesh) {
		for(var i in car.colliders) {
			var collider = car.colliders[i];
			var raycaster = collider.raycaster;
			var clone = car.forward.clone();

			//Update raycaster with current forward vector
			raycaster.set(car.position, clone.applyMatrix4( new THREE.Matrix4().makeRotationAxis( UP, THREE.Math.degToRad( collider.angle ))));

			var intersect = collide(raycaster, mesh, collider.distance);
			if(intersect) {
				return intersect;
			}
		}
	};

	function collide(raycaster, mesh, distance) {
		var intersects = raycaster.intersectObject(mesh);
		if (intersects.length > 0) {
			for(var i in intersects) {
				if (intersects[i].distance <= distance) {
					return intersects[0];
				}
			}
		}
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
				case 85:
					localStorage.setItem('savedPosition', JSON.stringify(car.position));
					console.log("Saved Position: ", car.position);
					break;
				case 80:
					var sP = JSON.parse(localStorage.getItem('savedPosition'));
					car.position.copy(sP);
					console.log("Restored Position: ", sP);
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


MicroMachines.Obstacle = function ( mesh, rotation ) {
	this.mesh = mesh;
	this.position = mesh.position;
	this.rotation = rotation;

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

	//Makes obstacle go transparent if it obstructs the view of a car
	//Needs updating to support multiple cars.
	function transparent( obstacle, camera, car ) {
		obstacle.cameraRaycaster.ray.origin = camera.position;
		obstacle.cameraRaycaster.ray.direction = car.position.clone().sub(camera.position).normalize();

		var distance = car.position.distanceTo(camera.position);
		var intersects = obstacle.cameraRaycaster.intersectObject(obstacle.mesh);
		if (intersects.length > 0) {
			if (distance > intersects[0].distance) {
				setOpacity(obstacle, TRANSPARENT);
			} else {
				setOpacity(obstacle, SOLID);
			}
		} else {
			setOpacity(obstacle, SOLID);
		}
	}

	function setOpacity( obstacle, opacity) {
		var materials = obstacle.mesh.material.materials;
		for(var i in materials){
			materials[i].opacity = opacity;
		}
	}

	return expose;
}();

MicroMachines.Surface = function ( mesh ) {
	this.mesh = mesh;
};

MicroMachines.Surface.prototype = function() {
	var expose = {
		constructor: MicroMachines.Surface
	}

	return expose;
}();

MicroMachines.Ramp = function ( mesh, boost ) {
	this.mesh = mesh;
	this.boost = boost;
}

MicroMachines.Ramp.prototype = function() {
	var expose = {
		constructor: MicroMachines.Ramp
	}

	return expose;
}();

// Attempting a starting and finishing line

MicroMachines.prototype.start = function( car ) {
	this.running = true;
	this.car.start();

	for( var i = 0; i < this.cars.length; i++ ) {
		this.cars[i].start();
	}

	this.state = MicroMachines.STATE_START;
	this.initGameplay();
}();

MicroMachines.prototype.stop = function( car ) {
	this.running = false;
	this.car.stop();

	for( var i = 0; i < this.car.length; i++ ) {
		this.cars[i].stop();
	}

	this.state = MicroMachines.STATE_COMPLETE;
	this.showResults();
}();

// Setting up camera chasing mechanics 

MicroMachines.CameraChase = function(opts) {
	this.dir = new THREE.Vector3(0, 0, 1);
	this.up = new THREE.Vector3(0, 1, 0);
	this.target = new THREE.Vector3();
	this.speedOffset = 0;
	this.speedOffsetMax = 10;
	this.speedOffsetStep = 0.05;

	this.modes = {
		CHASE: 0,
		ORBIT: 1
	}
	this.mode = this.modes.CHASE;

	this.camera = opts.camera;
	this.targetObject = opts.target;
	this.cameraCube = opts.cameraCube == undefined ? null : opts.cameraCube;

	this.yoffset = opts.yoffset == undefined ? 8.0 : opts.yoffset;
	this.zoffset = opts.zoffset == undefined ? 10.0 : opts.zoffset;
	this.viewOffset = opts.viewOffset == undefined ? 10.0 : opts.viewOffset;
	this.orbitOffset = 12;
	this.lerp = opts.lerp == undefined ? 0.5 : opts.lerp;
	this.time = 0.0;
}

MicroMachines.CameraChase.prototype.update = function(dt, ratio) {
	if( this.mode == this.modes.CHASE ) {
		this.dir.set(0, 0, 1);
		this.up.set(0, 1, 0);

		this.targetObject.matrix.rotateOnAxis(this.up);
		this.targetObject.matrix.rotateOnAxis(this.dir);

		this.speedOffset += (this.speedOffsetMax*ratio - this.speedOffset) * Math.min(1, 0.3*dt);

		this.target.copy(this.targetObject.position);
		this.target.subSelf(this.dir.multiplyScalar(this.zoffset + this.speedOffset));
		this.target.addSelf(this.up.multiplyScalar(this.yoffset));
		this.target.y += -this.up.y + this.yoffset;
		this.camera.position.copy(this.target);

		this.camera.lookAt(this.dir.normalize().multiplyScalar(this.viewOffset).addSelf(this.targetObject.position));
	} 
	else if( this.mode == this.modes.ORBIT ) {
		this.time += dt*.008;
		this.dir.set(
			Math.cos(this.time)*this.orbitOffset,
			this.yoffset/2,
			Math.sin(this.time)*this.orbitOffset
		);
		this.target.copy(this.targetObject.position).addSelf(this.dir);
		this.camera.position.copy(this.target);
		this.camera.lookAt(this.targetObject.position);
	}

	if( this.cameraCube != null ) {
		this.cameraCube.rotation.copy(this.camera.rotation);
	}
}

// Gameplay

MicroMachines.prototype.initGameplay = function() {
	var self = this;

	this.gameplay = new MicroMachines.Gameplay({
		mode: this.mode,
		cameraControls: this.components.cameraChase
	});

	this.gameplay.start();
}