var MAX_PLAYERS = 2;
var os = require('os');
var MicroMachines = MicroMachines || {};

MicroMachines.Games = [];

MicroMachines.MicroServer = function(){
	var expose = {
		init: function() {
			var io = MicroMachines.IO;
			io.sockets.on('connection', function ( socket ) {

				socket.on('start game', function() {
					MicroMachines.Games[socket.id] = {
						id: socket.id,
						socket: socket,
						players: []
					};
					socket.emit('game started', { networkIp: getNetworkIP(), gameId: socket.id });
				});

				socket.on('add player', function ( data ) {
					var game = MicroMachines.Games[data.gameId];
					if(game != undefined) {
						if(game.players.length < MAX_PLAYERS) {
							game.players.push({
								id: socket.id,
								socket: socket
							})
							game.socket.emit('add player', { playerId: socket.id});
						}
					} else {
						socket.emit('no game');
					}
				});

				socket.on('move car', function ( data ) {
					var game = MicroMachines.Games[data.gameId];
					if(game != undefined) {
						game.socket.emit('move car', { playerId: socket.id, direction: data.direction });
					}
				});

				socket.on('disconnect', function () {
					var game = MicroMachines.Games[socket.id];
					if(game != undefined) {
						for(var i in game.players){
							game.players[i].socket.disconnect();
						}
						delete MicroMachines.Games[socket.id];
					}
					//remove players and then clean up empty games
				});
			});
		}
	}

	function getNetworkIP() {
		var address;
		var interfaces = os.networkInterfaces();
		for (var dev in interfaces) {
			var alias = 0;
			interfaces[dev].forEach(function(details){
				if (details.family == 'IPv4' && details.address != "127.0.0.1") {
					address =  details.address + ":" + "3000";
				}
			});
		}

		return address;
	};

	return expose;
}();

module.exports = function( io ) {
	MicroMachines.IO = io;
	return MicroMachines.MicroServer;
};