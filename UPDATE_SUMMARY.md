# ✅ UPDATE HOÀN TẤT - Công Thức Tính Tiền Mới

## 📝 Tóm Tắt Thay Đổi

### **1. Model: ChargingSession.js**
✅ Cập nhật method `calculateCharges()` với công thức mới:
- Tính năng lượng dựa trên % pin thực tế
- Fallback: Ước tính theo công suất × thời gian
- Không bao giờ tính quá năng lượng cần thiết
- Trả về công thức chi tiết và method sử dụng

### **2. Controller: chargingSessionController.js**

#### **endSession:**
✅ Response bổ sung:
- `battery_capacity`: Dung lượng pin xe
- `charging_efficiency`: Hiệu suất sạc
- `energy_needed`: Năng lượng cần sạc
- `calculation_method`: Method tính toán (actual/estimated)
- `formula`: Công thức chi tiết

#### **startSessionByQr:**
✅ Thêm tính toán ước tính:
- `estimated_time`: Thời gian ước tính sạc
- `energy_needed`: Năng lượng cần sạc
- `estimated_completion`: Thời gian hoàn thành dự kiến
- `formula`: Công thức tính thời gian

### **3. Model: Vehicle.js**
✅ Đã có field `batteryCapacity` (kWh)

---

## 🎯 Công Thức Mới

### **Công Thức Cốt Lõi:**
```javascript
// CÁCH 1: Dựa vào % pin thực tế (ưu tiên)
if (final_battery_percentage) {
  actual_energy = ((final - initial) / 100) × battery_capacity
}

// CÁCH 2: Ước tính theo thời gian (fallback)
else {
  energy_needed = ((target - initial) / 100) × battery_capacity
  energy_by_time = power × time × 0.9
  actual_energy = min(energy_needed, energy_by_time)
}

// Tính phí
total = base_fee + (actual_energy × price_per_kwh)
```

---

## 📊 Ví Dụ Response Mới

### **Start Session Response:**
```json
{
  "session": {
    "id": "67abc123",
    "initial_battery": "20%",
    "target_battery": "100%",
    "battery_to_charge": "80%",
    "vehicle": {
      "battery_capacity": "75 kWh"
    },
    "estimated_time": {
      "energy_needed": "60.00 kWh",
      "estimated_time": "1.33 giờ",
      "estimated_completion": "2025-10-25T05:48:00.000Z",
      "formula": "60.00 kWh ÷ (50 kW × 0.9) = 1.33 giờ"
    }
  }
}
```

### **End Session Response:**
```json
{
  "target_status": "⚠️ Stopped early (Target: 100%, Actual: 85%)",
  "session": {
    "initial_battery": "20%",
    "final_battery": "85%",
    "battery_charged": "65%",
    "battery_capacity": "75 kWh",
    "energy_needed": "60.00 kWh",
    "energy_delivered": "48.75 kWh",
    "calculation_method": "Based on actual battery percentage",
    "formula": "(65% / 100) × 75 kWh = 48.75 kWh"
  },
  "fee_calculation": {
    "base_fee": 10000,
    "price_per_kwh": 3000,
    "energy_charged": "48.75 kWh",
    "charging_fee": 146250,
    "total_amount": 156250,
    "total_amount_formatted": "156.250 VND",
    "breakdown": "10.000 VND (phí cơ bản) + 48.75 kWh × 3.000 VND/kWh = 156.250 VND"
  }
}
```

---

## ✅ Các Tính Năng Mới

### **1. Tự Động Giới Hạn Năng Lượng**
- ✅ Không tính quá năng lượng cần thiết
- ✅ `min(energy_needed, energy_by_time)`

### **2. Hiển Thị Công Thức Chi Tiết**
- ✅ Method tính toán (actual/estimated)
- ✅ Công thức từng bước
- ✅ Breakdown phí rõ ràng

### **3. Ước Tính Thời Gian**
- ✅ Tính thời gian cần sạc khi start
- ✅ Thời gian hoàn thành dự kiến
- ✅ Công thức tính thời gian

### **4. Linh Hoạt Input**
- ✅ User có thể nhập `final_battery_percentage`
- ✅ Hoặc để trống → tự ước tính
- ✅ Hoạt động với/không có IoT

---

## 🧪 Test Cases

### **Test 1: User Nhập % Pin Cuối**
```http
POST /end
{ "final_battery_percentage": 85 }

→ Method: "Based on actual battery percentage"
→ Energy: ((85-20)/100) × 75 = 48.75 kWh
→ Fee: 156,250 VND
```

### **Test 2: Không Nhập (Ước Tính)**
```http
POST /end
{}

→ Method: "Estimated by power × time"
→ Energy: min(60, 45) = 45 kWh
→ Fee: 145,000 VND
```

### **Test 3: Sạc Đầy 100%**
```http
POST /end
{ "final_battery_percentage": 100 }

→ Energy: ((100-20)/100) × 75 = 60 kWh
→ Fee: 190,000 VND
```

---

## 📋 Checklist Kiểm Tra

### **Database:**
- [x] ChargingSession có fields: `current_battery_percentage`, `target_battery_percentage`
- [x] Vehicle có field: `batteryCapacity`

### **Code:**
- [x] Model ChargingSession: method `calculateCharges()` updated
- [x] Controller: `endSession` updated
- [x] Controller: `startSessionByQr` updated
- [x] Không có lỗi syntax

### **Validation:**
- [x] Kiểm tra `final_battery >= initial_battery`
- [x] Kiểm tra `vehicle.batteryCapacity` tồn tại
- [x] Handle edge case thời gian = 0

### **Documentation:**
- [x] `CHARGING_FORMULA_EXPLAINED.md`: Giải thích công thức
- [x] `TEST_NEW_FORMULA.md`: Test cases chi tiết
- [x] `UPDATE_SUMMARY.md`: Tóm tắt update

---

## 🚀 Next Steps

### **1. Test API (QUAN TRỌNG)**
```bash
# Restart server
npm start

# Test flow hoàn chỉnh:
1. POST /generate-qr/:booking_id
2. POST /start/:qr_token
3. POST /end/:session_id
```

### **2. Update Database (Nếu Cần)**
```javascript
// Nếu có sessions cũ, update:
db.chargingsessions.updateMany(
  { current_battery_percentage: { $exists: false } },
  { $set: { 
    current_battery_percentage: 0,
    target_battery_percentage: 100
  }}
)

// Nếu vehicles thiếu batteryCapacity:
db.vehicles.updateMany(
  { batteryCapacity: { $exists: false } },
  { $set: { batteryCapacity: 75 }}  // Default value
)
```

### **3. Update Frontend (Nếu Có)**
```javascript
// End session modal:
<input 
  type="number" 
  placeholder="Nhập % pin hiện tại (0-100)"
  name="final_battery_percentage"
  min="0"
  max="100"
/>
```

### **4. Monitor & Debug**
```javascript
// Kiểm tra calculation response:
console.log(calculation.calculation_method)
console.log(calculation.formula)
console.log(calculation.total_amount)
```

---

## ⚠️ Lưu Ý

### **1. Vehicle PHẢI có batteryCapacity**
```javascript
// Khi tạo vehicle mới:
{
  "batteryCapacity": 75  // BẮT BUỘC (kWh)
}

// Database sẽ throw error nếu không có
```

### **2. Khuyến Nghị User Nhập % Pin**
- Chính xác nhất
- Không phụ thuộc ước tính
- Công bằng cho cả 2 bên

### **3. Hiệu Suất 90% là Default**
```javascript
charging_efficiency = 0.90  // Có thể điều chỉnh
```

---

## 📞 Support

Nếu gặp lỗi:
1. Check `vehicle.batteryCapacity` có tồn tại không
2. Check `calculation` object trong response
3. Xem `calculation_method` và `formula`
4. Verify data trong MongoDB

---

## 🎉 Kết Luận

✅ **Công thức mới đã hoàn tất:**
- Chính xác hơn
- Công bằng hơn
- Minh bạch hơn
- Không cần IoT vẫn hoạt động tốt

🚀 **Ready to test!**
