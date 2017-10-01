var mailer  = require('../functions/mail.js');

// =====================================
// LOCAL ROUTES ========================
// =====================================

router.get('/login', (req, res)=>{
  res.render('login/index', {title: "login", message: req.flash('loginMessage'), success: req.flash('success')});
});

router.get('/signin', (req, res)=>{
  res.render('signin/index', {title: "sign in", message: req.flash('signinMessage')});
});

app.post('/signin', passport.authenticate('local-signin', {
        successRedirect : '/', // redirect to the secure profile section
        failureRedirect : '/signin', // redirect back to the signup page if there is an error
        failureFlash : true // allow flash messages
}));

app.post('/login', passport.authenticate('local-login', {
        successRedirect : '/', // redirect to the secure profile section
        failureRedirect : '/login', // redirect back to the signup page if there is an error
        failureFlash : true // allow flash messages
}));

// =====================================
// FACEBOOK ROUTES =====================
// =====================================

app.get('/auth/facebook', passport.authenticate('facebook', {scope: ['email']}));

// handle the callback after facebook has authenticated the user
app.get('/auth/facebook/callback',
    passport.authenticate('facebook', {
        successRedirect : '/',
        failureRedirect : '/'
    }
));

// =====================================
// INTRA 42 ROUTES =====================
// =====================================

app.get('/auth/intra42', passport.authenticate('42'));

app.get('/auth/intra/callback',
    passport.authenticate('42', {
      successRedirect : '/',
      failureRedirect : '/'
    }
));

///////////////////////GITHUB CONNEXION ROUTES////////////
app.get('/auth/github',
  passport.authenticate('github'));

app.get('/auth/github/callback', 
  passport.authenticate('github', { failureRedirect: '/login' }),
  function(req, res) {
    // Successful authentication, redirect home.
    res.redirect('/');
  });



// =====================================
// RESET PASSWORD ======================
// =====================================

app.get('/lost', (req, res)=>{
  res.render('login/lost', {title: "Lost Password", error: req.flash('lostErrorMessage'), success: req.flash('lostSuccessMessage')})
});

app.post('/lost', (req, res)=>{
  var resetUser = {login: req.body.login, email: req.body.email},
      newToken  = {
                  resetToken: encodeURI(Math.trunc(Math.random() * 100000000000000)),
                  tokenDate: new Date()
      };
  User.findOneAndUpdate(resetUser, newToken, {new: true}, (err, result)=>{
    if (result === null){
      req.flash('lostErrorMessage', "No users where found");
      return res.redirect('/lost');
    }
    mailer.sendMail(result, (cb)=>{
      if (cb === "Success")
        req.flash('lostSuccessMessage', "An email was sent to you");
      else
        req.flash('lostErrorMessage', "Something went wrong");
      res.redirect('/lost');
    });
  });
});

app.get('/reset/:token', (req, res)=>{
  var token = req.params.token;
  User.findOne({resetToken: token}, (err, user)=>{
    if (user === null){
      req.flash('lostErrorMessage', "Your token is invalid");
      return res.redirect('/lost');
    }
    if (new Date().getTime() - new Date(user.tokenDate).getTime() > 86400000) {
      req.flash('lostErrorMessage', "Your token is expired");
      return res.redirect('/lost');
    }
    res.render('login/reset', {title: "Reset password", token: token});
  });
});

app.post('/reset/:token', (req, res)=>{
  var token = req.params.token;
  var password  = req.body.password;
  User.findOne({resetToken: token}, (err, user)=>{
    if (user === null){
      req.flash('lostErrorMessage', "Your token is invalid");
      return res.redirect('/lost');
    }
    if (new Date().getTime() - new Date(user.tokenDate).getTime() > 86400000) {
      req.flash('lostErrorMessage', "Your token is expired");
      return res.redirect('/lost');
    }
    user.password   = user.generateHash(password);
    user.resetToken = undefined;
    user.tokenDate  = undefined;
    user.save(()=>{
      req.flash('success', "Your password has been updated");
      res.redirect('/');
    });
  });
});

// =====================================
// logout ==============================
// =====================================

app.get('/logout', (req, res)=>{
  req.logout();
  res.redirect('/');
});

module.exports = router;
