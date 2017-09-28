var page = 1;
function getMovies(){
  $.getJSON('https://yts.ag/api/v2/list_movies.json?sort_by=like_count&with_rt_ratings=true&limit=24&page='+page, (data)=>{
    data.data.movies.forEach((movie)=>{
      $('.container').append('<div class="row-eq-height col-xs-5 col-md-3 thumbnail">\
                                  <img src="'+movie.large_cover_image+'">\
                                  <div class="caption">\
                                    <h3>'+movie.title+'</h3>\
                                    <small>'+movie.summary.substring(0, 100)+'</small><br>\
                                    <button class="btn btn-default">'+movie.rating+'/10</button>\
                                    <a href="http://localhost:3030/movie/'+encodeURI(movie.title)+'/'+movie.torrents[0].hash+'" class="btn btn-success">Watch</a>\
                                  </div>\
                                </div>')
    });
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
