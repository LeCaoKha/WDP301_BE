# Migration Guide: Power Capacity từ ChargingPoint sang Station

## 📋 Tổng quan thay đổi

### Trước đây:
- Mỗi **ChargingPoint** có `power_capacity` riêng
- Khi tạo ChargingPoint phải truyền `power_capacity`

### Bây giờ:
- **Station** có `power_capacity` chung cho tất cả charging points
- ChargingPoint không còn lưu `power_capacity` riêng
- `power_capacity` được lấy từ Station thông qua populate

---

## 🔄 Các file đã thay đổi

### 1. Models
- ✅ `models/Station.js` - Thêm field `power_capacity` (required)
- ✅ `models/ChargingPoint.js` - Xóa field `power_capacity`

### 2. Controllers
- ✅ `controllers/stationController.js` - Cập nhật response includes `power_capacity`
- ✅ `controllers/chargingPointController.js` - Lấy `power_capacity` từ station
- ✅ `controllers/chargingSessionController.js` - Populate station để lấy `power_capacity`
- ✅ `controllers/bookingController.js` - Populate station thông qua chargingPoint

### 3. Documentation
- ✅ `swagger.js` - Cập nhật schema cho Station và ChargingPoint

---

## 🗄️ Migration Database (QUAN TRỌNG!)

### Bước 1: Backup Database
```bash
# MongoDB backup
mongodump --db=your_database_name --out=./backup_before_migration
```

### Bước 2: Cập nhật Station - Thêm power_capacity
Chạy script MongoDB sau để thêm `power_capacity` cho các Station hiện có:

```javascript
// Kết nối MongoDB Shell hoặc MongoDB Compass
use your_database_name;

// Cập nhật tất cả stations với power_capacity mặc định
// Điều chỉnh giá trị 50 theo công suất thực tế của từng trạm
db.stations.updateMany(
  { power_capacity: { $exists: false } },
  { $set: { power_capacity: 50 } }
);

// Hoặc cập nhật từng station với công suất riêng:
db.stations.updateOne(
  { name: "Station A" },
  { $set: { power_capacity: 50 } }
);

db.stations.updateOne(
  { name: "Station B" },
  { $set: { power_capacity: 100 } }
);

// Kiểm tra kết quả
db.stations.find({}, { name: 1, power_capacity: 1 });
```

### Bước 3: Xóa power_capacity từ ChargingPoints (Optional)
```javascript
// Xóa field power_capacity khỏi tất cả charging points
db.chargingpoints.updateMany(
  {},
  { $unset: { power_capacity: "" } }
);

// Kiểm tra kết quả
db.chargingpoints.findOne();
```

---

## 📝 Cách sử dụng sau khi migration

### 1. Tạo Station mới
```json
POST /api/station
{
  "name": "Station C",
  "address": "456 Street",
  "latitude": 10.762622,
  "longitude": 106.660172,
  "connector_type": "DC",
  "power_capacity": 100  // ⭐ BẮT BUỘC
}
```

### 2. Tạo ChargingPoint mới
```json
POST /api/charging-point
{
  "stationId": "507f1f77bcf86cd799439012",
  "type": "online"  // Chỉ cần stationId và type, KHÔNG CẦN power_capacity nữa
}
```

### 3. Lấy thông tin Station với power_capacity
```json
GET /api/stations/:id

Response:
{
  "station": {
    "_id": "...",
    "name": "Station A",
    "power_capacity": 50,  // ⭐ Công suất trạm
    "connector_type": "AC"
  },
  "charging_points": { ... }
}
```

### 4. Lấy thông tin ChargingPoint (cần populate)
```javascript
// Trong code backend
const chargingPoint = await ChargingPoint.findById(id)
  .populate('stationId');

const power = chargingPoint.stationId.power_capacity; // Lấy công suất từ station
```

---

## ⚠️ Lưu ý quan trọng

1. **Tất cả Station phải có `power_capacity`** - đây là field required
2. **ChargingPoint không còn `power_capacity`** - luôn lấy từ Station
3. **Khi query ChargingPoint cần `power_capacity`** - nhớ populate `stationId`
4. **Database cũ** - cần chạy migration script để cập nhật

---

## ✅ Checklist Migration

- [ ] Backup database
- [ ] Chạy migration script để thêm `power_capacity` vào Station
- [ ] Xóa `power_capacity` từ ChargingPoint (optional)
- [ ] Test tạo Station mới (phải có `power_capacity`)
- [ ] Test tạo ChargingPoint mới (không cần `power_capacity`)
- [ ] Test charging session (power_capacity lấy từ station)
- [ ] Test booking (populate station qua chargingPoint)
- [ ] Cập nhật frontend/mobile app (nếu có)

---

## 🐛 Troubleshooting

### Lỗi: "power_capacity is required" khi tạo Station
✅ **Giải pháp**: Thêm field `power_capacity` vào request body

### ChargingPoint không có power_capacity khi query
✅ **Giải pháp**: Populate stationId
```javascript
.populate('stationId')
// Sau đó: chargingPoint.stationId.power_capacity
```

### Lỗi validation khi tạo ChargingPoint
✅ **Giải pháp**: Xóa field `power_capacity` từ request body, chỉ gửi `stationId` và `type`

---

## 📞 Hỗ trợ

Nếu gặp vấn đề trong quá trình migration, kiểm tra:
1. Database đã được backup chưa?
2. Tất cả Station đã có `power_capacity` chưa?
3. Code đã pull latest version chưa?
4. Dependencies đã được cập nhật chưa? (`npm install`)
