# 🔋 Cập nhật: Power Capacity chuyển từ ChargingPoint sang Station

**Ngày cập nhật:** 25/10/2025

---

## 📌 Tóm tắt thay đổi

### Trước đây:
```javascript
// Mỗi ChargingPoint có power_capacity riêng
ChargingPoint {
  stationId: ObjectId,
  power_capacity: 50,  // ❌ Mỗi CP có riêng
  type: 'online',
  status: 'available'
}
```

### Bây giờ:
```javascript
// Station có power_capacity chung
Station {
  name: "Station A",
  power_capacity: 50,  // ✅ Station có chung
  connector_type: "AC"
}

ChargingPoint {
  stationId: ObjectId,  // Lấy power_capacity từ station
  type: 'online',
  status: 'available'
  // ❌ Không còn power_capacity
}
```

---

## 🎯 Lý do thay đổi

1. **Hợp lý hóa dữ liệu**: Các charging point trong cùng một trạm thường có cùng công suất
2. **Giảm duplicate data**: Không cần lưu power_capacity cho mỗi charging point
3. **Dễ quản lý**: Chỉ cần cập nhật power_capacity ở 1 chỗ (Station) khi cần thay đổi
4. **Chuẩn hóa**: Phù hợp với thực tế vận hành trạm sạc

---

## 📂 Files đã thay đổi

| File | Thay đổi |
|------|----------|
| `models/Station.js` | ➕ Thêm `power_capacity: Number (required)` |
| `models/ChargingPoint.js` | ➖ Xóa `power_capacity` |
| `controllers/stationController.js` | ✏️ Response includes `power_capacity` |
| `controllers/chargingPointController.js` | ✏️ Lấy power từ `stationId.power_capacity` |
| `controllers/chargingSessionController.js` | ✏️ Populate station để lấy power |
| `controllers/bookingController.js` | ✏️ Populate station qua chargingPoint |
| `models/ChargingSession.js` | ✏️ Lấy power từ `chargingPoint.stationId.power_capacity` |
| `swagger.js` | ✏️ Cập nhật API documentation |

---

## 🚀 Cách sử dụng mới

### 1️⃣ Tạo Station (BẮT BUỘC có power_capacity)
```javascript
POST /api/station
{
  "name": "Station D",
  "address": "789 Street",
  "latitude": 10.762622,
  "longitude": 106.660172,
  "connector_type": "DC",
  "power_capacity": 100  // ⭐ REQUIRED
}
```

### 2️⃣ Tạo ChargingPoint (KHÔNG CẦN power_capacity)
```javascript
POST /api/charging-point
{
  "stationId": "507f1f77bcf86cd799439012",
  "type": "online"  // ⭐ Chỉ cần stationId và type
}

// Response tự động lấy power_capacity từ station
{
  "chargingPoint": {
    "_id": "...",
    "stationId": "...",
    "station_name": "Station D",
    "power_capacity": 100,  // ✅ Từ station
    "type": "online",
    "status": "available"
  }
}
```

### 3️⃣ Query ChargingPoint (cần populate)
```javascript
// Backend code
const chargingPoint = await ChargingPoint.findById(id)
  .populate('stationId');

console.log(chargingPoint.stationId.power_capacity); // ✅ 100 kW
```

---

## 🗄️ Migration Database

### Chạy tự động:
```bash
node migrations/migrate_power_capacity.js
```

### Hoặc chạy thủ công MongoDB:
```javascript
// 1. Thêm power_capacity cho Station
db.stations.updateMany(
  { power_capacity: { $exists: false } },
  { $set: { power_capacity: 50 } }
);

// 2. Xóa power_capacity từ ChargingPoint
db.chargingpoints.updateMany(
  {},
  { $unset: { power_capacity: "" } }
);
```

---

## ✅ Testing Checklist

- [x] ✅ Station model có field `power_capacity` required
- [x] ✅ ChargingPoint model không còn `power_capacity`
- [x] ✅ Create Station yêu cầu `power_capacity`
- [x] ✅ Create ChargingPoint không cần `power_capacity`
- [x] ✅ ChargingSession lấy power từ station
- [x] ✅ Booking populate đúng để lấy power
- [x] ✅ GET /stations/:id trả về power_capacity
- [x] ✅ Swagger docs đã cập nhật

---

## ⚠️ Breaking Changes

### API Changes:

**Tạo ChargingPoint:**
```diff
POST /api/charging-point
{
  "stationId": "...",
- "power_capacity": 50,  // ❌ Không còn cần
  "type": "online"
}
```

**Response format:**
```diff
{
  "_id": "...",
  "stationId": {...},
+ "station_name": "Station A",  // ✅ Thêm
+ "power_capacity": 50,         // ✅ Từ station
  "type": "online"
}
```

---

## 🔗 Tài liệu liên quan

- `MIGRATION_POWER_CAPACITY.md` - Hướng dẫn migration chi tiết
- `migrations/migrate_power_capacity.js` - Script migration tự động
- `swagger.js` - API documentation đã cập nhật

---

## 📞 Hỗ trợ

Nếu gặp vấn đề:
1. Kiểm tra đã chạy migration chưa
2. Đảm bảo tất cả Station có `power_capacity`
3. Xem log chi tiết trong migration script
4. Liên hệ team nếu cần hỗ trợ
