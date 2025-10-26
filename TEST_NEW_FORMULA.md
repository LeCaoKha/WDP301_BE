# 🧪 Test Công Thức Tính Tiền Mới

## 📋 Chuẩn Bị Data Test

### Vehicle với Battery Capacity
```json
{
  "plate_number": "51G12345",
  "model": "Tesla Model 3",
  "batteryCapacity": 75
}
```

### Charging Point
```json
{
  "name": "Fast Charger A",
  "power_capacity": 50
}
```

### Pricing
```json
{
  "base_fee": 10000,
  "price_per_kwh": 3000
}
```

---

## 🎬 Test Case 1: User Nhập % Pin Cuối (Chính Xác Nhất)

### **Scenario:**
- Pin ban đầu: 20%
- Pin cuối (user nhập): 85%
- Thời gian: 1.5 giờ

### **Request - Start Session:**
```http
POST /api/charging-sessions/start/{{qr_token}}
Content-Type: application/json

{
  "initial_battery_percentage": 20,
  "target_battery_percentage": 100
}
```

### **Expected Response:**
```json
{
  "message": "Charging session started successfully",
  "session": {
    "initial_battery": "20%",
    "target_battery": "100%",
    "battery_to_charge": "80%",
    "vehicle": {
      "battery_capacity": "75 kWh"
    },
    "estimated_time": {
      "energy_needed": "60.00 kWh",
      "estimated_time": "1.33 giờ",
      "formula": "60.00 kWh ÷ (50 kW × 0.9) = 1.33 giờ"
    }
  }
}
```

### **Request - End Session (After 1.5h):**
```http
POST /api/charging-sessions/{{session_id}}/end
Content-Type: application/json

{
  "final_battery_percentage": 85
}
```

### **Expected Calculation:**
```
Battery charged: 85% - 20% = 65%
Energy delivered: (65 / 100) × 75 kWh = 48.75 kWh
Charging fee: 48.75 × 3,000 = 146,250 VND
Total: 10,000 + 146,250 = 156,250 VND
```

### **Expected Response:**
```json
{
  "message": "Charging session ended successfully",
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
    "breakdown": "10.000 VND (phí cơ bản) + 48.75 kWh × 3.000 VND/kWh = 156.250 VND"
  }
}
```

---

## 🎬 Test Case 2: Không Nhập % Pin (Ước Tính Theo Thời Gian)

### **Scenario:**
- Pin ban đầu: 20%
- Target: 100%
- Thời gian thực tế: 1 giờ
- Không nhập final_battery_percentage

### **Request - End Session:**
```http
POST /api/charging-sessions/{{session_id}}/end
Content-Type: application/json

{}
```

### **Expected Calculation:**
```
Energy needed: ((100 - 20) / 100) × 75 = 60 kWh
Energy by time: 50 kW × 1h × 0.9 = 45 kWh
Actual energy: min(60, 45) = 45 kWh  // Chưa đủ thời gian sạc đầy

Estimated final battery:
  Battery gained = (45 / 75) × 100 = 60%
  Final battery = 20% + 60% = 80%

Charging fee: 45 × 3,000 = 135,000 VND
Total: 10,000 + 135,000 = 145,000 VND
```

### **Expected Response:**
```json
{
  "session": {
    "initial_battery": "20%",
    "final_battery": "80%",
    "battery_charged": "60%",
    "energy_needed": "60.00 kWh",
    "energy_delivered": "45.00 kWh",
    "calculation_method": "Estimated by power × time",
    "formula": "min(60.00 kWh needed, 50 kW × 1.00h × 0.9) = 45.00 kWh"
  },
  "fee_calculation": {
    "charging_fee": 135000,
    "total_amount": 145000
  }
}
```

---

## 🎬 Test Case 3: Sạc Đầy 100%

### **Scenario:**
- Pin ban đầu: 20%
- User nhập: 100%
- Thời gian: 2 giờ

### **Request - End Session:**
```http
POST /api/charging-sessions/{{session_id}}/end
Content-Type: application/json

{
  "final_battery_percentage": 100
}
```

### **Expected Calculation:**
```
Battery charged: 100% - 20% = 80%
Energy delivered: (80 / 100) × 75 = 60 kWh
Charging fee: 60 × 3,000 = 180,000 VND
Total: 10,000 + 180,000 = 190,000 VND
```

### **Expected Response:**
```json
{
  "target_status": "✅ Target 100% reached!",
  "session": {
    "battery_charged": "80%",
    "energy_delivered": "60.00 kWh"
  },
  "fee_calculation": {
    "total_amount": 190000
  }
}
```

---

## 🎬 Test Case 4: Sạc Quá Thời Gian (Năng Lượng Cần < Năng Lượng Theo Thời Gian)

### **Scenario:**
- Pin: 80% → 100% (chỉ cần 20%)
- Thời gian: 2 giờ (quá nhiều)
- Không nhập final_battery

### **Expected Calculation:**
```
Energy needed: ((100 - 80) / 100) × 75 = 15 kWh
Energy by time: 50 × 2 × 0.9 = 90 kWh

Actual energy: min(15, 90) = 15 kWh  // ✅ Chỉ tính phần cần thiết!

Charging fee: 15 × 3,000 = 45,000 VND
Total: 10,000 + 45,000 = 55,000 VND
```

**✅ Không bị tính quá mức!**

---

## 📊 So Sánh Công Thức Cũ vs Mới

### **Ví dụ: Pin 80% → 100%, 2 giờ, 50 kW**

| Công Thức | Tính Toán | Kết Quả | Đúng? |
|-----------|-----------|---------|-------|
| **Cũ** (theo thời gian) | 50 kW × 2h = 100 kWh | 310,000 VND | ❌ Sai (tính quá) |
| **Mới** (theo năng lượng cần) | min(15 kWh, 100 kWh) = 15 kWh | 55,000 VND | ✅ Đúng |

---

## ✅ Validation Checklist

- [ ] Vehicle phải có `batteryCapacity`
- [ ] Tính đúng năng lượng cần sạc
- [ ] Không tính quá năng lượng cần thiết
- [ ] User nhập % pin → tính theo % pin
- [ ] Không nhập → ước tính theo thời gian
- [ ] Hiển thị công thức rõ ràng
- [ ] Format tiền VND đúng

---

## 🚀 Quick Test Commands

```bash
# 1. Tạo booking
POST /api/bookings

# 2. Generate QR
POST /api/charging-sessions/generate-qr/{{booking_id}}

# 3. Start session
POST /api/charging-sessions/start/{{qr_token}}
{ "initial_battery_percentage": 20, "target_battery_percentage": 100 }

# 4. Wait hoặc fake time...

# 5. End session (với % pin)
POST /api/charging-sessions/{{session_id}}/end
{ "final_battery_percentage": 85 }

# 6. Kiểm tra calculation
```

---

## ⚠️ Edge Cases

### **1. Vehicle không có batteryCapacity**
```json
{
  "message": "Vehicle battery capacity not configured"
}
```

### **2. Final battery < Initial**
```json
{
  "message": "Final battery cannot be less than initial battery"
}
```

### **3. Thời gian sạc = 0**
```
energy_delivered = 0 kWh
total = base_fee = 10,000 VND
```

---

## 📈 Monitoring

Check MongoDB sau mỗi session:
```javascript
db.chargingsessions.findOne({ _id: "..." })

// Verify:
{
  initial_battery_percentage: 20,
  current_battery_percentage: 85,
  target_battery_percentage: 100,
  energy_delivered_kwh: 48.75,
  charging_fee: 146250,
  total_amount: 156250
}
```
