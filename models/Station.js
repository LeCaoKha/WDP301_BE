const mongoose = require('mongoose');
const stationSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  address: String,
  latitude: Number,
  longitude: Number,
  connector_type: { type: String, enum: ['AC', 'DC'], required: true },
  // Công suất của trạm (kW) - áp dụng chung cho tất cả charging points
  power_capacity: { type: Number, required: true },
  // Giá điện của trạm (VND/kWh) - mỗi trạm có thể có giá khác nhau
  price_per_kwh: { type: Number, default: 3000 },
  // Phí cơ bản (VND) - phí cố định mỗi lần sạc
  base_fee: { type: Number, default: 10000 },
  status: {
    type: String,
    enum: ['online', 'offline', 'maintenance'],
    default: 'online',
  },
  createdAt: { type: Date, default: Date.now },
});
module.exports = mongoose.model('Station', stationSchema);
