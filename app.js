var express = require('express');
var app = express();

var port = 3000;

// var server = require('http').Server(app);
// var io = require('socket.io')(server);

var expressHbs = require('express-handlebars');

app.engine('hbs', expressHbs({extname:'hbs', defaultLayout:'main.hbs'}));
app.set('view engine', 'hbs');
app.use(express.static(__dirname + '/public')); 

app.get('/', function(req, res){
  res.render('index');
});

app.get('/player', function(req, res){
  res.render('player', {layout: 'mobile.hbs'});
});

var io = require('socket.io').listen(app.listen(port));



console.log('Listening on port ' + port);


// server code
io.sockets.on('connection', function (socket) {
    socket.on('new game', function (data) {
        //io.sockets.emit('message', data);

        // games.push(new Game(socket, data.game));

        // console.log('new room!');
        // console.log(data);
        // console.log(data.room);

        // socket.join(data.game);

    });

    socket.on('connect controller', function (data) {
        io.sockets.emit('connect controller', data);

        // console.log(data);
    });


    socket.on('move car', function  (data) {
        io.sockets.emit('move car', data);
    });
});