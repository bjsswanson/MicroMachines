var express = require('express');
var app = express();
var expressHbs = require('express-handlebars');

app.engine('hbs', expressHbs({extname:'hbs', defaultLayout:'main.hbs'}));
app.set('view engine', 'hbs');
app.use(express.static(__dirname + '/public')); 

app.get('/', function(req, res){
  res.render('index');
});

app.listen(3000);