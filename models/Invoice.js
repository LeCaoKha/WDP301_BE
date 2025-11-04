const mongoose = require('mongoose');

const invoiceSchema = new mongoose.Schema(
  {
    // ============== REFERENCES ==============
    session_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ChargingSession',
      required: true,
      unique: true, // ✅ MỖI SESSION CHỈ CÓ 1 INVOICE
    },
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true, // ✅ TÌM INVOICE THEO USER NHANH HƠN
    },
    booking_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Booking',
      required: true,
    },
    vehicle_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Vehicle',
      required: true,
    },
    station_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Station',
      required: true,
      index: true, // ✅ THỐNG KÊ DOANH THU THEO TRẠM
    },
    chargingPoint_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ChargingPoint',
      required: true,
    },

    // ============== THỜI GIAN SẠC ==============
    start_time: {
      type: Date,
      required: true,
    },
    end_time: {
      type: Date,
      required: true,
    },
    charging_duration_minutes: {
      type: Number,
      required: true,
    },
    charging_duration_hours: {
      type: Number,
      required: true,
    },
    charging_duration_formatted: {
      type: String, // "1 giờ 30 phút"
      required: true,
    },

    // ============== BATTERY INFO ==============
    initial_battery_percentage: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
    },
    final_battery_percentage: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
    },
    target_battery_percentage: {
      type: Number,
      default: 100,
      min: 0,
      max: 100,
    },
    battery_charged_percentage: {
      type: Number,
      required: true,
    },
    target_reached: {
      type: Boolean,
      default: false,
      // ✅ BIẾT NGAY ĐÃ ĐẠT TARGET CHƯA, KHÔNG CẦN TÍNH LẠI
    },

    // ============== NĂNG LƯỢNG ĐÃ SẠC ==============
    battery_capacity_kwh: {
      type: Number,
      required: true,
      // ✅ LƯU LẠI DUNG LƯỢNG PIN XE LÚC SẠC (PHÒNG USER ĐỔI XE)
    },
    power_capacity_kw: {
      type: Number,
      required: true,
      // ✅ LƯU LẠI CÔNG SUẤT TRẠM LÚC SẠC (PHÒNG TRẠM NÂNG CẤP)
    },
    energy_delivered_kwh: {
      type: Number, // ⚡ NĂNG LƯỢNG THỰC TẾ ĐÃ SẠC
      required: true,
    },
    charging_efficiency: {
      type: Number,
      default: 0.9,
      // ✅ LƯU LẠI HIỆU SUẤT (PHÒNG THAY ĐỔI SAU)
    },
    calculation_method: {
      type: String,
      enum: ['battery_based', 'time_based'],
      // ✅ BIẾT CÁCH TÍNH ĐỂ XỬ LÝ TRANH CHẤP
    },

    // ============== GIÁ TIỀN ==============
    base_fee: {
      type: Number,
      required: true,
      // ✅ LƯU LẠI PHÍ CƠ BẢN LÚC SẠC (PHÒNG TRẠM TĂNG GIÁ)
    },
    price_per_kwh: {
      type: Number,
      required: true,
      // ✅ LƯU LẠI GIÁ ĐIỆN LÚC SẠC (PHÒNG TRẠM TĂNG GIÁ)
    },
    charging_fee: {
      type: Number,
      required: true,
      // = energy_delivered_kwh × price_per_kwh
    },
    total_amount: {
      type: Number, // 💰 TỔNG TIỀN
      required: true,
      index: true, // ✅ THỐNG KÊ DOANH THU NHANH
      // = base_fee + charging_fee
    },

    // ============== PAYMENT ==============
    payment_status: {
      type: String,
      enum: ['unpaid', 'paid', 'refunded', 'cancelled'],
      default: 'unpaid',
      index: true, // ✅ TÌM CÁC INVOICE CHƯA THANH TOÁN
    },
    payment_method: {
      type: String,
      enum: ['vnpay', null],
      default: 'vnpay',
      // ✅ CHỈ HỖ TRỢ VNPAY
    },
    payment_date: {
      type: Date,
      // ✅ BIẾT KHI NÀO USER THANH TOÁN
    },
    transaction_id: {
      type: String,
      // ✅ LƯU MÃ GIAO DỊCH TỪ CỔNG THANH TOÁN (MOMO, VNPAY...)
    },

    // ============== ADDITIONAL INFO ==============
    station_name: {
      type: String,
      // ✅ LƯU TÊN TRẠM (PHÒNG TRẠM ĐỔI TÊN HOẶC BỊ XÓA)
    },
    station_address: {
      type: String,
      // ✅ LƯU ĐỊA CHỈ TRẠM
    },
    vehicle_plate_number: {
      type: String,
      // ✅ LƯU BIỂN SỐ XE
    },
    vehicle_model: {
      type: String,
      // ✅ LƯU MODEL XE
    },
    
    notes: {
      type: String,
      // ✅ GHI CHÚ (VD: "Dừng sớm do khách yêu cầu")
    },
  },
  {
    timestamps: true, // createdAt, updatedAt
  }
);

// ============== INDEXES ==============
invoiceSchema.index({ user_id: 1, createdAt: -1 }); // Lấy invoice của user theo thời gian
invoiceSchema.index({ station_id: 1, createdAt: -1 }); // Thống kê doanh thu theo trạm
invoiceSchema.index({ payment_status: 1, createdAt: -1 }); // Tìm invoice chưa thanh toán

// ============== VIRTUALS ==============
invoiceSchema.virtual('formatted').get(function () {
  return {
    total_amount: this.total_amount.toLocaleString('vi-VN') + ' VND',
    charging_fee: this.charging_fee.toLocaleString('vi-VN') + ' VND',
    base_fee: this.base_fee.toLocaleString('vi-VN') + ' VND',
    price_per_kwh: this.price_per_kwh.toLocaleString('vi-VN') + ' VND/kWh',
    energy_delivered: this.energy_delivered_kwh.toFixed(2) + ' kWh',
    battery_charged: this.battery_charged_percentage.toFixed(1) + '%',
    duration: this.charging_duration_formatted,
    breakdown: `${this.base_fee.toLocaleString(
      'vi-VN'
    )} VND (phí cơ bản) + ${this.energy_delivered_kwh.toFixed(
      2
    )} kWh × ${this.price_per_kwh.toLocaleString(
      'vi-VN'
    )} VND/kWh = ${this.total_amount.toLocaleString('vi-VN')} VND`,
  };
});

invoiceSchema.set('toJSON', { virtuals: true });
invoiceSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Invoice', invoiceSchema);
