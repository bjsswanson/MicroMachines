var MAX_PLAYERS = 2;
var MicroMachines = window.MicroMachines || {};

MicroMachines.Players = [];
MicroMachines.Input = function() {
	var socket = io.connect();
	var expose = {
		enabled: true,
		init: function() {
			gameStarted();
			addPlayer();
			moveCar();
			removePlayer();
			socket.emit('start game');
		},
		stop: function() {
			for(var i in MicroMachines.Players){
				var car = MicroMachines.Players[i].car;
				var input = car.input;
				input.forward = false;
				input.left = false;
				input.right = false;
			}
		}
	}

	function gameStarted() {
		socket.on('game started', function( data ){
			$(function(){
				new QRCode(document.getElementById("qrcode"), "http://" + data.networkIp + "/player?gameId=" + data.gameId);
			})
		});
	};

	function addPlayer() {
		socket.on('add player', function (data) {
			var carModel = world.cars.length % 2 ? '/cars/buggy_red.json' : '/cars/buggy_blue.json';

			if(world.cars.length < MAX_PLAYERS) {
				MicroMachines.Loader.loadCar(carModel, function (car) {
					MicroMachines.Players.push({
						id: data.playerId,
						car: car
					})
					
					if(world.cars.length >= 2){
						$('#qrcode').hide();
						resetGame();
					}
				});
			} else {

			}
		});
	};

	function moveCar() {
		socket.on('move car', function (data) {
			var playerId = data.playerId;
			var car = getPlayer(playerId).car;
			var input = car.input;
			var moveDirection = data.direction;

			if(MicroMachines.Input.enabled) {
				if (moveDirection === 'forward') {
					input.left = false;
					input.right = false;
					input.forward = true;
				} else if (moveDirection === 'left') {
					input.left = true;
					input.right = false;
					input.forward = false;
				} else if (moveDirection === 'right') {
					input.left = false;
					input.right = true;
					input.forward = false;
				} else {
					input.left = false;
					input.right = false;
					input.forward = false;
				}
			}
		});
	};

	function removePlayer() {
		socket.on('remove player', function (data) {
			var playerId = data.playerId;
			var carToRemove = getPlayer(playerId).car;

			MicroMachines.Loader.removeCar(carToRemove);
			socket.emit('removed player', { playerId: playerId });

			if(world.cars.length < 2){
				$('#qrcode').show();
			}
		});
	};

	function getPlayer( id ){
		for(var i in MicroMachines.Players){
			var player = MicroMachines.Players[i];
			if(id === player.id){
				return player;
			}
		}
	};

	return expose;
}();