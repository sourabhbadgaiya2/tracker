var express = require('express');
var router = express.Router();

const Post = require('../models/postSchema');
const User = require('../models/userSchema');

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

router.post('/createpost/:id', isLoggedIn, async function (req, res, next) {
  try {
    const newPost = new Post(req.body);
    newPost.user = req.params.id;
    const post = await newPost.save();

    const user = await User.findById(req.params.id);
    user.posts.push(post._id);
    await user.save();
    res.redirect('/users/profile');
  } catch (error) {
    next(error);
  }
});
router.get('/show', isLoggedIn, async function (req, res, next) {
  const users = await Post.find();
  res.render('show', {
    title: 'show Post',
    user: req.user,
    users,
  });
});
module.exports = router;
