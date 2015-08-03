var http = require('http');
var url = require('url');
var path = require('path');
var fs = require('fs');
var chalk = require('chalk');
var bcrypt = require('bcryptjs');
var index = fs.readFileSync(__dirname + '/index.html');

// Send index.html to all requests
var app = http.createServer(function(req, res) {

  var uri = url.parse(req.url).pathname, 
      filename = path.join(process.cwd(), uri);
  
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

    var cookies = parseCookies(req);
    console.log(cookies);
    if(!cookies['chatId']){ // If the cookie does not exist
      var userId = 'user' // Create id for user
        + (new Date().getTime()) + '-' 
        + (Math.round(Math.random() * 10)) 
      var expireTime = '; expires=' 
        + new Date(new Date().getTime()+86409000).toUTCString();

      res.writeHead(200, { // Set the chatId cookie
        'Content-Type': 'text/html',
        'Set-Cookie': 'chatId=' + userId + expireTime
      });

      /* Read the user info file */
      fs.readFile('./users/user_info.json', function(err, data){
        if (err) throw err;
        console.log(data);
        var fileData = JSON.parse(data);
        if (!fileData.hasOwnProperty(userId)){ // Add user if they do not exist 
          fileData[userId] = {
            username: null // This will be defined by the user
          };
          fs.open('./users/user_info.json','w',function(err, file){ // Open for writing
            if (err) throw err;
            fs.write(file, JSON.stringify(fileData), function(err, data){ // Write to file
              if (err) throw err;
              console.log(chalk.yellow('Added ' + userId + ' to records'));
            });
          });
        }
      });
    }

    fs.readFile(filename, "binary", function(err, file) {
      if(err) {        
        res.writeHead(500, {"Content-Type": "text/plain"});
        res.write(err + "\n");
        res.end();
        return;
      }

      //res.writeHead(200);
      res.write(file, "binary");
      res.end();
    });

  /*fs.readFile(__dirname + req.url, function(err, data){
    console.log(__dirname + req.url);
    if (err) {
      res.writeHead(404);
      res.end(JSON.stringify(err));
      return;
    }
    res.writeHead(200);
    var cookies = parseCookies(req);
    if(!cookies['chatId']){ // If the cookie does not exist
      var userId = 'user' // Create id for user
        + (new Date().getTime()) + '-' 
        + (Math.round(Math.random() * 10)) 
      var expireTime = '; expires=' 
        + new Date(new Date().getTime()+86409000).toUTCString();

      res.writeHead(200, { // Set the chatId cookie
        'Content-Type': 'text/html',
        'Set-Cookie': 'chatId=' + userId + expireTime
      });

      /* Read the user info file */
      /*fs.readFile('./users/user_info.json', function(err, data){
        if (err) throw err;
        var fileData = JSON.parse(data);
        //if (!fileData.hasOwnProperty(userId)){ // Add user if they do not exist 
          fileData[userId] = {
            username: null // This will be defined by the user
          };
          fs.open('./users/user_info.json','w',function(err, file){ // Open for writing
            if (err) throw err;
            fs.write(file, JSON.stringify(fileData), function(err, data){ // Write to file
              if (err) throw err;
              console.log(chalk.yellow('Added ' + userId + ' to records'));
            });
          });
        //}
      });
    }
    res.end(index);*/
  });
  //res.end(index);
});

// Socket.io server listens to our app
var io = require('socket.io').listen(app);

// Emit welcome message on connection
io.on('connection', function(socket) {
  // Use socket to communicate with this particular client only, sending it it's own id
  socket.emit('welcome', { message: 'Welcome!', id: socket.id });
  socket.on('i am client', console.log);

  socket.on('login', function(data){
    var salt = bcrypt.genSaltSync(10);
    var hash = bcrypt.hashSync("B4c0/\/", salt);
    console.log(hash); 
  });

  socket.on('message sent', function(data){
    console.log(data);
    io.emit('message received', {
      message: data.message
    });
    io.emit('message delivered', { 
      time: new Date().getTime() 
    });
  });
});

app.listen(3000,function(){
  console.log('App listening on localhost:3000');
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