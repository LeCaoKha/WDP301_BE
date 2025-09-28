const mongoose = require('mongoose');
const chargingPointSchema = new mongoose.Schema({
  stationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Station',
    required: true,
  },
  connector_type: { type: String, enum: ['AC', 'DC'], required: true },
  power_capacity: { type: Number, required: true },
  status: {
    type: String,
    enum: ['available', 'in_use', 'maintenance'],
    default: 'available',
  },
  create_at: { type: Date, default: Date.now },
});
module.exports = mongoose.model('ChargingPoint', chargingPointSchema);
