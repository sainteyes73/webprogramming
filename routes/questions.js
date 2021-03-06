const express = require('express');
const Question = require('../models/question');
const Answer = require('../models/answer');
const catchErrors = require('../lib/async-error');


module.exports = io => {
  const router = express.Router();

  // 동일한 코드가 users.js에도 있습니다. 이것은 나중에 수정합시다.
  function needAuth(req, res, next) {
    if (req.isAuthenticated()) {
      next();
    } else {
      req.flash('danger', 'Please signin first.');
      res.redirect('/signin');
    }
  }
  function validateForm(form, options) {
    var title = form.title || "";
    var place = form.place || "";
    var stime = form.stime || "";
    var etime = form.etime || "";
    var content= form.content || "";
    var exp_org= form.exp_org || "";
    var organization=form.organization || "";
    if (!title) {
      return 'Title is required.';
    }

    if (!place) {
      return 'Place is required.';
    }

    if (!stime) {
      return 'start time is required.';
    }

    if (!etime) {
      return 'end time is required';
    }

    if (!content) {
      return 'content is required';
    }

    if(!exp_org){
      return 'write down organization explain'
    }

    if(!organization){
      return 'write down organization'
    }


    return null;
  }
  /* GET questions listing. */
  router.get('/', catchErrors(async (req, res, next) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;

    var query = {};
    const term = req.query.term;
    if (term) {
      query = {$or: [
        {title: {'$regex': term, '$options': 'i'}},
        {content: {'$regex': term, '$options': 'i'}},
        {eventtopic: {'$regex': term, '$options': 'i'}}
      ]};
    }
    const questions = await Question.paginate(query, {
      sort: {createdAt: -1},
      populate: 'author',
      page: page, limit: limit
    });
    res.render('questions/index', {questions: questions, term: term, query: req.query});
  }));

  router.get('/new', needAuth, (req, res, next) => {
    res.render('questions/new', {question: {}});
  });

  router.get('/:id/edit', needAuth, catchErrors(async (req, res, next) => {
    const question = await Question.findById(req.params.id);
    res.render('questions/edit', {question: question});

  }));

  router.get('/:id', catchErrors(async (req, res, next) => {
    const question = await Question.findById(req.params.id).populate('author');
    const answers = await Answer.find({question: question.id}).populate('author');
    question.numReads++;    // TODO: 동일한 사람이 본 경우에 Read가 증가하지 않도록???

    await question.save();
    res.render('questions/show', {question: question, answers: answers});
  }));

  router.put('/:id', catchErrors(async (req, res, next) => {
    const question = await Question.findById(req.params.id);

    if (!question) {
      req.flash('danger', 'Not exist question');
      return res.redirect('back');
    }
    const err = validateForm(req.body);
    if (err) {
      req.flash('danger', err);
      return res.redirect('back');
    }
    question.title= req.body.title;
    question.place= req.body.place;
    question.content= req.body.content;
    question.eventtopic= req.body.eventtopic;
    question.stime= req.body.stime;
    question.etime= req.body.etime;
    question.organization= req.body.organization;
    question.exp_org=req.body.exp_org;
    question.non_free= req.body.non_free;
    question.check= req.body.check;
  //  question.tags = req.body.tags.split(" ").map(e => e.trim());

    await question.save();
    req.flash('success', 'Successfully updated');
    res.redirect('/questions');
  }));

  router.delete('/:id', needAuth, catchErrors(async (req, res, next) => {
    await Question.findOneAndRemove({_id: req.params.id});
    req.flash('success', 'Successfully deleted');
    res.redirect('/questions');
  }));

  router.post('/', needAuth, catchErrors(async (req, res, next) => {
    const err = validateForm(req.body);
    if (err) {
      req.flash('danger', err);
      return res.redirect('back');
    }
    const user = req.user;
    var question = new Question({
      author: user._id,
      title: req.body.title,
      place: req.body.place,
      content: req.body.content,
      eventtopic: req.body.eventtopic,
      img: req.body.img,
      stime: req.body.stime,
      etime: req.body.etime,
      organization: req.body.organization,
      exp_org:req.body.exp_org,
      non_free: req.body.non_free,
      check: req.body.check
    });
    await question.save();//mongodb에 저장하는동안 대기
    req.flash('success', 'Successfully posted');
    res.redirect('/questions');
  }));

  router.post('/:id/answers', needAuth, catchErrors(async (req, res, next) => {
    const user = req.user;
    const question = await Question.findById(req.params.id);

    if (!question) {
      req.flash('danger', 'Not exist question');
      return res.redirect('back');
    }

    var answer = new Answer({
      author: user._id,
      question: question._id,
      content: req.body.content
    });
    await answer.save();
    question.numAnswers++;
    await question.save();

    const url = `/questions/${question._id}#${answer._id}`;
    io.to(question.author.toString())
      .emit('answered', {url: url, question: question});
    console.log('SOCKET EMIT', question.author.toString(), 'answered', {url: url, question: question})
    req.flash('success', 'Successfully answered');
    res.redirect(`/questions/${req.params.id}`);
  }));

  return router;
}
