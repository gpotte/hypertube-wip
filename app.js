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

app.get('/movie/:title/:hash', (req, res)=>{
  var room = req.params.title + encodeURI(Math.trunc(Math.random() * 10000000)),
  magnet = 'magnet:?xt=urn:btih:'+req.params.hash+'&dn='+ encodeURI(req.params.title)+'&tr=udp://glotorrents.pw:6969/announce&tr=udp://tracker.opentrackr.org:1337/announce&tr=udp://torrent.gresille.org:80/announce&tr=udp://tracker.openbittorrent.com:80&tr=udp://tracker.coppersurfer.tk:6969&tr=udp://tracker.leechers-paradise.org:6969&tr=udp://p4p.arenabg.ch:1337&tr=udp://tracker.internetwarriors.net:1337';
  res.render('movie/download', {title: req.params.title, room: room, user: req.user});
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
        setTimeout(function(){percent(engine, file, res, room)}, 2000);
      }
    });
  });
});

function percent(engine, file, res, room){
  io.sockets.in(room).emit('progress', {value: Math.round((engine.swarm.downloaded / file.length) * 100)});
  setTimeout(function(){percent(engine, file, res, room)}, 5000);
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
