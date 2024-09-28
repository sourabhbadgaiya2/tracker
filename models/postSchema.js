const mongoose = require('mongoose');

const postSchema = mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'title is required'],
      trim: true,
    },
    amount: {
      type: Number,
      required: [true, 'amount is required'],
      trim: true,
    },
    remark: {
      type: String,
      required: [true, 'remark is required'],
      trim: true,
    },
    paymentmode: {
      type: String,
      required: [true, 'Payment Mode is Required'],
      enum: ['Cash', 'UPI', 'Cheque', 'Card'],
    },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'user' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('post', postSchema);
