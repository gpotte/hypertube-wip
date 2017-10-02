var page = 1;
function getMovies(){
	
	$.ajax({
          url: 'http://oneom.tk/ep',
          type: 'GET',
          dataType: 'json',
          success: function(data) { alert(data); },
          error: function() { console.log("API ONEOM Call failed."); },
          beforeSend: function(request) {
		        request.setRequestHeader('Accept', 'application/json');
		  }
        });

      
      
  page++;
};

$(document).ready(()=>{
  getMovies()
});
      
$(window).scroll(()=>{
  if ($(window).scrollTop() >= $(document).height() - $(window).height() - 10) {
      getMovies();
   }
});