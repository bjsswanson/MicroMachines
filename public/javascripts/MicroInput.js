var MicroMachines = window.MicroMachines || {};

MicroMachines.PhoneController = (function(){
   var SETTINGS = {
      value1: 'a',
      value2: 'b',
      value3: 'c',
      value4: 'd',
      value5: 'e'
   };


   var CONTROLLER_INPUTS = {
      forward: false,
      left: false,
      right: false
   };


   var EVENT_NAMESPACE = 'control';

   var $BTN_LEFT;
   var $BTN_RIGHT;

   var socket;


   var processEvent = function(e){
      console.log(e.touches);

      var touchListLength = e.touches.length;

      console.log(touchListLength);

      /*
      for(touchListLength in e.touches){
         console.log('touchlist');
      }
      */

      for(var i=0; i < touchListLength; i++) {
         console.log('touchlist: ' + i);



         console.log(e.touches[i].target);
      }

   };



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
      






      // document.removeEventListener('touchend', onTouchEnd);
   };


   var onTouchStart = function(e) {
      var touchList = e.touches;



      // console.log(e);

      // console.log(e.touches);
      // console.log(e.touches.length);

      // console.log(e.target);



      // for(var key in touchList){
         // console.log(touchList[key]);
      // }


      processEvent(e);





      setDirection();



      // var EVENT_TYPE = ;


      /*
      if(){

      }
      */

      for(var key in CONTROLLER_INPUTS){
         // console.log(CONTROLLER_INPUTS[key]);
      }

      document.addEventListener('touchend', onTouchEnd);


      // $('body').trigger('control.left');

      // $('body').trigger('control.right');

      // $('body').trigger('control.forward');
   };


   



   var setEventListeners = function(){
      // console.log('set event listeners');

      // document.addEventListener('touchstart', onTouchStart);


      document.addEventListener('touchstart', onTouchStart);

      // $(document).off('touchstart.touchController').on('touchstart.touchController', function(e){
         // console.log(e);
      // });


      $BTN_LEFT.off('touchstart.touchButton').on('touchstart.touchButton', function(e){
         // console.log('left down');

         $BTN_LEFT.addClass('active');
      });

      $BTN_RIGHT.off('touchstart.touchButton').on('touchstart.touchButton', function(e){
         // console.log('right down');

         $BTN_RIGHT.addClass('active');
      });


      $BTN_LEFT.off('touchend.touchButton').on('touchend.touchButton', function(e){
         // console.log('left up');

         $BTN_LEFT.removeClass('active');
      });

      $BTN_RIGHT.off('touchend.touchButton').on('touchend.touchButton', function(e){
         // console.log('right up');

         $BTN_RIGHT.removeClass('active');
      });

   };

   var removeEventListeners = function(){
      console.log('remove event listeners');
   };

   var connect = function(username, callback){
      $('.usernamePrompt').removeClass('active');
      $('.controller').addClass('active');



      console.log('connect');

      socket = io.connect();





      // socket.emit('connect controller', { game: getUrlVars()["id"]}, 



      socket.emit('connect controller', { username: username });


      if($.isFunction(callback)){
         callback();
      }


   };

   var disconnect = function(){
      console.log('disconnect');
   };

   // var init = (function(config){
   //    console.log(config);

   //    console.log('init');
   // }(SETTINGS));


   var init = function(){


      $BTN_LEFT = $('.btnLeft');



      $BTN_RIGHT = $('.btnRight');

      // console.log('init');


      // console.log($BTN_LEFT.length);

      // console.log($BTN_RIGHT.length);

      // console.log(SETTINGS);



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