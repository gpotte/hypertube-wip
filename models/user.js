var userSchema = mongoose.Schema({
  login       : String,
  email       : String,
  password    : String,
  name        : String,
  firstName   : String,
  language    : {"type": String, "default": "english"},
  facebookID  : String,
  intraID     : String,
  token       : String,
  photo       : {"type": String, "default": "https://www.wallstreetotc.com/wp-content/uploads/2014/10/facebook-anonymous-app.jpg"},
  resetToken  : String,
  tokenDate   : Date
});

// methods ======================
// generating a hash
userSchema.methods.generateHash = function(password) {
    return bcrypt.hashSync(password, bcrypt.genSaltSync(8), null);
};

// checking if password is valid
userSchema.methods.validPassword = function(password) {
    return bcrypt.compareSync(password, this.password);
};

module.exports = mongoose.model('User', userSchema);
