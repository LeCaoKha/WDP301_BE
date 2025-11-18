const mongoose = require("mongoose");

const invoiceSchema = new mongoose.Schema(
  {
    // ============== REFERENCES ==============
    session_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ChargingSession",
      required: true,
      unique: true, // ✅ MỖI SESSION CHỈ CÓ 1 INVOICE
    },
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Account",
      required: true,
      index: true, // ✅ TÌM INVOICE THEO USER NHANH HƠN
    },
    booking_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Booking",
      required: true,
    },
    vehicle_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Vehicle",
      required: true,
    },
    station_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Station",
      required: true,
      index: true, // ✅ THỐNG KÊ DOANH THU THEO TRẠM
    },
    chargingPoint_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ChargingPoint",
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
    charging_duration_seconds: {
      type: Number,
      required: true,
      // ✅ TỔNG GIÂY - CHÍNH XÁC NHẤT
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
      type: String, // "1 giờ 30 phút 45 giây"
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
      enum: ["battery_based", "time_based"],
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
      // = energy_delivered_kwh × price_per_kwh - discount_amount (nếu có subscription)
      // ✅ CHARGING FEE SAU KHI ÁP DỤNG DISCOUNT
    },
    original_charging_fee: {
      type: Number,
      // ✅ CHARGING FEE TRƯỚC KHI ÁP DỤNG DISCOUNT
      // = energy_delivered_kwh × price_per_kwh
    },
    total_amount: {
      type: Number, // 💰 TỔNG TIỀN (SAU KHI ÁP DỤNG DISCOUNT)
      required: true,
      index: true, // ✅ THỐNG KÊ DOANH THU NHANH
      // = base_fee + charging_fee (charging_fee đã được discount)
      // ✅ LƯU Ý: Base fee KHÔNG bị discount, chỉ charging fee bị discount
    },
    final_amount: {
      type: Number, // 💰 SỐ TIỀN CẦN THANH TOÁN
      required: true,
      default: 0,
      // = charging_fee + overtime_fee (base_fee đã thanh toán khi confirm booking)
      // ✅ Nếu unpaid: final_amount = charging_fee + overtime_fee
      // ✅ Nếu paid: final_amount = 0
    },

    // ============== SUBSCRIPTION DISCOUNT ==============
    subscription_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "VehicleSubscription",
      // ✅ ID của subscription được áp dụng (nếu có)
    },
    discount_percentage: {
      type: Number,
      min: 0,
      max: 100,
      // ✅ % GIẢM GIÁ TỪ SUBSCRIPTION (ví dụ: 15, 30)
      // ✅ CHỈ ÁP DỤNG CHO CHARGING_FEE, KHÔNG ÁP DỤNG CHO BASE_FEE
    },
    discount_amount: {
      type: Number,
      min: 0,
      // ✅ SỐ TIỀN ĐƯỢC GIẢM (VND)
      // = original_charging_fee × discount_percentage / 100
      // ✅ CHỈ GIẢM CHARGING_FEE, KHÔNG GIẢM BASE_FEE
    },

    // ============== PAYMENT ==============
    payment_status: {
      type: String,
      enum: ["unpaid", "paid", "refunded", "cancelled"],
      default: "unpaid",
      index: true, // ✅ TÌM CÁC INVOICE CHƯA THANH TOÁN
    },
    payment_method: {
      type: String,
      enum: ["vnpay", null],
      default: "vnpay",
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

    // ============== OVERTIME PENALTY ==============
    booking_end_time: {
      type: Date,
      // ✅ Thời gian kết thúc booking (để tính phạt)
      // ✅ Áp dụng cho cả booking và direct charging
    },
    overtime_minutes: {
      type: Number,
      default: 0,
      min: 0,
      // ✅ Số phút vượt quá thời gian booking
    },
    overtime_fee: {
      type: Number,
      default: 0,
      min: 0,
      // ✅ Phí phạt quá giờ (overtime_minutes × 500 đ/phút)
    },
    overtime_fee_rate: {
      type: Number,
      default: 500,
      // ✅ Mức phạt mỗi phút (có thể config sau)
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
    vehicle_is_active: {
      type: Boolean,
      // ✅ LƯU TRẠNG THÁI XE LÚC SẠC (PHÒNG XE BỊ XÓA SAU)
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
invoiceSchema.virtual("formatted").get(function () {
  return {
    total_amount: this.total_amount.toLocaleString("vi-VN") + " đ",
    charging_fee: this.charging_fee.toLocaleString("vi-VN") + " đ",
    base_fee: this.base_fee.toLocaleString("vi-VN") + " đ",
    overtime_fee: this.overtime_fee > 0 
      ? this.overtime_fee.toLocaleString("vi-VN") + " đ" 
      : "0 đ",
    price_per_kwh: this.price_per_kwh.toLocaleString("vi-VN") + " đ/kWh",
    energy_delivered: this.energy_delivered_kwh.toFixed(2) + " kWh",
    battery_charged: this.battery_charged_percentage.toFixed(1) + "%",
    duration: this.charging_duration_formatted,
    breakdown: this.getBreakdownString(),
  };
});

// Method để format breakdown với overtime
invoiceSchema.methods.getBreakdownString = function() {
  let breakdown = '';
  
  // Base fee (nếu có)
  if (this.base_fee > 0) {
    breakdown = `${this.base_fee.toLocaleString("vi-VN")} đ (phí cơ bản - đã thanh toán) + `;
  }
  
  // Charging fee
  breakdown += `${this.energy_delivered_kwh.toFixed(2)} kWh × ${this.price_per_kwh.toLocaleString("vi-VN")} đ/kWh = ${(this.base_fee + this.charging_fee).toLocaleString("vi-VN")} đ`;
  
  // Overtime fee (nếu có)
  if (this.overtime_fee > 0) {
    breakdown += ` + ${this.overtime_minutes} phút × ${this.overtime_fee_rate.toLocaleString("vi-VN")} đ/phút (phạt quá giờ) = ${this.overtime_fee.toLocaleString("vi-VN")} đ`;
  }
  
  breakdown += ` → Tổng: ${this.total_amount.toLocaleString("vi-VN")} đ`;
  
  return breakdown;
};

invoiceSchema.set("toJSON", { virtuals: true });
invoiceSchema.set("toObject", { virtuals: true });

module.exports = mongoose.model("Invoice", invoiceSchema);
