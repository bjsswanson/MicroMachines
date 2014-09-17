$(function(){
	var stats = $('<div id="stats"></div>');
	stats.css("position", "absolute");
	stats.css("top", "0");
	stats.css("left", "0");
	stats.css("background-color", "lightgrey");
	stats.css("width", "250px");
	stats.css("height", "50px");
	$('body').append(stats);

	var position = $('<span id="position"></span>')
	position.css("display", "block");
	stats.append(position);

	var forward = $('<span id="forward"></span>')
	forward.css("display", "block");
	stats.append(forward);

	var pp = "[0, 0, 0]";
	var pf = "[0, 0, 0]";
	update();

	function update() {
		requestAnimationFrame( update );

		if(world){
			var cars = world.cars;
			var car = cars[0];
			if(car) {
				var p = roundArray(cars[0].position.toArray());
				var f = roundArray(cars[0].forward.toArray());

				if(pp !== p){
					position.text("Position: " + roundArray(cars[0].position.toArray()));
				}

				if(pf !== f){
					forward.text("Forward: " + roundArray(cars[0].forward.toArray()));
				}

				pp = p;
				pf = f;
			}
		}
	}


	function roundArray( arr ){
		arr[0] = Math.round(arr[0] * 100) / 100
		arr[1] = Math.round(arr[1] * 100) / 100
		arr[2] = Math.round(arr[2] * 100) / 100

		return "[" + arr[0] + ", " + arr[1] + ", " + arr[2] + "]";
	}
});