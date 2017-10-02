$('#username').focus(()=> {
  $('#usernameCond').removeClass("inactive");
  $('#usernameCond').addClass('active');
});

$('#username').blur(()=>{
  $('#usernameCond').removeClass("active");
  $('#usernameCond').addClass('inactive');
});

$('#password').focus(()=> {
  $('#passwordCond').removeClass("inactive");
  $('#passwordCond').addClass('active');
});

$('#password').blur(()=>{
  $('#passwordCond').removeClass("active");
  $('#passwordCond').addClass('inactive');
});

$('#lostForm').submit((ev)=>{
  $('#lostForm').submit(false);
});
