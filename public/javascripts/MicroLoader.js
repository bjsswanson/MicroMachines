var MicroMachines = window.MicroMachines || {};

MicroMachines.Loader = {
	testLoad : function ( world ) {
		createTable();

		function createTable( ) {
			var jsonLoader = new THREE.JSONLoader();
			jsonLoader.load("/models/table/table.json", function(url, geometry, materials){
				var mesh = new THREE.Mesh(geometry, new THREE.MeshFaceMaterial(materials));

				mesh.scale.set(3, 3, 3);
				mesh.position.set(20, -20, 0);
				mesh.rotateOnAxis(new THREE.Vector3(0, 1, 0), THREE.Math.degToRad( 0 ));
				mesh.castShadow = true;
				mesh.receiveShadow = true;

				world.scene.add(mesh);

			});
		}

	},

	load: function( file, world, callback ) {
		var jsonLoader = new THREE.JSONLoader();
		var scene = world.scene;
		var camera = world.camera;
		var models = {};

		$.getJSON(file, function( data, status, xhr ){
			loadCamera( data );
			loadLights( data );
			loadCarsAndObjects( data, callback );
		}).error(function(xhr, textStatus, error){
			console.log(error);
		});

		function loadCamera( data ) {
			camera.position.fromArray(data.camera.position);
		};

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
				}
			}
		};

		function loadCarsAndObjects( data, callback ) {
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
								createCars( data );
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

			function createCars( data ) {
				for (var i in data.cars){
					var car = data.cars[i];
					if(car.model != undefined) {
						var model = models[car.model];
						var mesh = new THREE.Mesh(model.geometry, new THREE.MeshFaceMaterial(model.materials));

						mesh.name = car.model;
						mesh.position.fromArray(car.position);
						mesh.scale.set(car.scale, car.scale, car.scale);
						mesh.castShadow = true;

						var microCar = new MicroMachines.Car(mesh);
						microCar.setRotation(car.rotation)
						microCar.init();

						world.cars.push(microCar);

						world.scene.add(mesh);

					}
				}
			}

			function createObjects( data, callback ) {
				for (var i in data.objects) {
					var object = data.objects[i];
					if (object.model != undefined) {
						var model = models[object.model];
						var mesh = new THREE.Mesh(model.geometry, new THREE.MeshFaceMaterial(model.materials)); //Might need to clone mesh in order to get transparent to work if the same object get used more than once

						mesh.scale.set(object.scale, object.scale, object.scale);
						mesh.position.fromArray(object.position);
						mesh.rotateOnAxis(new THREE.Vector3(0, 1, 0), THREE.Math.degToRad(object.rotation));
						mesh.castShadow = true;
						mesh.receiveShadow = true;

						scene.add(mesh);

						if (object.type === "obstacle" || object.type === "both") {
							world.obstacles.push(new MicroMachines.Obstacle(mesh));
						}

						if (object.type === "surface" || object.type === "both") {
							world.surfaces.push(new MicroMachines.Surface(mesh));
						}
					}
				}

				callback();
			}
		}
	}
}