var page = 1;
var movies = [];
function getMovies(){
  $.getJSON('https://yts.ag/api/v2/list_movies.json?sort_by=like_count&with_rt_ratings=true&limit=50&page='+page, (data)=>{
    data.data.movies.sort((a, b)=>{return (b.torrents[0].seeds - a.torrents[0].seeds)});
    movies = movies.concat(data.data.movies); 
    $('.movie-list').html('');
    movies.forEach((movie)=>{
      // $.getJSON('http://www.theimdbapi.org/api/movie?movie_id='+ movie.imdb_code, (imdb)=>{
      // console.log(imdb.stars);
      // imdb.forEach((cast)=>{
                                    //  <div> casting: '+imdb.stars+'</div><br>\

      if (movie.torrents[1]){
      $('.movie-list').append('<div class="row-eq-height col-xs-5 col-md-3 thumbnail">\
                                  <img src="'+movie.large_cover_image+'">\
                                  <div class="caption">\
                                    <h3>'+movie.title+'</h3>\
                                    <small>'+movie.summary.substring(0, 100)+'</small><br>\
                                    <button class="btn btn-default">'+movie.rating+'/10</button>\
                                    <a href="http://localhost:3030/movie/'+movie.id+'/sd" class="btn btn-success">Watch</a>\
                                    <a href="http://localhost:3030/movie/'+movie.id+'/hd" class="btn btn-success">Watch HD</a>\
                                  </div>\
                                </div>')
      } else {
        $('.movie-list').append('<div class="row-eq-height col-xs-5 col-md-3 thumbnail">\
                                    <img src="'+movie.large_cover_image+'">\
                                    <div class="caption">\
                                      <h3>'+movie.title+'</h3>\
                                      <small>'+movie.summary.substring(0, 100)+'</small><br>\
                                      <button class="btn btn-default">'+movie.rating+'/10</button>\
                                      <a href="http://localhost:3030/movie/'+movie.id+'/sd" class="btn btn-success">Watch</a>\
                                    </div>\
                                  </div>')
      }
    });
      });
  // });
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
