$.getJSON('http://www.theimdbapi.org/api/movie?movie_id='+ imdb_code, (data)=>{
   $('#description').append('<h5> Casting: '+ data.stars +'<h5>')
  });