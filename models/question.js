const mongoose = require('mongoose');
const mongoosePaginate = require('mongoose-paginate');
const Schema = mongoose.Schema;

var schema = new Schema({
  author: { type: Schema.Types.ObjectId, ref: 'User' },
  title: {type: String, trim: true, required: true},
  place: {type: String, trim: true, required: true},
  stime: {type: String, trim:true, required: true},
  etime: {type: String, trim:true, required: true},
  content: {type: String, trim: true, required: true},
  exp_org:{type: String, trim: true, required: true},
  non_free:{type: String, trim: true, required: true},
  numLikes: {type: Number, default: 0},
  numAnswers: {type: Number, default: 0},
  numReads: {type: Number, default: 0},
  createdAt: {type: Date, default: Date.now}
}, {
  toJSON: { virtuals: true},
  toObject: {virtuals: true}
});
schema.plugin(mongoosePaginate);
var Question = mongoose.model('Question', schema);

module.exports = Question;
