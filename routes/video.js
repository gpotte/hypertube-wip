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
        // console.log(res.token);
        // console.log(res.userinfo);
    })
    .catch(err => {
        console.log(err);
    });
    var lang = ['fre', 'eng'];
    var path_sub_fr = 'http://localhost:3030/srt?path='+ body.data.movie.slug+ '/fr.vtt';
    var path_sub_en = 'http://localhost:3030/srt?path='+ body.data.movie.slug+ '/en.vtt';
    OpenSubtitles.search({
        sublanguageid: lang.join(),
        hash: hash,
        extensions: ['srt','vtt'],
        limit: 'best',
        imdbid: body.data.movie.imdb_code
    }).then(function(result){
        // console.log(result);
        download(result.fr.url, '/tmp/hypertube-files/'+ body.data.movie.slug, {filename: "fr.srt"}).then(() => {
          // console.log('fr subtitles done!');
          download(result.en.url, '/tmp/hypertube-files/'+ body.data.movie.slug, {filename: "en.srt"}).then(() => {
          // console.log('en subtitles done!');
        });
        });

        download(result.fr.url, {filename: "fr.srt"}).then(data => {
          fs.writeFileSync('/tmp/hypertube-files/'+ body.data.movie.slug, data, 777);
        });
        download(result.en.url, {filename: "en.srt"}).then(data => {
          fs.writeFileSync('/tmp/hypertube-files/'+ body.data.movie.slug, data, 777);
        });
         //download(result.fr.url).pipe(fs.createWriteStream('/tmp/hypertube-files/'+body.data.movie.slug));
        Promise.all([
          result.fr.url,
        ].map(x => download(x, '/tmp/hypertube-files/'+ body.data.movie.slug, {filename: "fr.srt"}))).then(() => {
              //conversion en vtt
          // console.log('SOUS TITRE FR DOWNLOADED !!!!!!!!!!!!');
        });
        Promise.all([
          result.en.url,
        ].map(x => download(x, '/tmp/hypertube-files/'+ body.data.movie.slug, {filename: "en.srt"}))).then(() => {
              //conversion en vtt
                  fs.createReadStream('/tmp/hypertube-files/'+ body.data.movie.slug+ '/en.srt')
                    .pipe(srt2vtt())
                    .pipe(fs.createWriteStream('/tmp/hypertube-files/'+ body.data.movie.slug+ '/en.vtt'))
                  fs.createReadStream('/tmp/hypertube-files/'+ body.data.movie.slug+ '/fr.srt')
                    .pipe(srt2vtt())
                    .pipe(fs.createWriteStream('/tmp/hypertube-files/'+ body.data.movie.slug+ '/fr.vtt'))
          // console.log('SOUS TITRE EN DOWNLOADED !!!!!!!!!!!!');
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
              res.render('movie/download', {title: body.data.movie.title, room: room, user: req.user, path: encodeURI(file.path), info: body, path_sub_fr: path_sub_fr, path_sub_en: path_sub_en});
			        setTimeout(function(){percent(engine, file, res, room)}, 2000);
            // });
          }
      });
    });
  });
});


router.get('/srt', middleware.loggedIn(), (req, res)=>{
		res.set('Content-Type', 'text/vtt');
		res.sendFile('/tmp/hypertube-files/' + decodeURI(req.query.path));
});

router.get('/video', middleware.loggedIn(), (req, res)=>{
  let file = '/tmp/hypertube-files/' + decodeURI(req.query.path);
  fs.stat(file, function(err, stats) {
  		if(err)
  				return res.sendStatus(404);
  		let range = req.headers.range;
  		if(!range)
        return res.sendStatus(416);
  		let positions = range.replace(/bytes=/, '').split('-');
  		let start = parseInt(positions[0], 10);
  		let file_size = stats.size;
  		let end = positions[1] ? parseInt(positions[1], 10) : file_size - 1;
      end = end > (file_size - 1) ? file_size - 1 : end;
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
        return res.sendStatus(404);
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
