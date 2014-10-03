var MicroMachines = window.MicroMachines || {};

MicroMachines.WayPoint = function( index, positions ){
	this.index = index; //Position of way point (0 = start), set from MicroLoader.js on loading the way points
	this.positions = positions; // TODO: each position needs to contain a position (Vector3), rotation (float) and velocity ( Vector3, probably 0 )
}

MicroMachines.WayPoint.prototype = function() {
	var expose = {
		//  Put public methods in here (inside of expose)
		
		constructor: MicroMachines.WayPoint,
		
		getClosestCar: function() {
			var cars = world.cars;
		},
		
		resetCars: function() {
			var cars = world.cars;
			
			//TODO Chloe: Set each car's position, rotation and velocity to that of the way points
		}
	};
	
	// Put private methods in here (outside of expose)
	
	return expose;
}();