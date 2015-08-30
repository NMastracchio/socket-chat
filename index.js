var bcrypt        = require('bcryptjs');
var bodyParser    = require('body-parser');
var chalk         = require('chalk');
var express       = require('express');
var fs            = require('fs');
var http          = require('http');
var mongolabs     = require('./mongolabs');
var mongoose      = require('mongoose');
var passport      = require('passport');
var LocalStrategy = require('passport-local').Strategy;
var path          = require('path');
var url           = require('url');

/* Express configuration */
var app = require('express')();
app.use(express.static('./'));
app.use(bodyParser.urlencoded({
  extended: true
})); 

/* Mongoose schema and model definitions */
var userSchema = mongoose.Schema({
  name: String,
  pass: String
});
var User = mongoose.model('User', userSchema);

passport.use(new LocalStrategy(
  function(username, password, callback){

  }
));

/* Configure socket.io */
var server = require('http').Server(app);
var io = require('socket.io')(server);

/* Set the server to listen */
var portNum = 3000;
server.listen(portNum, function(){
  console.log('Server listening on port ' + portNum);
});

/* Home GET request */
app.get('/', function(req, res){

  fs.exists(filename, function(exists) {
    if(!exists) {
      res.writeHead(404, {"Content-Type": "text/plain"});
      res.write("404 Not Found\n");
      res.end();
      return;
    }
    if (fs.statSync(filename).isDirectory()) {
      filename += '/index.html';
    }

    /* Get the cookies from the requiest */
    var cookies = parseCookies(req);
    /* If the user does not already have a chatId cookie */
    if(!cookies['chatId']){ 
      var userId = 'user' /* Generate a userId */
        + (new Date().getTime()) + '-' 
        + (Math.round(Math.random() * 10)) 
      var expireTime = '; expires=' /* Create a cookie expiration of 24 hours */
        + new Date(new Date().getTime()+24*60*60*1000).toUTCString();

      /* Give the cookie to that user */
      res.writeHead(200, {
        'Content-Type': 'text/html',
        'Set-Cookie': 'chatId=' + userId + expireTime
      });
    }

    fs.readFile(filename, "binary", function(err, file) {
      if(err) {        
        res.writeHead(500, {"Content-Type": "text/plain"});
        res.write(err + "\n");
        res.end();
        return;
      }

      res.write(file, "binary");
      res.end();
    });
  });
});

app.post('/register', function(req, res){
  var params = req.body;
  var username = params['register-user'];
  var pass = params['register-pass'];

  bcrypt.genSalt(10, function(err, salt) {
    bcrypt.hash(pass, salt, function(err, hash) {
      if (err){
        throw err;
      } 
      console.log('Username: ', params['register-user']);
      console.log('Hashed password: ', typeof(hash));
      mongolabs.openConnection(function(err, db){
        if (err) {
          throw err;
        }
        /* Check to see if the username is taken */
        User.find({ name: username }, function(err, docs) {
          if (!docs.length){
            var newUser = new User({ 
              name: username,
              pass: hash
            });
            newUser.save(function (err, newUser) {
              if (err) return console.error(err);
              res.send('User created!');
              db.close(function(err,data){
                if (err) {
                  throw err;
                }
                console.log('db disconnected');
              });
            });
          } else {                
            res.send('Username taken.');
            db.close(function(err,data){
              if (err) {
                throw err;
              }
              console.log('db disconnected');
            });
          }
        });
        
      });
    });
  });
});

/* Passport authentication */
app.post('/login', function(req, res){
  passport.authenticate('local', function(req, res){
    console.log('test');
  });
});

/* On 'connection'... */
io.on('connection', function(socket) {
  /* ...emit 'welcome' */
  socket.emit('welcome', { message: 'Welcome!', id: socket.id });

  /* On 'login', create salt and hash */
  socket.on('login', function(data){
    var salt = bcrypt.genSaltSync(10);
    var hash = bcrypt.hashSync("B4c0/\/", salt);

    /* some function to handle the login goes here */
    socket.emit('login error',{
      err:err
    });
    /* Emit 'login successful' */
    socket.emit('login successful', {

    });
  });

  /* On 'message sent', emit 'message received' */
  socket.on('message sent', function(data){
    io.emit('message received', {
      message: data.message,
      time: new Date().getTime()
    });


    /* I don't think I'll need this vvv
    io.emit('message delivered', { 
      time: new Date().getTime() 
    });*/
  });
});

/**** Helper functions ***/

function parseCookies (request) {
  var list = {};
  rc = request.headers.cookie;
  rc && rc.split(';').forEach(function(cookie) {
    var parts = cookie.split('=');
    list[parts.shift().trim()] = decodeURI(parts.join('='));
  });
  return list;
}