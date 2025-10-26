# 💰 Hướng dẫn Quản lý Giá - Pricing Guide

## 📍 Nơi lưu giá tiền

### **Station Model** (Khuyến nghị ✅)
Giá được lưu ở cấp **Station** - mỗi trạm có thể có giá riêng.

```javascript
Station {
  name: "Station A",
  power_capacity: 50,
  price_per_kwh: 3000,    // ⭐ Giá điện (VND/kWh)
  base_fee: 10000,        // ⭐ Phí cơ bản (VND)
  connector_type: "AC"
}
```

### **ChargingSession**
Khi tạo session, giá được copy từ Station vào session để:
- Đảm bảo giá không thay đổi giữa chừng khi đang sạc
- Lưu lại lịch sử giá tại thời điểm sạc

```javascript
ChargingSession {
  price_per_kwh: 3000,    // Copy từ Station
  base_fee: 10000,        // Copy từ Station
  energy_delivered_kwh: 25,
  total_amount: 85000     // = 10000 + (25 × 3000)
}
```

---

## 🔧 Cách thiết lập giá

### 1️⃣ Tạo Station với giá tùy chỉnh
```javascript
POST /api/station
{
  "name": "Station Premium",
  "address": "CBD Area",
  "connector_type": "DC",
  "power_capacity": 100,
  "price_per_kwh": 4000,    // ⭐ Giá cao hơn cho DC hoặc khu vực cao cấp
  "base_fee": 15000         // ⭐ Phí cơ bản cao hơn
}
```

### 2️⃣ Tạo Station với giá mặc định
```javascript
POST /api/station
{
  "name": "Station Standard",
  "connector_type": "AC",
  "power_capacity": 50
  // price_per_kwh tự động = 3000 VND/kWh
  // base_fee tự động = 10000 VND
}
```

### 3️⃣ Cập nhật giá của Station
```javascript
PUT /api/stations/:id
{
  "price_per_kwh": 3500,   // Tăng giá điện
  "base_fee": 12000        // Tăng phí cơ bản
}
```

---

## 💡 Ví dụ Chiến lược Giá

### Giá theo loại trạm:
```javascript
// AC Charging - Chậm hơn, rẻ hơn
{
  "name": "Station AC Standard",
  "connector_type": "AC",
  "power_capacity": 7,
  "price_per_kwh": 2500,   // Giá thấp
  "base_fee": 5000
}

// DC Fast Charging - Nhanh hơn, đắt hơn
{
  "name": "Station DC Fast",
  "connector_type": "DC",
  "power_capacity": 150,
  "price_per_kwh": 5000,   // Giá cao
  "base_fee": 20000
}
```

### Giá theo khu vực:
```javascript
// Khu vực trung tâm
{
  "name": "Station Downtown",
  "price_per_kwh": 4000,
  "base_fee": 15000
}

// Khu vực ngoại ô
{
  "name": "Station Suburb",
  "price_per_kwh": 2500,
  "base_fee": 8000
}
```

---

## 📊 Cách tính phí trong ChargingSession

### Công thức:
```
Total Amount = Base Fee + (Energy Delivered × Price per kWh)
```

### Ví dụ thực tế:

**Scenario 1: Sạc đầy bình thường**
```
Station: price_per_kwh = 3000 VND, base_fee = 10000 VND
Energy delivered: 30 kWh

Total = 10,000 + (30 × 3,000)
      = 10,000 + 90,000
      = 100,000 VND
```

**Scenario 2: Sạc nhanh DC**
```
Station DC: price_per_kwh = 5000 VND, base_fee = 20000 VND
Energy delivered: 40 kWh

Total = 20,000 + (40 × 5,000)
      = 20,000 + 200,000
      = 220,000 VND
```

**Scenario 3: Sạc ít**
```
Station: price_per_kwh = 3000 VND, base_fee = 10000 VND
Energy delivered: 5 kWh

Total = 10,000 + (5 × 3,000)
      = 10,000 + 15,000
      = 25,000 VND
```

---

## 🔄 Flow tính giá trong hệ thống

```
1. User tạo Booking → chọn Station
   ↓
2. Admin confirm Booking
   ↓
3. Generate QR Code
   - Lấy price_per_kwh từ Station
   - Lấy base_fee từ Station
   - Tạo ChargingSession với giá này
   ↓
4. User scan QR và bắt đầu sạc
   - Giá đã được lock trong session
   - Không thay đổi dù Station update giá
   ↓
5. Kết thúc sạc
   - Tính năng lượng thực tế (kWh)
   - Áp dụng công thức: base_fee + (kWh × price_per_kwh)
   - Lưu total_amount
```

---

## 🎯 Best Practices

### 1. Thiết lập giá theo mục đích
- **AC Standard**: 2500-3000 VND/kWh (sạc qua đêm)
- **DC Fast**: 4000-6000 VND/kWh (sạc nhanh trong ngày)
- **Premium Location**: +30-50% so với giá cơ bản

### 2. Base Fee hợp lý
- **Mục đích**: Chi phí vận hành, bảo trì
- **Khuyến nghị**: 5,000 - 20,000 VND
- **Tránh**: Quá cao làm người dùng ngại sạc ít

### 3. Cập nhật giá linh hoạt
```javascript
// Giá giờ cao điểm (7h-9h, 17h-19h)
PUT /api/stations/:id
{ "price_per_kwh": 4000 }

// Giá giờ thấp điểm (22h-6h)
PUT /api/stations/:id
{ "price_per_kwh": 2000 }
```

### 4. Promotion / Discount
- Cân nhắc thêm field `discount_percentage` vào Station
- Hoặc tạo bảng `Pricing Rules` riêng

---

## 📋 Database Schema

```javascript
// Station
{
  _id: ObjectId,
  name: String,
  power_capacity: Number,      // kW
  price_per_kwh: Number,        // VND/kWh (default: 3000)
  base_fee: Number,             // VND (default: 10000)
  connector_type: "AC" | "DC"
}

// ChargingSession
{
  _id: ObjectId,
  booking_id: ObjectId,
  price_per_kwh: Number,        // Copy từ Station
  base_fee: Number,             // Copy từ Station
  energy_delivered_kwh: Number, // Tính toán thực tế
  charging_fee: Number,         // energy × price_per_kwh
  total_amount: Number          // base_fee + charging_fee
}
```

---

## ⚠️ Lưu ý quan trọng

1. **Giá được LOCK khi tạo session**
   - Session giữ giá tại thời điểm tạo
   - Cập nhật giá Station không ảnh hưởng session đang chạy

2. **Validation**
   - `price_per_kwh` > 0
   - `base_fee` ≥ 0
   - Hiển thị giá cho user trước khi booking

3. **Hiển thị giá**
   ```javascript
   GET /api/stations/:id
   Response: {
     "name": "Station A",
     "price_per_kwh": 3000,
     "base_fee": 10000,
     "pricing_info": "Phí cơ bản: 10,000 VND + 3,000 VND/kWh"
   }
   ```

---

## 🚀 Next Steps

- [ ] Thêm pricing tiers (Standard, Premium, VIP)
- [ ] Dynamic pricing theo thời gian (peak/off-peak)
- [ ] Subscription plans (giảm giá cho members)
- [ ] Loyalty points system
- [ ] Promotional codes/vouchers

---

## 📞 FAQ

**Q: Có thể có nhiều mức giá trong 1 station không?**
A: Hiện tại mỗi station 1 giá. Nếu cần, có thể thêm bảng `PricingRules` riêng.

**Q: Giá có thay đổi giữa chừng khi đang sạc không?**
A: Không. Giá được lock khi tạo session.

**Q: Làm sao để áp dụng giảm giá?**
A: Có thể giảm `price_per_kwh` hoặc `base_fee` của Station, hoặc thêm logic discount riêng.

**Q: Giá mặc định là bao nhiêu?**
A: `price_per_kwh = 3000 VND/kWh`, `base_fee = 10000 VND`
