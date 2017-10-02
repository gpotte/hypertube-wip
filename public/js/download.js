$(function() {
  var socket = io();
  $(document).ready(()=>{
    socket.emit('subscribe', {user: user, room: room});
  });

  socket.on('progress', (status)=>{
    console.log(status);
  });
});

function getComment(imdb_code){
  $.ajax({
    type: 'GET',
    contentType: 'application/json',
    url: 'http://localhost:3030/comment/'+imdb_code,
    success: function(data) {
      if (data !== "Error")
      {
        $("#commentSection").html("");
        $("#commentSection").prepend(data);
      }
    }
  });
}

$(document).ready(()=>{
  $('#commentForm').submit((ev)=>{
    ev.preventDefault();
    $.ajax({
      type: 'POST',
      data: JSON.stringify({comment: $("#newComment").val(), imdb: imdb_code}),
      contentType: 'application/json',
      url: 'http://localhost:3030/comment',
      success: function(data) {
        if (data !== "Error")
          $("#commentSection").prepend(data);
      }
    });
    $("#newComment").val('');
  });

  getComment(imdb_code);
  setInterval(()=>{getComment(imdb_code)}, 7000);
});
