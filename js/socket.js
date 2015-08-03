var socket = io();

  /**
  * When the user connects...
  */
  socket.on('welcome', function(data) {
    addMessage(data.message);
    // Respond with a message including this clients' id sent from the server
    socket.emit('i am client', {
      data: 'foo!', 
      id: data.id
    });
  });
  socket.on('error', console.error.bind(console));
  socket.on('message', console.log.bind(console));

  socket.on('message received', function(data){
    addMessage(data.message + ' (Sending...)');
  });
  /**
  * When the messaged is successfully delivered, mark the message as sent
  */
  socket.on('message delivered', function(data){
    var re = /\s\(Sending\.{3}\)/;
    var elems = document.getElementsByClassName('message-text');
    var latest = elems[elems.length - 1];
    var baseText = latest.innerHTML.replace(re, '');
    var time = moment(data.time).format('H:mma');
    latest.innerHTML = baseText += " (Sent at " + time + ")";
  });

  function addMessage(message) {
    var text = document.createTextNode(message);
    var messageField = document.getElementById('message-list');
    el = document.createElement('li');
    el.className = 'message-text';
    messages = document.getElementById('messages');
    el.appendChild(text);
    messages.appendChild(el);
    messageField.scrollTop = messageField.scrollHeight;
  }

  function sendMessage(){
    var messageField = document.getElementById('message-field');
    var message = messageField.value;
    messageField.value = '';
    socket.emit('message sent', {
      message: message
    });
  };

  function login(){
    var username = document.getElementById('username-field').value;
    var password = document.getElementById('password-field').value;
    socket.emit('login', {
      username: username,
      password: password
    });
  }