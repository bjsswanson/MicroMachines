var express = require('express');
var app = express();

var port = 3000;
var io = require('socket.io').listen(app.listen(port));

var expressHbs = require('express-handlebars');

app.engine('hbs', expressHbs({extname:'hbs', defaultLayout:'main.hbs'}));
app.set('view engine', 'hbs');
app.use(express.static(__dirname + '/public'));
app.use('/presentation', express.static(__dirname + '/presentation'));

app.get('/', function(req, res){
  res.render('index');
});

app.get('/player', function(req, res){
  res.render('player', {layout: 'mobile.hbs'});
});

console.log('Listening on port ' + port);


// sockets code
io.sockets.on('connection', function(socket) {

    socket.on('connect controller', function(data) {
        io.sockets.emit('add player', { playerID: socket.id });
    });

    socket.on('player added', function(data) {
        io.sockets.emit('player added', data);
    });


    socket.on('move car', function  (data) {
        io.sockets.emit('move car', data);
    });


    socket.on('disconnect', function(data){
        io.sockets.emit('remove player', { playerID: socket.id });
    });


});