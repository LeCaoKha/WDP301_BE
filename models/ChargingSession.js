const mongoose = require('mongoose');
const chargingSessionSchema = new mongoose.Schema(
  {
    booking_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Booking',
    },
    chargingPoint_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ChargingPoint',
      required: true,
    },
    vehicle_id: {
      type: mongoose.Types.ObjectId,
      ref: 'Vehicle',
      required: true,
    },
    start_time: {
      type: Date,
    },
    status: {
      type: String,
      enum: ['pending', 'in_progress', 'completed', 'cancelled'],
      default: 'pending',
    },
    // ========= PIN Information =========
    initial_battery_percentage: {
      type: Number,
      min: 0,
      max: 100,
      required: true,
    },
    final_battery_level: {
      type: Number,
      min: 0,
      max: 100,
      default: null,
    },
    // ========= Energy calculation =========
    energy_delivered_kwh: {
      type: Number,
      default: 0,
      comment: 'Energy delivered in kWh',
    },
    // ========= Charging duration =========
    charging_duration_minutes: {
      type: Number,
      default: 0,
      comment: 'Duration of charging in minutes',
    },
    charging_duration_hours: {
      type: Number,
      default: 0,
      comment: 'Duration of charging in hours',
    },

    // Price information
    base_fee: {
      type: Number,
      default: 100000,
      comment: 'Base fee for the charging session',
    },
    price_per_kwh: {
      type: Number,
      default: 3000,
      comment: 'Price per kWh',
    },
    // ========= Result calculator =========
    charging_fee: {
      type: Number,
      default: 0,
    },
    total_amount: {
      type: Number,
      default: 0,
    },
    // QR CODE
    qr_code_token: {
      type: String,
      unique: true,
      sparse: true,
    },
  },
  {
    versionKey: false,
    timestamps: true,
  }
);
// Index for better query performance
chargingSessionSchema.index({ booking_id: 1 });
chargingSessionSchema.index({ chargingPoint_id: 1, status: 1 });
chargingSessionSchema.index({ vehicle_id: 1 });
chargingSessionSchema.index({ status: 1 });
// ========= METHOD: FORMAT TIME =========
chargingSessionSchema.methods.formatDuration = function () {
  const totalMinutes = this.charging_duration_minutes;
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  if (hours > 0) {
    return `${hours} hours ${minutes} minutes`;
  } else {
    return `${minutes} minutes`;
  }
};

// METHODS charging
chargingSessionSchema.methods.calculateCharges = async function () {
  if (!this.populated('chargingPoint_id')) {
    await this.populate('chargingPoint_id');
  }

  // Tính thời lượng an toàn: kiểm tra start_time + end_time hợp lệ
  if (this.start_time && this.end_time) {
    const startMs = new Date(this.start_time).getTime();
    const endMs = new Date(this.end_time).getTime();

    if (!isNaN(startMs) && !isNaN(endMs) && endMs > startMs) {
      const durationMs = endMs - startMs;
      this.charging_duration_minutes = Math.max(0, Math.floor(durationMs / (1000 * 60)));
      this.charging_duration_hours = Math.max(0, durationMs / (1000 * 60 * 60));
    } else {
      this.charging_duration_minutes = 0;
      this.charging_duration_hours = 0;
    }
  } else {
    // nếu chưa có start/end, đảm bảo không để NaN
    this.charging_duration_minutes = Number(this.charging_duration_minutes) || 0;
    this.charging_duration_hours = Number(this.charging_duration_hours) || 0;
  }

  // Tính năng lượng & phí, bảo vệ NaN bằng Number(...) || 0
  let powerCapacity = Number(this.chargingPoint_id?.power_capacity) || 50;
  // Nếu lưu dưới đơn vị W (>=1000), chuyển sang kW
  if (powerCapacity >= 1000) {
    powerCapacity = powerCapacity / 1000;
  }
  const hours = Number(this.charging_duration_hours) || 0;
  this.energy_delivered_kwh = powerCapacity * hours;

  this.charging_fee = (Number(this.price_per_kwh) || 0) * this.energy_delivered_kwh;
  this.total_amount = (Number(this.base_fee) || 0) + this.charging_fee;

  return {
    charging_duration_minutes: this.charging_duration_minutes,
    charging_duration_hours: this.charging_duration_hours,
    charging_duration_formatted: this.formatDuration(),
    energy_delivered_kwh: this.energy_delivered_kwh,
    base_fee: this.base_fee,
    charging_fee: this.charging_fee,
    total_amount: this.total_amount,
  };
};
module.exports = mongoose.model('ChargingSession', chargingSessionSchema);