var bcrypt        = require('bcryptjs');
var bodyParser    = require('body-parser');
var chalk         = require('chalk');
var cookieParser  = require('cookie-parser');
var express       = require('express');
var flash         = require('connect-flash');
var fs            = require('fs');
var http          = require('http');
var mongolabs     = require('./mongolabs');
var mongoose      = require('mongoose');
var passport      = require('passport');
var session       = require('express-session');
var Strategy      = require('passport-local').Strategy;
var path          = require('path');
var url           = require('url');

/* Express configuration */
var app = require('express')();
app.use(express.static('./'));
app.use(bodyParser.urlencoded({
  extended: true
})); 
app.use(cookieParser('keyboard cat'));
app.use(session({ cookie: { maxAge: 60000 }}));
app.use(flash());
app.use(passport.initialize());
app.use(passport.session());

/* Mongoose schema and model definitions */
var userSchema = mongoose.Schema({
  name: String,
  pass: String
});
var User = mongoose.model('User', userSchema);

/* Configure passport strategy */
passport.use(new Strategy({
    usernameField: 'login-user',
    passwordField: 'login-pass'
  },
  function(username, password, callback) {
    mongolabs.openConnection(function(err, db){
      mongolabs.closeConnection(db, function(err, data){
        if (err) {
          throw err;
        }
      });
      if (err) {
        throw err;
      }
      User.findOne({ name: username }, function (err, user) {
        if (err) { 
          return callback(err); 
        }
        if (!user) {
          return callback(null, false, { message: 'Incorrect username.' });
        }
        if (user) {
          var loginSuccessful = bcrypt.compareSync(password, user['pass']);
          if (!loginSuccessful){
            return callback(null, false, { message: 'Incorrect password.' });
          }
        }
        return callback(null, user);
      });
    });
  }
));

passport.serializeUser(function(user, cb) {
  cb(null, user.id);
});

passport.deserializeUser(function(id, cb) {
  db.users.findById(id, function (err, user) {
    if (err) { return cb(err); }
    cb(null, user);
  });
});

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

      mongolabs.openConnection(function(err, db){
        if (err) {
          throw err;
        }
        /* Check to see if the username is taken */
        User.find({ name: username }, function(err, docs) {
          
          /* Username free, create new account */
          if (!docs.length){
            var newUser = new User({ 
              name: username,
              pass: hash
            });

            /* Save the user to the db */
            newUser.save(function (err, newUser) {
              if (err) {
                return console.error(err);
              }

              res.send('User created!');
              
              /* Close the mongo connection */
              db.close(function(err,data){
                if (err) {
                  throw err;
                }
              });
            });
          } else {                
            res.send('Username taken.');

            /* Close the mongo connection */
            db.close(function(err,data){
              if (err) {
                throw err;
              }
            });
          }
        });
      });
    });
  });
});

/* Passport authentication */
app.post('/login', passport.authenticate('local', { 
    failureRedirect: '/',
    failureFlash: true,
    successFlash: 'Authentication successful!'    
  }), function(req, res) {
    res.redirect('/');
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

  });
});

/**** Helper functions ***/

function closeDatabase(){
  /* Close the mongo connection */
  db.close(function(err,data){
    if (err) {
      throw err;
    }
  });
}

function validatePassword(){

}

function parseCookies (request) {
  var list = {};
  rc = request.headers.cookie;
  rc && rc.split(';').forEach(function(cookie) {
    var parts = cookie.split('=');
    list[parts.shift().trim()] = decodeURI(parts.join('='));
  });
  return list;
}