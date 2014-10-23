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
var CAR_COLLISION = 0.5

MicroMachines.Car = function (mesh) {
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

MicroMachines.Car.prototype = function () {

	var expose = {

		constructor: MicroMachines.Car,

		setPosition: function (pos) {
			if (pos) {
				if (Array.isArray(pos)) {
					this.mesh.position.fromArray(pos);
				} else if (pos instanceof THREE.Vector3) {
					this.mesh.position.copy(pos);
				} else {
					console.error("Unsupported position argument.");
				}
			}
		},

		setRotation: function (angle) {
			this.mesh.rotation.x = 0;
			this.mesh.rotation.y = 0;
			this.mesh.rotation.z = 0;
			this.mesh.rotateOnAxis(UP, THREE.Math.degToRad(angle));
			this.forward = FORWARD.clone();
			this.forward.applyMatrix4(new THREE.Matrix4().makeRotationAxis(UP, THREE.Math.degToRad(angle)));
			return this;
		},

		reset: function (pos, angle) {
			this.position.fromArray(pos);
			this.setRotation(angle);
			this.velocity = new THREE.Vector3();
		},

		init: function () {

		},

		// This only checks if the center of the mesh is in view, not the whole mesh
		isVisible: function (camera) {
			var frustum = new THREE.Frustum();
			frustum.setFromMatrix(new THREE.Matrix4().multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse));
			return frustum.containsPoint(this.position);
		},

		//Everything needed in the update cycle for a car should go here
		update: function (world) {
			var car = this;

			var updateVelocity = new THREE.Vector3();
			handleSurfaces(car, updateVelocity, world.surfaces);

			if (!car.floating) {
				handleInputForce(car);
			}

			handleRamps(car, updateVelocity, world.ramps);
			handleObstacleCollisions(car, world.obstacles);
			handleCarCollisions(car, world.cars);
			handleDrag(car);
			handleWaypoints(car);

			car.velocity.clamp(MIN_VELOCITY, MAX_VELOCITY);
			updateVelocity.add(car.velocity);
			car.position.add(updateVelocity);
		}
	}

	function handleWaypoints(car) {
		var nextWaypoint = world.nextWaypoint;

		if (forwardCollide(car, nextWaypoint.mesh)) {
			world.prevWaypoint.mesh.material.color = new THREE.Color("red");
			world.nextWaypoint.mesh.material.color = new THREE.Color("green");
			world.prevWaypoint = nextWaypoint;
			world.nextWaypoint = nextWaypoint.getNextWaypoint();
		}
	}

	function handleRamps(car, updateVelocity, ramps) {
		for (var i in ramps) {
			if (car.position.distanceTo(ramps[i].position) < COLLISION_CHECK_DISTANCE) {
				var intersect = downCollide(car, ramps[i].mesh, SURFACE_COLLISION_DISTANCE);
				if (intersect) {
					car.velocity.fromArray(ramps[i].boost);
					break;
				}
			}
		}
	}

	//Using intersect face normal to create more realistic collision when colliding at an angle (might be further improved with Vector3.reflect)
	//May need to rule out some far away objects first with distance check, no need to raycast against objects that aren't nearby
	function handleObstacleCollisions(car, obstacles) {
		for (var i in obstacles) {
			var obstacle = obstacles[i];
			if (car.position.distanceTo(obstacle.position) < COLLISION_CHECK_DISTANCE) { //No need to check against far away objects (Although this needs to take into account large objects)
				var intersect = forwardCollide(car, obstacle.mesh);
				if (intersect) {
					var velocity = car.velocity.clone(); // Take the current velocity

					var normal = intersect.face.normal.clone();
					normal.applyMatrix4(new THREE.Matrix4().makeRotationAxis(UP, THREE.Math.degToRad(obstacle.rotation))); // Account for rotation of mesh

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
	};

	function handleCarCollisions(car, cars) {
		for (var i in cars) {
			var other = cars[i];
			if (car != other) {
				if(car.position.distanceTo(other.position) < CAR_COLLISION){
					var v = car.velocity;
					var oV = other.velocity;

					var dir = other.position.clone().sub(car.position);
					dir.multiplyScalar(BOUNCE);

					var result = new THREE.Vector3().addVectors(v, oV);
					result.normalize();
					result.multiplyScalar(Math.max(v.length(), oV.length()));
					result.sub(dir);

					v.copy(result); //TODO: Understand how this works. Stop brute forcing physics till they work...
				}
			}
		}
	};

	function absoluteVector(v) {
		return new THREE.Vector3(Math.abs(v.x), Math.abs(v.y), Math.abs(v.z))
	};

	//Checks whether car is on a surface and adds gravity if not
	//Currently doesn't handle ramps (would need to maintain distance from surface for ramps)
	function handleSurfaces(car, updateVelocity, surfaces) {
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
	function handleDrag(car) {
		car.velocity.sub(car.velocity.clone().multiplyScalar(car.drag));
	}

	//Adds forward and back forces as well as turning the car
	function handleInputForce(car) {
		if (car.input.forward) {
			car.velocity.add(car.forward.clone().multiplyScalar(car.speed));
		}

		if (car.input.backwards) {
			car.velocity.add(car.forward.clone().multiplyScalar(-car.speed * BACKWARDS_MULTIPLIER));
		}

		if (car.input.left) {
			car.mesh.rotateOnAxis(UP, THREE.Math.degToRad(TURN_ANGLE));
			car.forward.applyMatrix4(new THREE.Matrix4().makeRotationAxis(UP, THREE.Math.degToRad(TURN_ANGLE)));
		}

		if (car.input.right) {
			car.mesh.rotateOnAxis(UP, THREE.Math.degToRad(-TURN_ANGLE));
			car.forward.applyMatrix4(new THREE.Matrix4().makeRotationAxis(UP, THREE.Math.degToRad(-TURN_ANGLE)));
		}
	}

	function downCollide(car, mesh, distance) {
		return collide(car.downRaycaster, mesh, distance);
	};

	function forwardCollide(car, mesh) {
		for (var i in car.colliders) {
			var collider = car.colliders[i];
			var raycaster = collider.raycaster;
			var clone = car.forward.clone();

			//Update raycaster with current forward vector
			raycaster.set(car.position, clone.applyMatrix4(new THREE.Matrix4().makeRotationAxis(UP, THREE.Math.degToRad(collider.angle))));

			var intersect = collide(raycaster, mesh, collider.distance);
			if (intersect) {
				return intersect;
			}
		}
	};

	function collide(raycaster, mesh, distance) {
		var intersects = raycaster.intersectObject(mesh);
		if (intersects.length > 0) {
			for (var i in intersects) {
				if (intersects[i].distance <= distance) {
					return intersects[0];
				}
			}
		}
	};

	return expose;
}();


MicroMachines.Obstacle = function (mesh, rotation) {
	this.mesh = mesh;
	this.position = mesh.position;
	this.rotation = rotation;

	this.cameraRaycaster = new THREE.Raycaster();
};

MicroMachines.Obstacle.prototype = function () {
	var expose = {
		constructor: MicroMachines.Obstacle,

		update: function (camera, car) {
			var obstacle = this;
			transparent(obstacle, camera, car);
		}
	}

	//Makes obstacle go transparent if it obstructs the view of a car
	//Needs updating to support multiple cars.
	function transparent(obstacle, camera, car) {
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

	function setOpacity(obstacle, opacity) {
		var materials = obstacle.mesh.material.materials;
		for (var i in materials) {
			materials[i].opacity = opacity;
		}
	}

	return expose;
}();

MicroMachines.Surface = function (mesh) {
	this.mesh = mesh;
};

MicroMachines.Surface.prototype = function () {
	var expose = {
		constructor: MicroMachines.Surface
	}

	return expose;
}();

MicroMachines.Ramp = function (mesh, boost) {
	this.mesh = mesh;
	this.position = mesh.position;
	this.boost = boost;
}

MicroMachines.Ramp.prototype = function () {
	var expose = {
		constructor: MicroMachines.Ramp
	}

	return expose;
}();

MicroMachines.WayPoint = function (index, positions, rotation, mesh) {
	this.index = parseInt(index);
	this.positions = positions;
	this.rotation = rotation;
	this.mesh = mesh;
	this.position = mesh.position;
	this.active = false;
}

MicroMachines.WayPoint.prototype = function () {
	var expose = {
		constructor: MicroMachines.WayPoint,

		getClosestCar: function () {
			var cars = world.cars;

			var closestCar;
			for (var i in world.cars) {
				var car = world.cars[i];
				if (closestCar === undefined || this.position.distanceTo(car.position) < this.position.distanceTo(closestCar.position)) {
					closestCar = car;
				}
			}

			return closestCar;
		},

		resetCars: function () {
			var cars = world.cars;

			for (var i in cars) {
				var car = cars[i];
				var position = this.positions[i];
				var rotation = this.rotation || 0;
				if (position !== undefined) {
					car.reset(position, rotation);
				}
			}
		},

		getNextWaypoint: function () {
			var waypoints = world.waypoints;
			var nextIndex = this.index + 1 >= waypoints.length ? 0 : this.index + 1;
			return waypoints[nextIndex];
		}
	};

	// Put private methods in here (outside of expose)

	return expose;
}();