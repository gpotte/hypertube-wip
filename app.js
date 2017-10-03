torrentStream   = require('hypertorrent-stream'),
moment          = require('moment'),
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
Comment         = require(process.env.PWD + '/models/comments'),
middleware      = require(process.env.PWD + "/functions/middleware.js");
OS              = require('opensubtitles-api'),
OpenSubtitles   = new OS({
    useragent:'OSTestUserAgentTemp',
    username: 'scredi',
    password: 'chatel86',
    ssl: false
}),
download        = require('download'),
srt2vtt         = require('srt-to-vtt');

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
app.get('/series', middleware.loggedIn(), (req, res)=>{
  res.render('series', {title: 'home', user: req.user});
});

var loginRoute    = require(process.env.PWD + '/routes/login'),
    userRoute     = require(process.env.PWD + '/routes/user'),
    commentRoute  = require(process.env.PWD + '/routes/comment'),
    playerRoute   = require(process.env.PWD + '/routes/video');

app.use('/', loginRoute);
app.use('/', userRoute);
app.use('/', playerRoute);
app.use('/', commentRoute);

app.get('*', (req, res)=>{
  res.render('404', {title: '404'});
});

http.listen(port, ()=>{
  console.log("----------------------------------------------------")
  console.log("Welcome to Hypertube ! Server running on port %d".bgGreen.black, port);
});
