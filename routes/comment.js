router.post('/comment', middleware.loggedIn(), (req, res)=>{
  var now = new Date(Date.now());
  Comment.create({
    imdbID  : req.body.imdb,
    user    : req.user._id,
    comment : xss(req.body.comment)
  }, (err, comm)=>{
    if (err)
      res.send("Error");
    else{
      res.send("<li class='list-group-item'><img id='profilePic' src='"+req.user.photo+"'/>\
                <strong>"+req.user.login+"</strong>&nbsp"+xss(req.body.comment)+
                "<span class='badge'>"+ moment(now, "YYYY-MM-DDThh:mm:ss").fromNow() + "</span></li>");
    }
  });
});

router.get('/comment/:id', middleware.loggedIn(), (req, res)=>{
  var response = "";
  Comment.find({imdbID: req.params.id}).sort('-date').populate('user').exec((err, result)=>{
    if (err){}
    else {
      result.forEach((comm)=>{
        response = response + "<li class='list-group-item'><img id='profilePic' src='" + comm.user.photo + "'/>\
                  <strong>" + comm.user.login + "</strong>&nbsp" + xss(comm.comment)+
                  "<span class='badge'>"+ moment(comm.date, "YYYY-MM-DDThh:mm:ss").fromNow() + "</span></li>"
      });
      res.send(response);
    }
  });
});
module.exports = router;
