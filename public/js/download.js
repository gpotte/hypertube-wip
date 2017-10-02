$(function() {
  var socket = io();
  $(document).ready(()=>{
    socket.emit('subscribe', {user: user, room: room});
  });

  socket.on('progress', (status)=>{
    console.log(status);
  });
});
