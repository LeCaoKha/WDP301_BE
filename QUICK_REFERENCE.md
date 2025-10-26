# 🚀 Quick Reference - Công Thức Tính Tiền Sạc

## 📐 Công Thức Đơn Giản

```javascript
// INPUT
battery_capacity = 75 kWh           // Dung lượng pin xe
initial_battery = 20%               // % pin bắt đầu
final_battery = 85%                 // % pin kết thúc (user nhập)

// CALCULATION
battery_charged = 85% - 20% = 65%
energy_delivered = (65 / 100) × 75 = 48.75 kWh
charging_fee = 48.75 × 3,000 = 146,250 VND
total = 10,000 + 146,250 = 156,250 VND
```

---

## 🔍 2 Phương Pháp Tính

| Method | Khi Nào | Độ Chính Xác | Công Thức |
|--------|---------|--------------|-----------|
| **Actual** | User nhập % pin cuối | ⭐⭐⭐⭐⭐ | `((final-initial)/100) × capacity` |
| **Estimated** | Không nhập % pin | ⭐⭐⭐ | `min(needed, power×time×0.9)` |

---

## 📊 Ví Dụ Nhanh

### **Case 1: Sạc 20% → 85%**
```
Energy: (65/100) × 75 = 48.75 kWh
Fee: 48.75 × 3,000 = 146,250 VND
Total: 156,250 VND
```

### **Case 2: Sạc 80% → 100%**
```
Energy: (20/100) × 75 = 15 kWh
Fee: 15 × 3,000 = 45,000 VND
Total: 55,000 VND
```

### **Case 3: Sạc Đầy 20% → 100%**
```
Energy: (80/100) × 75 = 60 kWh
Fee: 60 × 3,000 = 180,000 VND
Total: 190,000 VND
```

---

## 🎯 API Quick Test

```bash
# 1. Start
POST /api/charging-sessions/start/{qr_token}
{
  "initial_battery_percentage": 20,
  "target_battery_percentage": 100
}

# 2. End (với % pin)
POST /api/charging-sessions/{session_id}/end
{
  "final_battery_percentage": 85
}

# 3. End (không % pin - ước tính)
POST /api/charging-sessions/{session_id}/end
{}
```

---

## ✅ Validation Rules

```javascript
✅ final_battery >= initial_battery
✅ 0 <= battery_percentage <= 100
✅ vehicle.batteryCapacity > 0
✅ target > initial
❌ final < initial → Error
❌ batteryCapacity = null → Error
```

---

## 📱 Response Format

```json
{
  "session": {
    "battery_charged": "65%",
    "energy_delivered": "48.75 kWh",
    "calculation_method": "Based on actual battery percentage",
    "formula": "(65% / 100) × 75 kWh = 48.75 kWh"
  },
  "fee_calculation": {
    "charging_fee": 146250,
    "total_amount": 156250,
    "breakdown": "10.000 VND + 48.75 kWh × 3.000 = 156.250 VND"
  }
}
```

---

## 🔧 Common Issues

### **1. "Vehicle battery capacity not configured"**
```javascript
// Fix: Update vehicle
db.vehicles.updateOne(
  { _id: vehicleId },
  { $set: { batteryCapacity: 75 }}
)
```

### **2. Response có `NaN` hoặc `undefined`**
```javascript
// Check:
1. Vehicle có batteryCapacity chưa?
2. Session có current_battery_percentage chưa?
3. Restart server sau khi update model
```

### **3. Phí quá cao**
```javascript
// Nguyên nhân: Dùng công thức cũ (power × time)
// Fix: Code đã update, restart server
```

---

## 💡 Tips

### **Khuyến Nghị User:**
- ✅ Luôn nhập % pin cuối để chính xác nhất
- ✅ Kiểm tra % pin trên dashboard xe
- ✅ Không nhập cũng được, hệ thống tự ước tính

### **Cho Developer:**
- ✅ Vehicle PHẢI có `batteryCapacity`
- ✅ Hiển thị `calculation_method` và `formula` cho transparency
- ✅ Log calculation để debug

### **Database:**
```javascript
// Index recommended
db.chargingsessions.createIndex({ status: 1, start_time: 1 })
db.vehicles.createIndex({ batteryCapacity: 1 })
```

---

## 🎓 Understanding

### **Tại Sao Dùng min(needed, by_time)?**
```
Ví dụ: Xe chỉ cần 15 kWh (80%→100%)
Nhưng sạc 3 giờ → 135 kWh theo thời gian

min(15, 135) = 15 kWh
→ Chỉ tính phần xe THẬT SỰ nhận được
→ Công bằng!
```

### **Tại Sao × 0.9 (Efficiency)?**
```
Năng lượng từ lưới điện: 100 kWh
Năng lượng vào pin: ~90 kWh
Mất mát: 10% (nhiệt, chuyển đổi)

→ Ước tính thực tế hơn
```

---

## 📞 Quick Checklist

- [ ] Restart server sau khi update code
- [ ] Vehicle có `batteryCapacity`
- [ ] Test với `final_battery_percentage`
- [ ] Test không nhập `final_battery_percentage`
- [ ] Check response có `calculation_method`
- [ ] Verify total_amount hợp lý
- [ ] MongoDB session có `current_battery_percentage`

✅ **All done? Ready to go!** 🚀
