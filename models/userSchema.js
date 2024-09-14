const mongoose = require('mongoose');
const plm = require('passport-local-mongoose');

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'name is required'],
      trim: true,
    },
    username: {
      type: String,
      required: [true, 'Username is required'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'email is required'],
      trim: true,
    },
    password: {
      type: String,
    },
    image: {
      type: String,
      default: 'default.jpeg',
    },
    otp: Number,
    otpExpires: Date,
    posts: [{ type: mongoose.Schema.Types.ObjectId, ref: 'post' }],
  },
  { timestamps: true }
);

userSchema.plugin(plm);

module.exports = mongoose.model('user', userSchema);
