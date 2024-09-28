var express = require('express');
var router = express.Router();

const PostSchema = require('../models/postSchema');
const UserSchema = require('../models/userSchema');

const { isLoggedIn } = require('../utils/auth.middile');

/* GET home page. */
router.get('/', function (req, res, next) {
  res.render('index', { title: 'Express', user: req.user });
});
router.get('/createpost/:id', isLoggedIn, function (req, res, next) {
  res.render('createpost', {
    title: 'Create Post',
    user: req.user,
    id: req.params.id,
  });
});

router.post('/createpost', isLoggedIn, async function (req, res, next) {
  try {
    const newPost = new PostSchema(req.body);
    newPost.user = req.user._id;
    await newPost.save();

    req.user.posts.push(newPost._id);
    await req.user.save();

    res.redirect('/posts/show');
  } catch (error) {
    next(error);
  }
});
router.get('/show', isLoggedIn, async function (req, res, next) {
  // const users = await Post.find();
  res.render('show', {
    title: 'show Post',
    user: await req.user.populate('posts'),
  });
});
router.get('/details', isLoggedIn, async function (req, res, next) {
  res.render('details', {
    title: 'show Post',
    user: await req.user.populate('posts'),
  });
});

router.get('/update/:id', isLoggedIn, async function (req, res, next) {
  const post = await PostSchema.findById(req.params.id);
  res.render('update', {
    title: 'show Post',
    user: req.user,
    post,
  });
});

router.post('/update/:id', isLoggedIn, async function (req, res, next) {
  try {
    await PostSchema.findByIdAndUpdate(req.params.id, req.body);
    res.redirect('/posts/show');
  } catch (error) {
    next(error);
  }
});

router.get('/delete/:id', isLoggedIn, async function (req, res, next) {
  try {
    const post = await PostSchema.findByIdAndDelete(req.params.id);

    await req.user.posts.pull(post._id);
    await req.user.save();
    res.redirect('/posts/details');
  } catch (error) {
    next(error);
  }
});

module.exports = router;
