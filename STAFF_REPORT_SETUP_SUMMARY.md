# Tóm Tắt Cài Đặt Staff Report System

## ✅ Đã Hoàn Thành

### 1. Model

- **`models/StaffReport.js`**: Model MongoDB cho staff reports
  - `title`: Tiêu đề report (bắt buộc)
  - `content`: Nội dung report (bắt buộc)
  - `userId`: ID người tạo (tự động lấy từ JWT)
  - `images`: Mảng chứa nhiều ảnh (imageUrl, imagePublicId)
  - `status`: pending, processing, resolved, rejected

### 2. Controller

- **`controllers/staffController.js`**: Đầy đủ CRUD operations
  - ✅ `createReport`: Tạo report mới với nhiều ảnh
  - ✅ `getAllReports`: Lấy tất cả reports (có filter)
  - ✅ `getMyReports`: Lấy reports của user hiện tại
  - ✅ `getReportById`: Lấy report theo ID
  - ✅ `updateReport`: Cập nhật report (thêm/xóa ảnh)
  - ✅ `deleteReport`: Xóa report và tất cả ảnh
  - ✅ `updateReportStatus`: Admin cập nhật status

### 3. Routes

- **`routes/staffRouter.js`**: API endpoints với Swagger docs
  - `POST /api/staff/reports` - Tạo report (staff, admin)
  - `GET /api/staff/reports` - Lấy tất cả reports
  - `GET /api/staff/reports/my` - Lấy reports của tôi
  - `GET /api/staff/reports/:id` - Lấy 1 report
  - `PUT /api/staff/reports/:id` - Cập nhật report
  - `DELETE /api/staff/reports/:id` - Xóa report
  - `PATCH /api/staff/reports/:id/status` - Cập nhật status (admin only)

### 4. Middleware

- **`middleware/uploadImage.js`**: Xử lý upload nhiều ảnh

  - Giới hạn: 10 ảnh/lần, mỗi ảnh 5MB
  - Định dạng: jpeg, jpg, png, gif, webp
  - Error handling cho Multer

- **`middleware/auth.js`**: Cập nhật thêm
  - `verifyToken`: Xác thực JWT
  - `checkRole`: Kiểm tra quyền truy cập

### 5. Configuration

- **`config/cloudinary.js`**: Cấu hình Cloudinary
- **`app.js`**: Đã thêm staffRouter vào ứng dụng

### 6. Dependencies

- ✅ `cloudinary`: Đã cài đặt thành công

### 7. Documentation

- **`STAFF_REPORT_GUIDE.md`**: Hướng dẫn chi tiết cách sử dụng API
- **`uploads/`**: Thư mục lưu file tạm (đã thêm vào .gitignore)

## 🔧 Cấu Hình Cần Thiết

Thêm vào file `.env`:

```env
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret
```

### Cách lấy thông tin Cloudinary:

1. Đăng ký tại: https://cloudinary.com/
2. Vào Dashboard
3. Copy Cloud Name, API Key, API Secret
4. Paste vào file `.env`

## 📝 Cách Sử Dụng

### Tạo Report với Nhiều Ảnh (Postman):

1. **Method**: POST
2. **URL**: `http://localhost:5000/api/staff/reports`
3. **Headers**:
   - `Authorization: Bearer <your-jwt-token>`
4. **Body** (form-data):
   - `title`: "Báo cáo sự cố"
   - `content`: "Mô tả chi tiết..."
   - `images`: [File 1]
   - `images`: [File 2]
   - `images`: [File 3]
   - ... (tối đa 10 files)

### Cập Nhật Report (thêm ảnh mới, xóa ảnh cũ):

1. **Method**: PUT
2. **URL**: `http://localhost:5000/api/staff/reports/<report-id>`
3. **Body** (form-data):
   - `title`: "Tiêu đề mới" (optional)
   - `content`: "Nội dung mới" (optional)
   - `removeImageIds[]`: "staff_reports/abc123" (ảnh cũ cần xóa)
   - `removeImageIds[]`: "staff_reports/def456"
   - `images`: [File mới 1]
   - `images`: [File mới 2]

## 🎯 Tính Năng Chính

1. ✅ **Upload nhiều ảnh cùng lúc** (tối đa 10)
2. ✅ **Tự động upload lên Cloudinary**
3. ✅ **Xóa ảnh tự động** khi update/delete report
4. ✅ **Cleanup tự động** nếu upload thất bại
5. ✅ **Phân quyền**: Staff và Admin
6. ✅ **Filter reports** theo status và userId
7. ✅ **Swagger documentation** đầy đủ

## 🔒 Bảo Mật & Quyền

- **Staff & Admin**: Tạo, xem reports
- **Chỉ người tạo hoặc Admin**: Sửa, xóa report
- **Chỉ Admin**: Thay đổi status

## 📚 Đọc Thêm

Xem file `STAFF_REPORT_GUIDE.md` để biết hướng dẫn chi tiết và ví dụ cURL.

## 🚀 Khởi Động

```bash
# Cài đặt dependencies (nếu chưa)
npm install

# Chạy server
npm start

# Hoặc development mode
npm run dev
```

API sẽ chạy tại: `http://localhost:5000`

Swagger docs: `http://localhost:5000/api-docs`
