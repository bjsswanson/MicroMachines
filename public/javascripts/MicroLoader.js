var MicroMachines = window.MicroMachines || {};

MicroMachines.Loader = {
	loadLevel: function( file, world, callback ) {
		var jsonLoader = new THREE.JSONLoader();

		var scene = world.scene;
		var obstacles = world.obstacles || [];
		var surfaces = world.surfaces || [];
		var ramps = world.ramps || [];

		var models = {};

		$.getJSON(file, function( data, status, xhr ){
			loadLights( data );
			loadGround( data );
			loadWaypoints( data );
			loadObjects( data, callback );
		}).error(function(xhr, textStatus, error){
			console.log(error);
		});

		function loadLights( data ) {
			for(var i in data.lights){
				var light = data.lights[i];
				if(light.type === "Ambient") {
					scene.add(new THREE.AmbientLight(light.colour))
				} else if (light.type === "SpotLight") {
					var spotLight = new THREE.SpotLight(light.colour);
					spotLight.position.fromArray(light.position);
					spotLight.castShadow = true;
					scene.add(spotLight);
				} else if (light.type === "Directional") {
					var directional = new THREE.DirectionalLight(light.colour, light.intensity);
					directional.position.fromArray(light.position);
					directional.castShadow = true;
					directional.shadowCameraLeft = -light.shadowSize;
					directional.shadowCameraRight = light.shadowSize;
					directional.shadowCameraTop = light.shadowSize;
					directional.shadowCameraBottom = -light.shadowSize;
					directional.shadowMapWidth = light.shadowMapSize;
					directional.shadowMapHeight = light.shadowMapSize;

					directional.target.position.set(directional.position.x, 0, directional.position.z);
					//directional.shadowCameraVisible = true; //For Debug

					scene.add(directional);
				}
			}
		};

		function loadGround( data ) {
			var ground = data.ground;
			var geometry = new THREE.PlaneGeometry( ground.width, ground.height );
			var material = new THREE.MeshBasicMaterial( {color: ground.colour, side: THREE.DoubleSide} );
			var plane = new THREE.Mesh( geometry, material );

			plane.name = "ground";
			plane.position.fromArray(ground.position);
			plane.receiveShadow = true;
			plane.rotateOnAxis(new THREE.Vector3(1, 0, 0), THREE.Math.degToRad(90));

			scene.add( plane );
			surfaces.push(new MicroMachines.Surface( plane ));
		};

		function loadObjects( data, callback ) {
			trackMeshes( data );
			loadMeshes( data, callback )

			function trackMeshes( data ) {
				for(var i in data.objects) {
					var object = data.objects[i];
					if(object.model != undefined) {
						models[object.model] = undefined;
					}
				}

				for(var i in data.cars) {
					var car = data.cars[i];
					if(car.model != undefined) {
						models[car.model] = undefined;
					}
				}
			}

			function loadMeshes( data, callback ) {
				for (var key in models) {
					if (models.hasOwnProperty(key)) {
						jsonLoader.load(key, function (url, geometry, materials) {
							models[url] = { geometry: geometry, materials: materials};

							if (finishedLoadingMeshes()) {
								createObjects( data, callback );
							}
						});
					}
				}
			}

			function finishedLoadingMeshes() {
				for (var key in models) {
					if (models.hasOwnProperty(key)) {
						if(models[key] === undefined ) {
							return false;
						}
					}
				}

				return true;
			}


			function createObjects( data, callback ) {
				for (var i in data.objects) {
					var object = data.objects[i];
					if (object.model != undefined) {
						var model = models[object.model];
						var mesh = new THREE.Mesh(model.geometry, cloneMaterials());

						mesh.name = object.name;
						mesh.scale.set(object.scale, object.scale, object.scale);
						mesh.position.fromArray(object.position);
						mesh.rotateOnAxis(new THREE.Vector3(0, 1, 0), THREE.Math.degToRad(object.rotation));

						mesh.castShadow = object.castShadow !== undefined ? object.castShadow : true;
						mesh.receiveShadow = object.receiveShadow !== undefined ? object.receiveShadow : true;

						scene.add(mesh);

						if (object.type === "obstacle" || object.type === "both") {
							obstacles.push(new MicroMachines.Obstacle(mesh, object.rotation));
						}

						if (object.type === "surface" || object.type === "both") {
							surfaces.push(new MicroMachines.Surface(mesh));
						}

						if(object.type === "ramp") {
							ramps.push(new MicroMachines.Ramp(mesh, object.boost));
						}
					}
				}

				callback();


				function cloneMaterials() {
					var clonedMaterials = [];

					for(var i in model.materials){
						var material = model.materials[i].clone();
						material.transparent = true;
						clonedMaterials.push(material);
					}

					return new THREE.MeshFaceMaterial(clonedMaterials);
				};				
			};			
		};
		
		function loadWaypoints( data ) {
			var waypoints = world.waypoints;

			for(var i in data.waypoints){
				var waypoint = data.waypoints[i];
				var trigger = waypoint.trigger;

				var geometry = new THREE.PlaneGeometry( trigger.width, trigger.height );
				var material = new THREE.MeshBasicMaterial( {color: "red", side: THREE.DoubleSide} );
				material.transparent = true;
				material.opacity = 0.1;

				var plane = new THREE.Mesh( geometry, material );

				plane.position.fromArray(trigger.position);
				plane.rotateOnAxis(new THREE.Vector3(0, 1, 0), THREE.Math.degToRad(trigger.rotation));

				world.scene.add(plane);
				waypoints.push(new MicroMachines.WayPoint(i, waypoint.positions, waypoint.rotation, plane));
			}

			if(waypoints) {
				world.prevWaypoint = waypoints[0];
				world.prevWaypoint.mesh.material.color = new THREE.Color("green");
				world.nextWaypoint = waypoints[1];
			}
		};
	},
	
	loadCar: function( file, callback ){
		var cars = world.cars || [];
		
		$.getJSON(file, function( data, status, xhr ){
			loadCar( data, callback );
		}).error(function(xhr, textStatus, error){
			console.log(error);
		});
		
		function loadCar( data, callback ) {
			var jsonLoader = new THREE.JSONLoader();
			if(data.model != undefined) {
				jsonLoader.load(data.model, function (url, geometry, materials) {
					var mesh = new THREE.Mesh(geometry, new THREE.MeshFaceMaterial(materials));

					mesh.name = data.name;
					mesh.scale.set(data.scale, data.scale, data.scale);
					mesh.castShadow = true;

					var microCar = new MicroMachines.Car(mesh);
					microCar.setPosition(data.position);
					microCar.setRotation(data.rotation)
					microCar.init();

					cars.push(microCar);
					scene.add(mesh);

					callback( microCar );
				});
			}
		}
	},

	removeCar: function( car ){
		world.scene.remove(car.mesh);

		var index = world.cars.indexOf(car);
		if(index > -1){
			world.cars.splice(index, 1);
		}
	}
}