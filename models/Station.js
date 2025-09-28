const mongoose = require('mongoose');
const stationSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  address: String,
  latitude: Number,
  longitude: Number,
  status: {
    type: String,
    enum: ['online', 'offline', 'maintenance'],
    default: 'online',
  },
  createdAt: { type: Date, default: Date.now },
});
module.exports = mongoose.model('Station', stationSchema);
