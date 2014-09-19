$(function(){

	var statsBox = createStatsBox();
	var pp = "[0, 0, 0]";
	var pf = "[0, 0, 0]";

	var projector = new THREE.Projector();
	var raycaster = new THREE.Raycaster();
	var mouse = new THREE.Vector2();
	var intersected;

	document.addEventListener( 'mousemove', onDocumentMouseMove, false );

	statsUpdate();

	function statsUpdate() {
		requestAnimationFrame( statsUpdate );
		if( world ) {
			carStats(statsBox);
			objectDetect(statsBox);
		}
	}

	function onDocumentMouseMove( event ) {
		event.preventDefault();

		mouse.x = ( event.clientX / window.innerWidth ) * 2 - 1;
		mouse.y = - ( event.clientY / window.innerHeight ) * 2 + 1;
	}

	function createStatsBox() {
		var stats = $('<div id="stats"></div>');
		stats.css("position", "absolute");
		stats.css("top", "0");
		stats.css("left", "0");
		stats.css("background-color", "rgba(211, 211, 211, 0.5)");
		stats.css("width", "250px");
		stats.css("height", "100px");
		$('body').append(stats);

		var position = $('<span id="position"></span>')
		position.css("display", "block");
		stats.append(position);

		var forward = $('<span id="forward"></span>')
		forward.css("display", "block");
		stats.append(forward);


		var mouse = $('<span id="mouse"></span>')
		mouse.css("display", "block");
		stats.append(mouse);

		var object = $('<span id="object"></span>')
		object.css("display", "block");
		stats.append(object);

		var objectPosition = $('<span id="objectPosition"></span>')
		objectPosition.css("display", "block");
		stats.append(objectPosition);

		return {
			position: position,
			forward: forward,
			object: object,
			objectPosition: objectPosition,
			mouse: mouse
		}
	}

	function objectDetect( statsBox ) {
		var vector = new THREE.Vector3( mouse.x, mouse.y, 1 );
		projector.unprojectVector( vector, world.camera );

		raycaster.set( world.camera.position, vector.sub( world.camera.position ).normalize() );

		var intersects = raycaster.intersectObjects( world.scene.children );

		if ( intersects.length > 0 ) {
			statsBox.mouse.text("Mouse: " + roundArray(intersects[ 0 ].point.toArray()));
			statsBox.object.text("Mouse object: " + intersects[ 0 ].object.name);
			statsBox.objectPosition.text("Mouse object position: " + roundArray(intersects[ 0 ].object.position.toArray()));
		} else {
			statsBox.mouse.text("Mouse: none");
			statsBox.object.text("Object: none");
			statsBox.objectPosition.text("Object position: none");
		}
	}

	function carStats( statsBox ) {
		var car = world.cars[0];
		if (car) {
			var p = roundArray(car.position.toArray());
			var f = roundArray(car.forward.toArray());

			if (pp !== p) {
				statsBox.position.text("Car position: " + roundArray(car.position.toArray()));
			}

			if (pf !== f) {
				statsBox.forward.text("Car forward: " + roundArray(car.forward.toArray()));
			}

			pp = p;
			pf = f;
		}
	}


	function roundArray( arr, decimals ){
		if( !decimals ) decimals = 2;

		var x = Math.pow(10, decimals);
		arr[0] = Math.round(arr[0] * x) / x;
		arr[1] = Math.round(arr[1] * x) / x;
		arr[2] = Math.round(arr[2] * x) / x;

		return "[" + arr[0] + ", " + arr[1] + ", " + arr[2] + "]";
	}
});