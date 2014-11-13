var MicroMachines = window.MicroMachines || {};

MicroMachines.MobileInput = function() {
	var socket;
	var buttons = $('.btn');
	var leftButton = $('.btnLeft');
	var rightButton = $('.btnRight');
	var gameId = getUrlParameter('gameId');

	var expose = {
		init: function(){
			socket = io.connect();
			if(gameId != undefined) {
				socket.emit('add player', { gameId: gameId });
				addEventListeners();
			} else {
				console.error('No game id');
			}
		}
	};

	function getUrlParameter( param ) {
		var url = window.location.search.substring(1);
		var params = url.split('&');
		for (var i = 0; i < params.length; i++) {
			var qParam = params[i].split('=');
			if (qParam[0] == param) {
				return qParam[1];
			}
		}
	};

	function addEventListeners(){
		buttons.on('touchstart', function( e ){
			var $el = $(e.target);
			$el.addClass('active');
			sendDirection();
		});

		buttons.on('touchend', function( e ){
			var $el = $(e.target);
			$el.removeClass('active');
			sendDirection();
		});
	};

	function sendDirection() {
		var leftPressed = leftButton.hasClass('active');
		var rightPressed = rightButton.hasClass('active');
		if(leftPressed && rightPressed){
			socket.emit('move car', { gameId: gameId, direction: 'forward'})
		} else if(leftPressed) {
			socket.emit('move car', { gameId: gameId, direction: 'left'})
		} else if(rightPressed) {
			socket.emit('move car', { gameId: gameId, direction: 'right'})
		} else {
			socket.emit('move car', { gameId: gameId, direction: 'none'})
		}
	};

	return expose;
}();

MicroMachines.MobileInput.init();