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
  res.render('player', { layout: 'mobile.hbs' });
});

console.log('Listening on port ' + port);

var MicroServer = require('./MicroServer')( io );
MicroServer.init();