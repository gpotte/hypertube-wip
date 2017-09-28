router.get('/movie/:title/:hash', middleware.loggedIn(), (req, res)=>{
  var room = req.params.title + encodeURI(Math.trunc(Math.random() * 10000000)),
  magnet = 'magnet:?xt=urn:btih:'+req.params.hash+'&dn='+ encodeURI(req.params.title);
  var engine = torrentStream(magnet, {path: '/tmp/test', trackers: ["udp://glotorrents.pw:6969/announce",
                                      "udp://tracker.opentrackr.org:1337/announce",
                                      "udp://torrent.gresille.org:80/announce",
                                      "udp://tracker.openbittorrent.com:80",
                                      "udp://tracker.coppersurfer.tk:6969",
                                      "udp://tracker.leechers-paradise.org:6969",
                                      "udp://p4p.arenabg.ch:1337",
                                      "udp://tracker.internetwarriors.net:1337"
  ]});

  engine.on('ready', ()=>{
    const max = engine.files.reduce((prev, current)=>{
      return (prev.length > current.length) ? prev : current;
    });
    engine.files.forEach((file)=>{
      if (file !== max)
      {
        file.deselect();
          fs.unlink('/tmp/test/'+file.path, ()=>{
            console.log('removing '.red, file.path)
        });
      }
      else {
        var stream  = file.createReadStream();
        res.render('movie/download', {title: req.params.title, room: room, user: req.user, path: encodeURI(file.path)});
        setTimeout(function(){percent(engine, file, res, room)}, 2000);
      }
    });
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
