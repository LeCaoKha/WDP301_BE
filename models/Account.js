const mongoose = require('mongoose');
const accountSchema = new mongoose.Schema(
  {
    username: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: {
      type: String,
      enum: ['driver', 'admin', 'staff'],
      default: 'driver',
    },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);
module.exports = mongoose.model('Account', accountSchema);
