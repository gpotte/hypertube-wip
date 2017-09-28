torrentStream   = require('torrent-stream'),
xss             = require('xss'),
colors          = require('colors'),
bcrypt          = require('bcrypt-nodejs'),
bodyParser      = require('body-parser'),
cookieParser    = require('cookie-parser'),
mongoose        = require("mongoose"),
express         = require('express'),
app             = express(),
passport        = require('passport'),
flash           = require('connect-flash'),
session         = require('express-session'),
port            = process.env.PORT || 3030,
http            = require('http').Server(app),
io              = require('socket.io')(http),
router          = express.Router(),
fs              = require('fs'),
request         = require('request'),
User            = require(process.env.PWD + '/models/user'),
middleware      = require(process.env.PWD + "/functions/middleware.js");

/////////////////SETUP ENV AND DB//////////////
if (!process.env.PWD) {
  process.env.PWD = process.cwd();
}
app.use(cookieParser());
app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.json());
app.use(express.static(__dirname + '/public'));
app.set("view engine", "ejs");

var dbConfig = require(process.env.PWD + '/db.js');
mongoose.connect(dbConfig.url , {useMongoClient: true});

require('./config/passport')(passport);
app.use(session({ secret: 'thisisthesecretphrase', resave: true, saveUninitialized: true})); // session secret
app.use(passport.initialize());
app.use(passport.session()); // persistent login sessions
app.use(flash()); // use connect-flash for flash messages stored in session
/////////////////SETUP ENV, DB AND PASSPORT//////////////

app.get('/', middleware.loggedIn(), (req, res)=>{
  res.render('index', {title: 'home', user: req.user});
});

app.get('/movie/:title/:hash', middleware.loggedIn(), (req, res)=>{
  var room = req.params.title + encodeURI(Math.trunc(Math.random() * 10000000)),
  magnet = 'magnet:?xt=urn:btih:'+req.params.hash+'&dn='+ encodeURI(req.params.title)+'&tr=udp://glotorrents.pw:6969/announce&tr=udp://tracker.opentrackr.org:1337/announce&tr=udp://torrent.gresille.org:80/announce&tr=udp://tracker.openbittorrent.com:80&tr=udp://tracker.coppersurfer.tk:6969&tr=udp://tracker.leechers-paradise.org:6969&tr=udp://p4p.arenabg.ch:1337&tr=udp://tracker.internetwarriors.net:1337';
  var engine = torrentStream(magnet, {path: '/tmp/test'});
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

app.get('/video', (req, res)=>{
  let file = '/tmp/test/' + decodeURI(req.query.path);
  fs.stat(file, function(err, stats) {

  		//
  		//	1.	If there was an error reading the file stats we inform the
  		//		browser of what actual happened
  		//
  		if(err)
  		{
  			//
  			//	1.	Check if the file exists
  			//
  			if(err.code === 'ENOENT')
  			{
  				//
  				// 	->	404 Error if file not found
  				//
  				return res.sendStatus(404);
  			}

  			//
  			//	2.	IN any other case, just output the full error
  			//
  			return next(err)
  		}

  		//
  		//	2.	Save the range the browser is asking for in a clear and
  		//		reusable variable
  		//
  		//		The range tells us what part of the file the browser wants
  		//		in bytes.
  		//
  		//		EXAMPLE: bytes=65534-33357823
  		//
  		let range = req.headers.range;

  		//
  		//	3.	Make sure the browser ask for a range to be sent.
  		//
  		if(!range)
  		{
  			//
  			// 	1.	Create the error
  			//
  			let err = new Error('Wrong range');
  				err.status = 416;

  			//
  			//	->	Send the error and stop the request.
  			//
  			return next(err);
  		}

  		//
  		//	4.	Convert the string range in to an array for easy use.
  		//
  		let positions = range.replace(/bytes=/, '').split('-');

  		//
  		//	5.	Convert the start value in to an integer
  		//
  		let start = parseInt(positions[0], 10);

  		//
  		//	6.	Save the total file size in to a clear variable
  		//
  		let file_size = stats.size;

  		//
  		//	7.	IF 		the end parameter is present we convert it in to an
  		//				integer, the same way we did the start position
  		//
  		//		ELSE 	We use the file_size variable as the last part to be
  		//				sent.
  		//
  		let end = positions[1] ? parseInt(positions[1], 10) : file_size - 1;

  		//
  		//	8.	Calculate the amount of bits will be sent back to the
  		//		browser.
  		//
  		let chunksize = (end - start) + 1;

  		//
  		//	9.	Create the header for the video tag so it knows what is
  		//		receiving.
  		//
  		let head = {
  			'Content-Range': 'bytes ' + start + '-' + end + '/' + file_size,
  			'Accept-Ranges': 'bytes',
  			'Content-Length': chunksize,
  			'Content-Type': 'video/mp4'
  		}

  		//
  		//	10.	Send the custom header
  		//
  		res.writeHead(206, head);

  		//
  		//	11.	Create the createReadStream option object so createReadStream
  		//		knows how much data it should be read from the file.
  		//
      if (start > end)
      {
        start = 0;
        end = 0;
      }
  		let stream_position = {
  			start: start,
  			end: end
  		}

  		//
  		//	12.	Create a stream chunk based on what the browser asked us for
  		//
  		let stream = fs.createReadStream(file, stream_position)

  		//
  		//	13.	Once the stream is open, we pipe the data through the response
  		//		object.
  		//
  		stream.on('open', function() {

  			stream.pipe(res);

  		})

  		//
  		//	->	If there was an error while opening a stream we stop the
  		//		request and display it.
  		//
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

var loginRoute = require(process.env.PWD + '/routes/login'),
    userRoute  = require(process.env.PWD + '/routes/user');

app.use('/', loginRoute);
app.use('/', userRoute);

app.get('*', (req, res)=>{
  res.render('404', {title: '404'});
});

http.listen(port, ()=>{
  console.log("----------------------------------------------------")
  console.log("server running on port %d".bgGreen.black, port);
});
