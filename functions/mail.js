var sendmail  = require('sendmail')(),
    exports   = module.exports = {};

exports.sendMail = (user, callback)=>{
    var url   = "http://localhost:3030/reset/" + user.resetToken,
        mail  = user.email,
        login = user.login;
    sendmail({
        from    : 'no-reply@hypertube.net',
        to      : mail,
        subject : 'password reset',
        html    : "Hello " + login + " follow this link to reset your password : " + url
      }, (err, reply)=>{
        if (err)
          callback("Error");
        else
          callback("Success");
    });
}
