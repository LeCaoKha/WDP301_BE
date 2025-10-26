# ⚡ Công Thức Tính Tiền Sạc - Chi Tiết

## 📐 Công Thức Mới (Chính Xác)

### **1. Tính Năng Lượng Cần Sạc**

```javascript
// Thông tin đầu vào
battery_capacity = 75 kWh           // Dung lượng pin xe (từ Vehicle model)
initial_battery = 20%               // % pin khi bắt đầu
target_battery = 100%               // % pin mục tiêu (hoặc user chọn, default 100%)

// Bước 1: Tính năng lượng hiện tại
current_energy = (initial_battery / 100) × battery_capacity
// = (20 / 100) × 75 = 15 kWh

// Bước 2: Tính năng lượng mục tiêu
target_energy = (target_battery / 100) × battery_capacity
// = (100 / 100) × 75 = 75 kWh

// Bước 3: Năng lượng cần sạc
energy_needed = target_energy - current_energy
// = 75 - 15 = 60 kWh
```

---

### **2. Tính Năng Lượng Thực Tế Đã Sạc**

#### **Cách 1: Dựa vào % Pin Thực Tế (Ưu Tiên)**

```javascript
// Nếu có final_battery_percentage (user nhập hoặc từ IoT)
final_battery = 85%                 // User nhập khi kết thúc

battery_charged = final_battery - initial_battery
// = 85% - 20% = 65%

actual_energy_delivered = (battery_charged / 100) × battery_capacity
// = (65 / 100) × 75 = 48.75 kWh

✅ Chính xác: 100%
```

#### **Cách 2: Ước Tính Theo Thời Gian (Fallback)**

```javascript
// Nếu KHÔNG có final_battery_percentage
power_capacity = 50 kW              // Công suất trạm sạc
actual_time = 1.5 giờ               // Thời gian thực tế đã sạc
charging_efficiency = 0.90          // Hiệu suất 90%

// Năng lượng tối đa theo thời gian
max_energy_by_time = power_capacity × actual_time × charging_efficiency
// = 50 × 1.5 × 0.9 = 67.5 kWh

// Lấy giá trị NHỎ HƠN (không tính quá mức)
actual_energy_delivered = Math.min(energy_needed, max_energy_by_time)
// = Math.min(60, 67.5) = 60 kWh

// Ước tính % pin cuối
battery_gained = (actual_energy_delivered / battery_capacity) × 100
// = (60 / 75) × 100 = 80%

estimated_final_battery = initial_battery + battery_gained
// = 20% + 80% = 100%

✅ Chính xác: ~90% (sai số ±5-10%)
```

---

### **3. Tính Phí Sạc**

```javascript
base_fee = 10,000 VND               // Phí cơ bản (mỗi session)
price_per_kwh = 3,000 VND/kWh       // Giá điện

// Phí sạc điện
charging_fee = actual_energy_delivered × price_per_kwh
// = 48.75 × 3,000 = 146,250 VND

// Tổng phí
total_amount = base_fee + charging_fee
// = 10,000 + 146,250 = 156,250 VND
```

---

## 📊 Ví Dụ Thực Tế

### **Case 1: Tesla Model 3 (75 kWh)**

```
Thông tin:
- Xe: Tesla Model 3, pin 75 kWh
- Pin ban đầu: 20%
- Pin cuối (user nhập): 85%
- Thời gian: 1.5 giờ
- Trạm sạc: 50 kW
- Giá: 3,000 VND/kWh

Tính toán:
1. Năng lượng cần: ((100-20)/100) × 75 = 60 kWh
2. Năng lượng thực tế: ((85-20)/100) × 75 = 48.75 kWh
3. Phí sạc: 48.75 × 3,000 = 146,250 VND
4. Tổng: 10,000 + 146,250 = 156,250 VND

✅ Chính xác vì user nhập % pin cuối
```

---

### **Case 2: VinFast VF8 (87.7 kWh)**

```
Thông tin:
- Xe: VinFast VF8, pin 87.7 kWh
- Pin: 30% → 90%
- Thời gian: 2 giờ
- Trạm sạc: 100 kW Fast Charger

Tính toán (user nhập 90%):
1. Pin tăng: 90% - 30% = 60%
2. Năng lượng: (60/100) × 87.7 = 52.62 kWh
3. Phí: 52.62 × 3,000 = 157,860 VND
4. Tổng: 167,860 VND
```

---

### **Case 3: Sạc Ngắn (Chưa Đến Target)**

```
Thông tin:
- Pin: 20% → Target 100%
- Thời gian: 30 phút (0.5 giờ)
- Công suất: 50 kW
- KHÔNG nhập % pin cuối

Tính toán (ước tính):
1. Năng lượng cần: 60 kWh
2. Năng lượng theo thời gian: 50 × 0.5 × 0.9 = 22.5 kWh
3. Lấy min(60, 22.5) = 22.5 kWh
4. Ước tính pin cuối: 20% + (22.5/75)×100 = 50%
5. Phí: 22.5 × 3,000 = 67,500 VND
6. Tổng: 77,500 VND

✅ Hợp lý: Sạc ngắn → phí thấp
```

---

## 🔍 So Sánh Công Thức Cũ vs Mới

### **Scenario: Pin 80% → 100%, Sạc 3 giờ**

| Công Thức | Tính Toán | Phí Sạc | Tổng | Đánh Giá |
|-----------|-----------|---------|------|----------|
| **Cũ** (power × time) | 50 kW × 3h = 150 kWh | 450,000 | 460,000 | ❌ SAI (quá cao) |
| **Mới** (energy needed) | min(15, 135) = 15 kWh | 45,000 | 55,000 | ✅ ĐÚNG |

**Lý do:**
- Cũ: Tính theo thời gian, không quan tâm xe cần bao nhiêu
- Mới: Tính theo năng lượng THỰC TẾ cần sạc

---

## ✅ Ưu Điểm Công Thức Mới

### **1. Công Bằng**
- ✅ Khách hàng chỉ trả tiền phần điện xe THẬT SỰ nhận được
- ✅ Không bị tính quá mức nếu sạc lâu

### **2. Chính Xác**
- ✅ Tính theo % pin thực tế (nếu có)
- ✅ Ước tính hợp lý (nếu không có IoT)

### **3. Linh Hoạt**
- ✅ Hoạt động với hoặc không có IoT
- ✅ User có thể nhập % pin cuối
- ✅ Hỗ trợ target battery tùy chọn

### **4. Minh Bạch**
- ✅ Hiển thị công thức tính toán
- ✅ Giải thích method sử dụng
- ✅ Breakdown chi tiết từng khoản phí

---

## 📱 Flow Hoàn Chỉnh

```
1. START SESSION
   ↓
   Input: initial_battery = 20%, target = 100%
   ↓
   Tính: energy_needed = 60 kWh
   Ước tính: thời gian ≈ 1.33 giờ
   ↓
   
2. CHARGING... (user chờ)
   
   Option A: Có IoT
   ↓
   IoT gửi: 50%, 70%, 85%... → Update real-time
   
   Option B: Không IoT
   ↓
   User tự kiểm tra xe
   ↓
   
3. END SESSION
   ↓
   User nhập: final_battery = 85%
   ↓
   Tính: actual_energy = 48.75 kWh
   Phí: 156,250 VND
   ↓
   
4. PAYMENT
```

---

## 🎯 Best Practices

### **1. Luôn Yêu Cầu Battery Capacity**
```javascript
// Khi tạo vehicle
{
  "plate_number": "51G12345",
  "model": "Tesla Model 3",
  "batteryCapacity": 75  // ✅ BẮT BUỘC
}
```

### **2. Khuyến Khích User Nhập % Pin Cuối**
```javascript
// UI hiển thị khi end session
"Vui lòng nhập % pin hiện tại của xe để tính phí chính xác"
Input: [___]%
```

### **3. Hiển thị Ước Tính Trước**
```javascript
// Khi start session, show:
"Ước tính sạc từ 20% → 100%:"
- Năng lượng cần: 60 kWh
- Thời gian: ~1.3 giờ
- Chi phí dự kiến: ~190,000 VND
```

### **4. Validate Input**
```javascript
// Kiểm tra logic
if (final_battery < initial_battery) {
  throw Error("Pin cuối không thể nhỏ hơn pin đầu")
}

if (!vehicle.batteryCapacity) {
  throw Error("Xe chưa cấu hình dung lượng pin")
}
```

---

## 🚨 Edge Cases

### **1. Sạc Rất Ngắn (< 1 phút)**
```
time = 0.5 phút = 0.0083 giờ
energy = 50 × 0.0083 × 0.9 = 0.37 kWh
fee = 0.37 × 3,000 = 1,110 VND
total = 10,000 + 1,110 = 11,110 VND

✅ Vẫn tính phí cơ bản
```

### **2. Sạc Quá Lâu (Xe Đã Đầy)**
```
Cần: 60 kWh
Theo thời gian: 200 kWh (sạc 4 giờ)

Lấy min(60, 200) = 60 kWh
✅ Không tính quá mức
```

### **3. Không Có Battery Capacity**
```javascript
throw new Error('Vehicle battery capacity not configured');
// ❌ Không thể tính chính xác → Yêu cầu cập nhật
```

---

## 📌 Kết Luận

### **Công Thức Hoàn Chỉnh:**

```javascript
// Năng lượng thực tế
if (final_battery_percentage) {
  actual_energy = ((final_battery - initial_battery) / 100) × battery_capacity
} else {
  energy_needed = ((target - initial) / 100) × battery_capacity
  energy_by_time = power × time × 0.9
  actual_energy = min(energy_needed, energy_by_time)
}

// Phí
total = base_fee + (actual_energy × price_per_kwh)
```

### **Không Cần IoT Vẫn Hoạt động:**
- ✅ User nhập % cuối → Chính xác 100%
- ✅ Không nhập → Ước tính 90%
- ✅ Không bao giờ tính quá mức
- ✅ Công bằng cho cả khách hàng và nhà cung cấp

🚀 **Ready to deploy!**
