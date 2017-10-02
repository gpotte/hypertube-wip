var commentSchema = mongoose.Schema({
  imdbID  : String,
  user    : {type: mongoose.Schema.Types.ObjectId, ref: "User"},
  comment : String,
  date    : {type: Date, default: Date.now}
});

module.exports = mongoose.model("Comment", commentSchema);
