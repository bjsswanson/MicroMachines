var MicroMachines = window.MicroMachines || {};

MicroMachines.PhoneController = (function(){
   var socket;
   var $BTNS;
   var $BTN_LEFT;
   var $BTN_RIGHT;

   var setDirection = function(){
      var BTN_LEFT_ACTIVE = $BTN_LEFT.hasClass('active');
      var BTN_RIGHT_ACTIVE = $BTN_RIGHT.hasClass('active');
      var MOVE_CAR;

      if(BTN_LEFT_ACTIVE && BTN_RIGHT_ACTIVE){
         MOVE_CAR = 'forward';
      } else if(BTN_LEFT_ACTIVE || BTN_RIGHT_ACTIVE){
         if(BTN_LEFT_ACTIVE){
            MOVE_CAR = 'left';
         } else if(BTN_RIGHT_ACTIVE){
            MOVE_CAR = 'right';
         }
      } else {
         MOVE_CAR = 'none';
      }

      socket.emit('move car', { 'direction': MOVE_CAR });
   };

   var onTouchEnd = function() {
      setDirection();
   };


   var onTouchStart = function(e) {
      setDirection();

      document.addEventListener('touchend', onTouchEnd);
   };


   var setEventListeners = function(){
      document.addEventListener('touchstart', onTouchStart);

      $BTN_LEFT.off('touchstart.touchButton').on('touchstart.touchButton', function(e){
         $BTN_LEFT.addClass('active');
      });

      $BTN_RIGHT.off('touchstart.touchButton').on('touchstart.touchButton', function(e){
         $BTN_RIGHT.addClass('active');
      });


      $BTN_LEFT.off('touchend.touchButton').on('touchend.touchButton', function(e){
         $BTN_LEFT.removeClass('active');
      });

      $BTN_RIGHT.off('touchend.touchButton').on('touchend.touchButton', function(e){
         $BTN_RIGHT.removeClass('active');
      });

   };

   var removeEventListeners = function(){
      // 
   };

   var connect = function(username, callback){
      $('.usernamePrompt').removeClass('active');
      $('.controller').addClass('active');

      socket = io.connect();

      socket.emit('connect controller', { username: username });

      if($.isFunction(callback)){
         callback();
      }


   };

   var disconnect = function(){
      // 
   };


   var init = function(){
      $BTNS = $('.btn');
      $BTN_LEFT = $('.btnLeft');
      $BTN_RIGHT = $('.btnRight');

      $('#joinGame').on('click', function(e){
         e.preventDefault();

         var usernameValue = $('.usernameInput').val();

         var usernameValueNoSpaces = usernameValue.replace(/\s/g, '');

         if(usernameValueNoSpaces.length){
            connect(usernameValue, setEventListeners);
         } else {
            alert('please enter a username');
         }

      });
   };

   return {
      init: init,
      connect: connect,
      disconnect: disconnect
   };
}());

MicroMachines.PhoneController.init();