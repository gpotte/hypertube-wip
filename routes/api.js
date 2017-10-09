let slug = require('slug');
let rp = require('request-promise');
var request = require('request-promise-cache');

function Torrent() {
	this.quality = '';
	this.url = '';
	this.magnet = ''; 
	this.hash = '';
	this.seeders = 0;
	this.leechers = 0;
	this.size_bytes = 0;
}

function IMDB() {
	this.title = 'N/A';
	this.slug = slug(this.title);
	this.genre = []; 
	this.rating = 0.0;
	this.description = 'N/A';
	this.resume = 'N/A';
	this.writers = [];
	this.image = '';
	this.release_date = 'N/A';
	this.year = 0;
	this.director = 'N/A';
	this.budget = 'N/A';
	this.other_titles = [];
	this.cast = [];
}

function Movie(title) {
	this.raw_title = title;
	this.raw_slug = 'n-a'
	this.id_IMDB = '';
	this.id_API = 0;
	this.screenshot = '';
	this.torrent = new Torrent();
	this.imdb = new IMDB();
}

function Serie(title) {
	this.raw_title = title;
	this.season = 0; 
	this.episode = 0;
	this.id_IMDB = '';
	this.id_API = 0;
	this.screenshot = '';
	this.torrent = new Torrent();
	this.imdb = new IMDB();
}

function imdb_fill(imdb_id, cb) {
	request({url: 'https://theimdbapi.org/api/movie?movie_id=' + imdb_id, cacheKey: 'https://theimdbapi.org/api/movie?movie_id=' + imdb_id, cache: 60000 * 60 * 24 * 30 })
	    .then(function (rqst) {
			let iminfo = new IMDB();
			imdb_info = JSON.parse(rqst.body)
			iminfo.title = imdb_info.title;
			iminfo.slug = slug(imdb_info.title);
			iminfo.genre = imdb_info.genre; 
			iminfo.rating = parseFloat(imdb_info.rating);
			iminfo.description = imdb_info.description;
			iminfo.resume = imdb_info.storyline;
			iminfo.writers = imdb_info.writers;
			iminfo.image = imdb_info.poster.large;
			iminfo.release_date = imdb_info.release_date;
			iminfo.year = imdb_info.year;
			iminfo.director = imdb_info.director;
			iminfo.budget = imdb_info.budget;
			iminfo.other_titles = imdb_info.metadata.also_known_as;
			iminfo.cast = imdb_info.cast;			
			cb(iminfo);
			
		})
		.catch(function (err) {
	        console.log("Calling IMDB API Error :", err)
	    });

}

function movies_fill(yts_movies, cb) {
	var movies = [];
	var torrents = [];
	
	yts_movies.data.movies.forEach(function(file, i) {
		
		var movie = new Movie(yts_movies.data.movies[i].title);
		movie.raw_slug = yts_movies.data.movies[i].slug;
		movie.id_IMDB = yts_movies.data.movies[i].imdb_code;
		movie.id_API = yts_movies.data.movies[i].id;
		movie.screenshot = yts_movies.data.movies[i].background_image;
		
		yts_movies.data.movies[i].torrents.forEach(function(trt, j) {
			var torrent = new Torrent();
			torrent.quality = trt.quality;
			torrent.url = trt.url;
			torrent.magnet = 'magnet:?xt=urn:btih:'+ trt.hash +'&dn='+ encodeURI(yts_movies.data.movies[i].raw_title);;
			torrent.hash = trt.hash;
			torrent.seeders = trt.seeds;
			torrent.leechers = trt.peers;
			torrent.size_bytes = trt.size_bytes;
			
			torrents.push(torrent)
		});
		
		imdb_fill(file.imdb_code, function(iminfo) {
			movie.torrent = torrents;
			movie.imdb = iminfo;
			movies.push(movie);
			
			if (i == yts_movies.data.movies.length - 1) {
				cb(movies);
			}
		});
											
		
		
    });
}

function series_fill(eztv_series, cb) {
	var series = [];
	
	eztv_series.torrents.forEach(function(file, i) {
		
		
			console.log("Passage", i, ' out of ', eztv_series.torrents.length - 1)
			var serie = new Serie(eztv_series.torrents[i].title);
			serie.season = parseInt(eztv_series.torrents[i].season);
			serie.episode = parseInt(eztv_series.torrents[i].episode);
			serie.id_IMDB = 'tt' + eztv_series.torrents[i].imdb_id;
			serie.id_API = eztv_series.torrents[i].id;
			serie.screenshot = 'https' + eztv_series.torrents[i].large_screenshot;
			
			var torrent = new Torrent();
			torrent.url = eztv_series.torrents[i].torrent_url;
			torrent.magnet = eztv_series.torrents[i].magnet_url;
			torrent.hash = eztv_series.torrents[i].hash;
			torrent.seeders = eztv_series.torrents[i].seeds;
			torrent.leechers = eztv_series.torrents[i].peers;;
			torrent.size_bytes = parseInt(eztv_series.torrents[i].size_bytes);
			
			imdb_fill('tt' + eztv_series.torrents[i].imdb_id, function(iminfo) {
				if (eztv_series.torrents[i].season != "0" && eztv_series.torrents[i].episode != "0" && eztv_series.torrents[i].season != null && eztv_series.torrents[i].episode != "0" && eztv_series.torrents[i].imdb_id != "") {
				serie.torrent = torrent;
				serie.imdb = iminfo;
				series.push(serie);
				}
				
				if (i == eztv_series.torrents.length - 1) {
					cb(series);
				}
			});
											
		//}
		
    });
}
									
									
// app.get('/api/:page', middleware.loggedIn(), (req, res)=>{
app.get('/api/:page', (req, res)=>{
	console.log("Page", req.params.page)
	let yts_api = {uri: 'https://yts.ag/api/v2/list_movies.json?sort_by=like_count&with_rt_ratings=true&limit=20&page=' + req.params.page, headers: {'User-Agent': 'Request-Promise'}, json: true };
	let eztv_api = {uri: 'https://eztv.ag/api/get-torrents?limit=10&page=' + req.params.page, headers: {'User-Agent': 'Request-Promise'}, json: true };
	
	
	rp(yts_api)
    .then(function (yts_movies) {
	    movies_fill(yts_movies, function(movies) {
	        rp(eztv_api)
		    .then(function (eztv_series) {
				series_fill(eztv_series, function(series) {
			        let hypertube_api = {title: 'HyperTube API', version: 1.0, date: Date.now(), movies: movies, series: series};
			        res.setHeader('Content-Type', 'application/json');
					res.send(JSON.stringify(hypertube_api));
				});
	
		    })
		    .catch(function (err) {
		        console.log("Calling EZTV Series API Error :", err)
		    });
		});

    })
    .catch(function (err) {
        console.log("Calling YTS Movie API Error :", err)
    });
    
});

app.get('/api/imdb/:code', (req, res)=>{
	// WHY I COPY THE IMDB API ? TO CACHE OFC ! (CACHE NOT DEV YET)
	rp({uri: 'https://theimdbapi.org/api/movie?movie_id=' + req.params.code, headers: {'User-Agent': 'Request-Promise'}, json: true })
	    .then(function (imdb) {
			res.setHeader('Content-Type', 'application/json');
			res.send(JSON.stringify(imdb));
			
		})
		.catch(function (err) {
	        console.log("Calling IMDB API Error in /api/imdb/:code :", err)
	    });

});


module.exports = router;


/*
	// app.get('/api/:page', middleware.loggedIn(), (req, res)=>{
app.get('/api/suggestions/:page', (req, res)=>{
	let request = require("request");
	
	let page = 1;
	let yts_api = {uri: 'https://api.github.com/user/repos', headers: {'User-Agent': 'Request-Promise'}, json: true };
	let yts_api = 'https://yts.ag/api/v2/list_movies.json?sort_by=like_count&with_rt_ratings=true&limit=50&page=' + page;
	let eztv_api = 'https://eztv.ag/api/get-torrents?limit=50&page=' + page;
	var movies = [];
	var shows = [];
	
	function get_shows(error, response, body) {
	    if (!error && response.statusCode == 200) {
			let torrents = JSON.parse(body).torrents
			for (let i=0; i < torrents.length; i++) {
				console.log(torrents[i].filename)
		    }
		    
	        shows = body;
	        
	        
	        request({url: yts_api}, get_movies);
	    } else { console.log(response.statusCode); }
	}
	function get_movies(error, response, body) {
	    if (!error && response.statusCode == 200) {
	        movies = body;
	        let hypertube_api = {title: 'HyperTube API', version: 1.0, date: Date.now(), movies: JSON.parse(movies), shows: JSON.parse(shows)};
	        
	        res.setHeader('Content-Type', 'application/json');
			res.send(JSON.stringify(hypertube_api));
			//console.log(JSON.stringify(hypertube_api));
	    } else { console.log(response.statusCode); }
	}
	
	request({url: eztv_api}, get_shows);
});


module.exports = router;

*/