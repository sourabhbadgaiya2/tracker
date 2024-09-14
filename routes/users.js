var express = require('express');
const userSchema = require('../models/userSchema');
var router = express.Router();
const passport = require('passport');
const LocalStrategy = require('passport-local');
const { isLoggedIn } = require('../utils/auth.middile');
const upload = require('../utils/multer.middile');
const fs = require('fs');
const sendEmail = require('../config/email');

const GoogleStrategy = require('passport-google-oauth20').Strategy;
passport.use(new LocalStrategy(userSchema.authenticate()));

// Google Authentication
passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: '/users/auth/google/callback',
    },
    function (accessToken, refreshToken, profile, done) {
      // Here you can save the user profile to your database
      console.log(profile);
      return done(null, profile);
    }
  )
);

router.get(
  '/auth/google',
  passport.authenticate('google', { scope: ['profile', 'email'] })
);

router.get(
  '/auth/google/callback',
  passport.authenticate('google', { failureRedirect: '/' }),
  async (req, res) => {
    const userExist = await userSchema.findOne({
      email: req.user.emails[0].value,
    });

    if (userExist) {
      req.login(userExist, (err) => {
        if (err) {
          return next(err);
        }
      });
      res.redirect('/users/profile');
    }

    const newuser = await userSchema.create({
      username: req.user.name.givenName,
      name: req.user.displayName,
      email: req.user.emails[0].value,
      image: req.user.photos[0].value,
    });

    req.login(newuser, (err) => {
      if (err) {
        return next(err);
      }
    });
    res.redirect('/users/profile');
  }
);

router.get('/profile', isLoggedIn, (req, res) => {
  // res.send(`<h1>Profile</h1><pre>${JSON.stringify(req.user, null, 2)}</pre>`);

  // sendEmail(
  //   'sourabhbadgaiya273@gmail.com',
  //   'test',
  //   'This is a test email sent with Nodemailer using OAuth2.'
  //   // '<p>This is a test email sent with <b>Nodemailer</b> using OAuth2.</p>'
  // );
  console.log(req.flash('info'));
  res.render('profile', {
    title: 'Profile',
    user: req.user,
  });
});

// ------------------------------------------------------

/* GET users listing. */
router.get('/', function (req, res, next) {
  res.send('respond with a resource');
});

//  user create
router.get('/create-account', (req, res) => {
  res.render('create-account', { title: 'Create Account', user: req.user });
});
router.post('/create-account', async (req, res, next) => {
  try {
    const { username, name, email, password } = req.body;
    await userSchema.register({ name, username, email }, password);
    req.flash('info', 'succesfully created');
    res.redirect('/');
  } catch (error) {
    next(error);
  }
});

// Login routes
router.post(
  '/login',
  passport.authenticate('local', {
    successRedirect: '/users/profile',
    failureRedirect: '/',
  }),
  async (req, res, next) => {
    try {
    } catch (error) {
      next(error);
    }
  }
);

// logout
router.get('/logout', (req, res) => {
  req.logout(() => {
    res.redirect('/');
  });
});

// Forget Password

router.get('/forget-password', (req, res) => {
  res.render('forgetpassword_email', { title: 'email Verify', user: req.user });
});

router.post('/forget-password', async (req, res, next) => {
  try {
    const user = await userSchema.findOne({ email: req.body.email });
    if (!user) return next(new Error('User Not found'));

    res.redirect(`/users/forget-password/${user._id}`);
  } catch (error) {
    next(error);
  }
});
router.get('/forget-password/:id', async (req, res) => {
  try {
    const user = await userSchema.findById(req.params.id);

    // Generate a random 4-digit OTP
    const randomNumber = Math.floor(Math.random() * 9000) + 1000;

    // Set OTP and expiration time (optional, e.g., 10 minutes from now)
    user.otp = randomNumber;
    user.otpExpires = Date.now() + 10 * 60 * 1000; // Expires in 10 minutes

    // Save the user with the new OTP
    await user.save();

    // Send OTP via email
    await sendEmail(
      'sourabhbadgaiya273@gmail.com', // Assuming the email is stored in the user schema
      'Password Reset OTP',
      `Your OTP is: ${randomNumber}`
    );
    res.render('forgetpassword_OTP', {
      title: 'email Verify',
      user: req.user,
      id: req.params.id,
    });
  } catch (error) {
    next(error);
  }
});

router.post('/forget-password/:id', async (req, res, next) => {
  try {
    const user = await userSchema.findById(req.params.id);
    //
    if (user.otpExpires && user.otpExpires < Date.now()) {
      return res.status(400).send('OTP has expired');
    }

    // Compare the user input with the OTP stored in the database
    if (user.otp === parseInt(req.body.otp)) {
      // OTP matches, so reset the password or take other actions
      user.otp = null; // Clear the OTP after successful verification
      user.otpExpires = null; // Clear expiration time as well (optional)

      await user.save();
    } else {
      res.status(400).send('Invalid OTP');
    }
    //
    res.redirect(`/users/set-password/${user._id}`);
  } catch (error) {
    next(error);
  }
});
router.get('/set-password/:id', (req, res) => {
  res.render('forgetpassword_Password', {
    title: 'email Verify',
    user: req.user,
    id: req.params.id,
  });
});
router.post('/set-password/:id', async (req, res, next) => {
  try {
    const user = await userSchema.findById(req.params.id);
    await user.setPassword(req.body.password);
    await user.save();
    res.redirect(`/`);
  } catch (error) {
    next(error);
  }
});

// upload
router.post(
  '/upload',
  isLoggedIn,
  upload.single('image'),
  async (req, res, next) => {
    try {
      if (req.user.image != 'default.jpeg') {
        fs.unlinkSync(`public/images/${req.user.image}`);
      }
      req.user.image = req.file.filename;
      await req.user.save();
      res.redirect('/users/updateuser');
    } catch (error) {
      next(error);
    }
  }
);

//  user delete
router.get('/userdelete', isLoggedIn, async (req, res) => {
  try {
    const user = await userSchema.findByIdAndDelete(req.user._id);
    if (user.image != 'default.jpeg') {
      fs.unlinkSync(`public/images/${user.image}`);
    }
    res.redirect('/');
  } catch (error) {
    next(error);
  }
});

// update user
router.get('/updateuser', isLoggedIn, (req, res) => {
  res.render('updateuser', { title: 'Create Account', user: req.user });
});

router.post('/updateuser', isLoggedIn, async (req, res) => {
  try {
    await userSchema.findByIdAndUpdate(req.user._id, req.body);

    res.redirect('/users/profile');
  } catch (error) {
    next(error);
  }
});

// change password
router.get('/changepassword', isLoggedIn, (req, res) => {
  res.render('changepassword', { title: 'Create Account', user: req.user });
});
router.post('/changepassword', isLoggedIn, async (req, res, next) => {
  try {
    await req.user.changePassword(req.body.oldpassword, req.body.newpassword);
    await req.user.save();
    res.redirect(`/users/profile`);
  } catch (error) {
    next(error);
  }
});
module.exports = router;
