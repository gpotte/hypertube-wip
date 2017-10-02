$.getJSON('http://www.theimdbapi.org/api/movie?movie_id='+ imdb_code, (data)=>{
    console.log(data.stars);
   $('#description').append('<h5> Casting: '+ data.stars +'<h5>')
  });