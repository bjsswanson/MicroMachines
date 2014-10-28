var MicroMachines = window.MicroMachines || {};

MicroMachines.PhoneController = (function(){
   var socket;
   var $BTNS;
   var $BTN_LEFT;
   var $BTN_RIGHT;
   var PLAYER_ID;

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

      socket.emit('move car', { 'playerID': PLAYER_ID, 'direction': MOVE_CAR });
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

      $BTNS.off('touchstart.touchButton').on('touchstart.touchButton', function(e){
         var $el = $(e.target);

         $el.addClass('active');
      });

      $BTNS.off('touchend.touchButton').on('touchend.touchButton', function(e){
         var $el = $(e.target);

         $el.removeClass('active');
      });
   };

   var removeEventListeners = function(){
      document.removeEventListener('touchstart', onTouchStart);

      $BTNS.off('touchstart.touchButton');

      $BTNS.off('touchend.touchButton');
   };

   var disconnect = function(callback){
      if($.isFunction(callback)){
         callback();
      }
   };

   var connect = function(callback){
      socket = io.connect();

      socket.emit('connect controller', {});

      socket.on('player added', function(data){
         if(typeof PLAYER_ID === 'undefined'){
            PLAYER_ID = data.playerID;

            if($.isFunction(callback)){
               callback();
            }
         }
      });

      socket.on('remove controller', function(data){
         var REMOVED_PLAYER = data.playerID;

         if(REMOVED_PLAYER === PLAYER_ID){
            disconnect(removeEventListeners);
         }
      });
   };

   var init = function(){
      $BTNS = $('.btn');
      $BTN_LEFT = $('.btnLeft');
      $BTN_RIGHT = $('.btnRight');

      connect(setEventListeners);
   };

   return {
      init: init,
      connect: connect,
      disconnect: disconnect
   };
}());

MicroMachines.PhoneController.init();