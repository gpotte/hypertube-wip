////////////////// SUBTITLES CONNEXION //////////////////////
let OS = require('opensubtitles-api');
let OpenSubtitles = new OS({
    useragent:'OSTestUserAgentTemp',
    username: 'scredi',
    password: 'chatel86',
    ssl: false
});
let fs = require('fs');
let download = require('download');
///////////////////////////////////////////////////////////////
router.get('/movie/:id/:qual', middleware.loggedIn(), (req, res)=>{
  var room = req.params.id + encodeURI(Math.trunc(Math.random() * 10000000)),
  qual  = req.params.qual,
  info  = request('https://yts.ag/api/v2/movie_details.json?movie_id='+req.params.id, function(err, response, body){
    body = JSON.parse(body);
    
    // LE PRECEDENT CODE FAISAIT DES BUGS ET RECUPERAIT PARFOIS DES FILMS EN 3D ! EN EFFET L'ORDRE 0/1 N'EST PAS TJRS POUR SD/HD SELON API
    // RAPPEL DE L'ANCIEN CODE
    // var hash = qual === "sd" ? body.data.movie.torrents[0].hash : body.data.movie.torrents[1].hash;
	let hash = "";
    for (var i = 0, len = body.data.movie.torrents.length; i < len; i++) {
	  if (qual === "sd" && (body.data.movie.torrents[i].quality == "720p" || body.data.movie.torrents[i].quality == "480p")) { //JE N'AI TROUVE AUCUN TORRENT 480p pour l'instant!
			hash = body.data.movie.torrents[i].hash;		
		} else if (qual === "hd" && body.data.movie.torrents[i].quality == "1080p") { 
			hash = body.data.movie.torrents[i].hash; 
    	}
	} 
    
    
    magnet = 'magnet:?xt=urn:btih:'+ hash +'&dn='+ encodeURI(body.data.movie.title);
    var engine = torrentStream(magnet, {name: body.data.movie.slug, path: '/tmp/hypertube-files', trackers: ["udp://glotorrents.pw:6969/announce",
                                        "udp://tracker.opentrackr.org:1337/announce",
                                        "udp://torrent.gresille.org:80/announce",
                                        "udp://tracker.openbittorrent.com:80",
                                        "udp://tracker.coppersurfer.tk:6969",
                                        "udp://tracker.leechers-paradise.org:6969",
                                        "udp://p4p.arenabg.ch:1337",
                                        "udp://tracker.internetwarriors.net:1337"
    ]});

  //////////////////////////// SUBTITLES //////////////////////////////////////////////
  OpenSubtitles.login()
    .then(res => {
        console.log(res.token);
        console.log(res.userinfo);
    })
    .catch(err => {
        console.log(err);
    });

    var lang = ['fre', 'eng'];
    var path_cast = 'http://localhost:3030/srt?path='+ body.data.movie.slug + '/fr.vtt'; // Alex: le web browser essayait de load /tmp/film/fr.srt chose qu;il ne peut evidemment pas faire d'ou le new router.get SRT ||| De plus les .srt fonctionnent pas faut des .vtt
    OpenSubtitles.search({
        sublanguageid: lang.join(),       // Can be an array.join, 'all', or be omitted.
        hash: hash,   // Size + 64bit checksum of the first and last 64k
        // filesize: '129994823',      // Total size, in bytes.
        // path: 'foo/bar.mp4',        // Complete path to the video file, it allows
                                      //   to automatically calculate 'hash'.
        // filename: 'bar.mp4',        // The video file name. Better if extension is included.
        // season: '2',
        // episode: '3',
        langcode: 'fr',
        extensions: 'vtt', // Accepted extensions, defaults to 'srt'.
        limit: 'best',                 // Can be 'best', 'all' or an
                                    // arbitrary nb. Defaults to 'best'
        imdbid: body.data.movie.imdb_code // 'tt528809' is fine too.
        // fps: '23.96',               // Number of frames per sec in the video.
        // query: 'Charlie Chaplin',   // Text-based query, this is not recommended.
        // gzip: true                  // returns url to gzipped subtitles, defaults to false
    }).then(function(result){
        console.log(result.fr.url);
        download(result.fr.url, '/tmp/hypertube-files/'+ body.data.movie.slug, {filename: "fr.vtt"}).then(() => {
          console.log('done!');
        });

        download(result.fr.url, {filename: "fr.srt"}).then(data => {
          fs.writeFileSync('/tmp/hypertube-files/'+ body.data.movie.slug, data, 777);
        });
        // download(result.fr.url).pipe(fs.createWriteStream('/tmp/hypertube-files/'+body.data.movie.title_long));
        Promise.all([
          result.fr.url
        ].map(x => download(x, '/tmp/hypertube-files/'+ body.data.movie.slug, {filename: "fr.vtt"}))).then(() => {
          console.log('files downloaded!');
        });
      });
        engine.on('ready', ()=>{
        const max = engine.files.reduce((prev, current)=>{
          return (prev.length > current.length) ? prev : current;
        });
	    engine.torrent.name = body.data.movie.slug; // Since we use a custom folder with HYPERtorrent-stream, we have to change it here otherwise it will load the old url.
        engine.files.forEach((file)=>{
	      file.path = body.data.movie.slug + '/' + file.name; // Since we use a custom folder with HYPERtorrent-stream, we have to change it here otherwise it will load the old url.
          if (file !== max)
          {
            file.deselect();
            fs.unlink('/tmp/hypertube-files/'+file.path, ()=>{});
          }
          else {
            var stream  = file.createReadStream();
            // request('http://www.theimdbapi.org/api/movie?movie_id='+ body.data.movie.imdb_code, (err2, response2, content)=>{
              // content = JSON.parse(content);
              res.render('movie/download', {title: body.data.movie.title, room: room, user: req.user, path: encodeURI(file.path), info: body, path_cast: path_cast});
			  setTimeout(function(){percent(engine, file, res, room)}, 2000);
            // });
          }
      });
    });
  });
});


router.get('/srt', (req, res)=>{
	let file = '/tmp/hypertube-files/' + decodeURI(req.query.path);
	fs.readFile(file, 'utf8', function (err,data) {
		if (err) {
			return console.log(err);
		}
		res.set('Content-Type', 'text/plain');
		res.send(data);
	});
});

router.get('/video', (req, res)=>{
  let file = '/tmp/hypertube-files/' + decodeURI(req.query.path);
  fs.stat(file, function(err, stats) {
  		if(err)
  		{
  			if(err.code === 'ENOENT')
        {
  				return res.sendStatus(404);
  			}
        return next(err)
  		}
  		let range = req.headers.range;
  		if(!range)
  		{
  			let err = new Error('Wrong range');
  				err.status = 416;
  			return next(err);
  		}
  		let positions = range.replace(/bytes=/, '').split('-');
  		let start = parseInt(positions[0], 10);
  		let file_size = stats.size;
  		let end = positions[1] ? parseInt(positions[1], 10) : file_size - 1;
  		let chunksize = (end - start) + 1;
  		let head = {
  			'Content-Range': 'bytes ' + start + '-' + end + '/' + file_size,
  			'Accept-Ranges': 'bytes',
  			'Content-Length': chunksize,
  			'Content-Type': 'video/mp4'
  		}
  		res.writeHead(206, head);
      if (start > end)
      {
        start = 0;
        end = 0;
      }
  		let stream_position = {
  			start: start,
  			end: end
  		}
  		let stream = fs.createReadStream(file, stream_position)
  		stream.on('open', function() {
  			stream.pipe(res);
  		})
  		stream.on('error', function(err) {
  			return next(err);
  		});
  	});
});

function percent(engine, file, res, room){
  io.sockets.in(room).emit('progress', {value: Math.round((engine.swarm.downloaded / file.length) * 100)});
  setTimeout(function(){percent(engine, file, res, room)}, 3000);
};

io.on('connection', (socket)=>{
  socket.on('subscribe', (data)=>{
    socket.pseudo = data.user;
    socket.join(data.room);
  });
});

module.exports = router;
