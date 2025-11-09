const mongoose = require('mongoose');

const chargingSessionSchema = new mongoose.Schema(
  {
    booking_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Booking',
      required: true,
    },
    chargingPoint_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ChargingPoint',
      required: true,
    },
    vehicle_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Vehicle',
      required: true,
    },
    start_time: {
      type: Date,
      default: null,
    },
    end_time: {
      type: Date,
      default: null,
    },
    status: {
      type: String,
      enum: ['pending', 'in_progress', 'completed', 'cancelled'],
      default: 'pending',
    },
    
    // ============== BATTERY FIELDS (NEW) =================
    initial_battery_percentage: {
      type: Number,
      min: 0,
      max: 100,
      required: true,
    },
    current_battery_percentage: {  // ✅ THÊM FIELD NÀY
      type: Number,
      min: 0,
      max: 100,
      default: function() {
        return this.initial_battery_percentage || 0;
      }
    },
    target_battery_percentage: {  // ✅ THÊM FIELD NÀY
      type: Number,
      min: 0,
      max: 100,
      default: 100,
    },
    final_battery_percentage: {  // ✅ % pin cuối cùng
      type: Number,
      min: 0,
      max: 100,
      default: null,
    },
    battery_charged_percentage: {  // ✅ % pin đã sạc (final - initial)
      type: Number,
      min: 0,
      max: 100,
      default: 0,
    },
    target_reached: {  // ✅ Đã đạt target hay chưa
      type: Boolean,
      default: false,
    },
    
    // Energy & Time
    energy_delivered_kwh: {
      type: Number,
      default: 0,
    },
    power_capacity_kw: {  // ✅ Công suất của trạm sạc (kW)
      type: Number,
      default: null,
    },
    charging_duration_minutes: {
      type: Number,
      default: 0,
    },
    charging_duration_hours: {
      type: Number,
      default: 0,
    },
    
    // Pricing
    base_fee: {
      type: Number,
      required: true,
      default: 10000,
    },
    price_per_kwh: {
      type: Number,
      required: true,
      default: 3000,
    },
    charging_fee: {
      type: Number,
      default: 0,
    },
    total_amount: {
      type: Number,
      default: 0,
    },
    
    // QR Code
    qr_code_token: {
      type: String,
      unique: true,
      sparse: true,
    },
  },
  {
    timestamps: true,
  }
);

// ============== CALCULATE CHARGES METHOD =================
chargingSessionSchema.methods.calculateCharges = async function () {
  if (!this.end_time || !this.start_time) {
    throw new Error('Session must have both start and end time');
  }
  
  const chargingPoint = await mongoose.model('ChargingPoint').findById(this.chargingPoint_id);
  const vehicle = await mongoose.model('Vehicle').findById(this.vehicle_id);
  
  if (!chargingPoint) {
    throw new Error('Charging point not found');
  }
  
  if (!vehicle || !vehicle.batteryCapacity) {
    throw new Error('Vehicle battery capacity not configured');
  }
  
  // ============== 1. TÍNH THỜI GIAN SẠC =================
  const duration_ms = this.end_time - this.start_time;
  const charging_duration_hours = duration_ms / (1000 * 60 * 60);
  const charging_duration_minutes = Math.floor(duration_ms / (1000 * 60));
  
  // Format thời gian
  const hours = Math.floor(charging_duration_hours);
  const minutes = Math.floor((charging_duration_hours - hours) * 60);
  const charging_duration_formatted = hours > 0 
    ? `${hours} giờ ${minutes} phút`
    : `${minutes} phút`;
  
  // ============== 2. TÍNH NĂNG LƯỢNG THỰC TẾ =================
  // Lấy power_capacity từ Station qua ChargingPoint
  await chargingPoint.populate('stationId');
  const power_capacity_kw = chargingPoint.stationId.power_capacity;
  const battery_capacity_kwh = vehicle.batteryCapacity;
  const charging_efficiency = 0.90; // Hiệu suất 90%
  
  // Initial battery energy (kWh)
  const initial_energy_kwh = (this.initial_battery_percentage / 100) * battery_capacity_kwh;
  
  // Target battery energy (kWh)
  const target_battery = this.target_battery_percentage || 100;
  const target_energy_kwh = (target_battery / 100) * battery_capacity_kwh;
  
  // Năng lượng cần sạc (kWh)
  const energy_needed_kwh = target_energy_kwh - initial_energy_kwh;
  
  // ✅ CÁCH 1: Nếu có final_battery_percentage (user nhập hoặc IoT)
  let actual_energy_delivered_kwh;
  let final_battery_used = this.current_battery_percentage || this.initial_battery_percentage;
  
  if (this.current_battery_percentage && 
      this.current_battery_percentage > this.initial_battery_percentage) {
    // Tính theo % pin thực tế
    const battery_charged = this.current_battery_percentage - this.initial_battery_percentage;
    actual_energy_delivered_kwh = (battery_charged / 100) * battery_capacity_kwh;
    final_battery_used = this.current_battery_percentage;
  } else {
    // ✅ CÁCH 2: Ước tính theo công suất × thời gian (nếu không có data)
    const max_energy_by_time = power_capacity_kw * charging_duration_hours * charging_efficiency;
    
    // Lấy giá trị NHỎ HƠN giữa năng lượng cần và năng lượng theo thời gian
    actual_energy_delivered_kwh = Math.min(energy_needed_kwh, max_energy_by_time);
    
    // Ước tính % pin cuối
    const battery_gained = (actual_energy_delivered_kwh / battery_capacity_kwh) * 100;
    final_battery_used = Math.min(100, this.initial_battery_percentage + battery_gained);
  }
  
  // ============== 3. TÍNH PHÍ =================
  const charging_fee = actual_energy_delivered_kwh * this.price_per_kwh;
  const total_amount = this.base_fee + charging_fee;
  
  // ============== 4. LƯU VÀO DATABASE =================
  this.energy_delivered_kwh = actual_energy_delivered_kwh;
  this.power_capacity_kw = power_capacity_kw;
  this.charging_duration_minutes = charging_duration_minutes;
  this.charging_duration_hours = Number(charging_duration_hours.toFixed(2));
  this.charging_fee = charging_fee;
  this.total_amount = total_amount;
  
  // Lưu battery info
  const final_battery = Math.round(final_battery_used);
  const battery_charged = Math.round(final_battery - this.initial_battery_percentage);
  
  this.final_battery_percentage = final_battery;
  this.battery_charged_percentage = battery_charged;
  this.target_reached = final_battery >= (this.target_battery_percentage || 100);
  
  if (!this.current_battery_percentage) {
    this.current_battery_percentage = final_battery;
  }
  
  // ============== 5. RETURN CALCULATION =================
  return {
    // Time
    charging_duration_minutes,
    charging_duration_hours: charging_duration_hours.toFixed(2),
    charging_duration_formatted,
    
    // Energy
    power_capacity_kw,
    battery_capacity_kwh,
    charging_efficiency,
    
    // Battery
    initial_battery_percentage: this.initial_battery_percentage,
    final_battery_percentage: Math.round(final_battery_used),
    battery_charged_percentage: Math.round(final_battery_used - this.initial_battery_percentage),
    
    // Energy Calculation
    initial_energy_kwh: initial_energy_kwh.toFixed(2),
    target_energy_kwh: target_energy_kwh.toFixed(2),
    energy_needed_kwh: energy_needed_kwh.toFixed(2),
    actual_energy_delivered_kwh: actual_energy_delivered_kwh.toFixed(2),
    
    // Pricing
    base_fee: this.base_fee,
    price_per_kwh: this.price_per_kwh,
    charging_fee: Math.round(charging_fee),
    total_amount: Math.round(total_amount),
    
    // Formula explanation
    calculation_method: this.current_battery_percentage 
      ? 'Based on actual battery percentage'
      : 'Estimated by power × time',
    formula: this.current_battery_percentage
      ? `(${Math.round(final_battery_used - this.initial_battery_percentage)}% / 100) × ${battery_capacity_kwh} kWh = ${actual_energy_delivered_kwh.toFixed(2)} kWh`
      : `min(${energy_needed_kwh.toFixed(2)} kWh needed, ${power_capacity_kw} kW × ${charging_duration_hours.toFixed(2)}h × 0.9) = ${actual_energy_delivered_kwh.toFixed(2)} kWh`,
  };
};

module.exports = mongoose.model('ChargingSession', chargingSessionSchema);