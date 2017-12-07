var express = require('express');
var router = express.Router();
const Question = require('../models/question');
const catchErrors = require('../lib/async-error');
/*
const aws = require('aws-sdk');
const S3_BUCKET=process.env.S3_BUCKET;
console.log(process.env.AWS_ACCESS_KEY_ID, process.env.AWS_SECRET_ACCESS_KEY);
router.get('/s3', function(req,res,next){
  const s3= new aws.S3({region: 'ap-northeast-2'});
  const filename=req.query.filename;
  const type=req.query.type;
  const params={
    Bucket:S3_BUCKET,
    Key:filename,
    Expires:900,
    ContentType:type,
    ACL:'public-read'
  };

  console.log(params);
  s3.getSignedUrl('putObject', params, function(err,data){
    if(err){
      console.log(err);
      return res.json({err: err});
    }
    res.json({
      signedRequest:data,
      url: 'http://${S3_BUCKET}.s3.amazonaws.com/${filename}'
    });
  });
});
*/
router.get('/', catchErrors(async (req, res, next) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;

  var query = {};
  const term = req.query.term;
  if (term) {
    query = {$or: [
      {title: {'$regex': term, '$options': 'i'}},
      {content: {'$regex': term, '$options': 'i'}}
    ]};
  }
  const questions = await Question.paginate(query, {
    sort: {createdAt: -1},
    populate: 'author',
    page: page, limit: limit
  });
  res.render('index', {questions: questions, term: term, query: req.query});
}));

/*
router.get('/', function(req, res, next) {
  res.render('index');
});
*/


module.exports = router;
