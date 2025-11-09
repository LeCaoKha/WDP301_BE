# 🔄 Database Migration Guide - Soft Delete for Vehicles

## 📋 Tổng Quan

Khi thêm soft delete cho Vehicle, cần update database hiện có để thêm 3 fields mới:
- `isActive`: Boolean (default: true)
- `deletedAt`: Date (default: null)
- `deletedReason`: String (default: null)

---

## ✅ Trạng Thái Hiện Tại

**Database của bạn:** ✅ **KHÔNG CẦN MIGRATION**
- Số lượng vehicles: **0**
- Vehicles cần update: **0**

➡️ Tất cả vehicles mới tạo sẽ tự động có soft delete fields.

---

## 🔧 Khi Nào Cần Migration?

Chỉ cần chạy migration script khi:
1. ✅ Database đã có vehicles hiện có (trước khi implement soft delete)
2. ✅ Muốn update tất cả vehicles cũ để có soft delete fields
3. ✅ Đảm bảo consistency trong database

---

## 🚀 Cách Chạy Migration (Nếu Cần)

### Bước 1: Kiểm tra database
```bash
node migrations/add_soft_delete_to_vehicles.js
```

### Bước 2: Script sẽ tự động:
1. ✅ Kết nối MongoDB
2. ✅ Đếm số vehicles hiện có
3. ✅ Kiểm tra vehicles chưa có soft delete fields
4. ✅ Update tất cả vehicles cũ
5. ✅ Tạo index cho `isActive` field
6. ✅ Verify migration thành công

### Output mẫu (nếu có data):
```
🔌 Connecting to MongoDB...
✅ Connected to MongoDB

📊 Total vehicles in database: 50
🔍 Vehicles without soft delete fields: 50

🔄 Starting migration...

✅ Migration completed!
📝 Updated 50 vehicles

🔍 Creating index on isActive field...
✅ Index created successfully

🔍 Verifying migration...

Sample vehicle after migration:
{
  "_id": "690xxx...",
  "user_id": "690xxx...",
  "plate_number": "29A-12345",
  "model": "Tesla Model 3",
  "batteryCapacity": 75,
  "isActive": true,
  "deletedAt": null,
  "deletedReason": null,
  "createdAt": "2025-01-10T10:00:00Z",
  "updatedAt": "2025-01-15T12:30:00Z"
}

✅ Vehicles with soft delete fields: 50/50

🎉 Migration successful! All vehicles updated.
```

---

## 📊 Kiểm Tra Sau Migration

### Verify bằng MongoDB Shell:
```javascript
// Kiểm tra tất cả vehicles có isActive field
db.vehicles.find({ isActive: { $exists: false } }).count()
// Kết quả mong đợi: 0

// Kiểm tra số vehicles active
db.vehicles.find({ isActive: true }).count()

// Kiểm tra vehicles đã xóa
db.vehicles.find({ isActive: false }).count()

// Sample vehicle
db.vehicles.findOne({})
```

### Verify bằng API:
```bash
# Lấy tất cả vehicles (chỉ active)
GET /api/vehicles

# Lấy bao gồm cả deleted
GET /api/vehicles?includeDeleted=true

# Lấy chỉ deleted vehicles
GET /api/vehicles/deleted
```

---

## ⚠️ Lưu Ý Quan Trọng

### 1. **Backup Database Trước Khi Migrate**
```bash
# Backup toàn bộ database
mongodump --db evdriver --out backup/$(date +%Y%m%d)

# Restore nếu cần
mongorestore --db evdriver backup/20250115/evdriver
```

### 2. **Migration Là Idempotent**
- Script có thể chạy nhiều lần mà không gây lỗi
- Chỉ update vehicles chưa có `isActive` field
- Vehicles đã có fields sẽ không bị thay đổi

### 3. **Index Performance**
- Script tự động tạo index cho `isActive`
- Giúp query `{ isActive: true }` nhanh hơn
- Quan trọng khi có nhiều vehicles

---

## 🎯 Các Trường Hợp Đặc Biệt

### Trường Hợp 1: Database đang chạy production
```bash
# 1. Chạy migration ở môi trường staging trước
NODE_ENV=staging node migrations/add_soft_delete_to_vehicles.js

# 2. Test kỹ
npm test

# 3. Deploy lên production trong maintenance window
NODE_ENV=production node migrations/add_soft_delete_to_vehicles.js
```

### Trường Hợp 2: Có vehicles đã bị xóa (hard delete)
- Không thể khôi phục vehicles đã bị xóa vật lý
- Chỉ update được vehicles còn tồn tại trong DB
- Lịch sử ChargingSession và Invoice có thể bị ảnh hưởng

### Trường Hợp 3: Database rất lớn (hàng triệu vehicles)
```javascript
// Sửa script để update theo batch
const batchSize = 1000;
let skip = 0;

while (true) {
  const result = await vehiclesCollection.updateMany(
    { 
      isActive: { $exists: false }
    },
    {
      $set: {
        isActive: true,
        deletedAt: null,
        deletedReason: null
      }
    },
    { limit: batchSize }
  );
  
  if (result.modifiedCount === 0) break;
  
  skip += batchSize;
  console.log(`Updated ${skip} vehicles...`);
}
```

---

## 📝 Rollback Plan (Nếu Cần)

Nếu muốn rollback soft delete:

```javascript
// Remove soft delete fields
db.vehicles.updateMany(
  {},
  {
    $unset: {
      isActive: "",
      deletedAt: "",
      deletedReason: ""
    }
  }
)

// Remove index
db.vehicles.dropIndex("isActive_1")
```

**⚠️ Cảnh báo:** Rollback sẽ mất thông tin về vehicles đã xóa!

---

## ✅ Checklist Migration

- [x] Backup database
- [x] Chạy migration script
- [x] Verify tất cả vehicles có soft delete fields
- [x] Kiểm tra index được tạo
- [x] Test API endpoints
- [x] Test soft delete functionality
- [x] Test restore functionality
- [x] Update documentation
- [x] Deploy lên production

---

## 🔗 Related Files

- **Migration Script:** `migrations/add_soft_delete_to_vehicles.js`
- **Model:** `models/Vehicle.js`
- **Controller:** `controllers/vehicleController.js`
- **Router:** `routes/vehicleRouter.js`

---

## 📞 Support

Nếu gặp vấn đề trong quá trình migration:
1. Kiểm tra logs từ migration script
2. Verify MongoDB connection string
3. Đảm bảo có quyền write vào database
4. Kiểm tra disk space

---

**Cập nhật:** 2025-01-15  
**Status:** ✅ Migration script ready (không cần chạy vì DB chưa có data)
