$(function() {
  var socket = io();
  $(document).ready(()=>{
    socket.emit('subscribe', {user: user, room: room});
  });

  socket.on('progress', (status)=>{
    console.log(status);
    $('.progress-bar').css('width', status.value + '%').attr('aria-valuenow', status.value).html(status.value+'%');
  });
});
