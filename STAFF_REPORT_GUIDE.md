# Hướng Dẫn Sử Dụng Staff Report API

## Cấu Hình Cloudinary

Để sử dụng tính năng upload ảnh, bạn cần cấu hình Cloudinary trong file `.env`:

```env
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret
```

### Lấy thông tin Cloudinary:

1. Đăng ký tài khoản tại: https://cloudinary.com/
2. Vào Dashboard để lấy Cloud Name, API Key, và API Secret
3. Thêm vào file `.env` của bạn

## Endpoints

### 1. Tạo Report Mới (POST /api/staff/reports)

**Headers:**

- `Authorization: Bearer <token>`

**Body (multipart/form-data):**

- `title` (string, required): Tiêu đề report
- `content` (string, required): Nội dung report
- `images` (file[], optional): Nhiều file ảnh (tối đa 10 ảnh, mỗi ảnh 5MB)

**Ví dụ với Postman:**

1. Chọn method: POST
2. URL: `http://localhost:5000/api/staff/reports`
3. Headers: `Authorization: Bearer <your-token>`
4. Body → form-data:
   - `title`: "Báo cáo sự cố hệ thống"
   - `content`: "Hệ thống charging point bị lỗi..."
   - `images`: [Chọn file 1]
   - `images`: [Chọn file 2]
   - `images`: [Chọn file 3]

**Response:**

```json
{
  "message": "Tạo report thành công",
  "report": {
    "_id": "...",
    "title": "Báo cáo sự cố hệ thống",
    "content": "Hệ thống charging point bị lỗi...",
    "userId": { ... },
    "images": [
      {
        "imageUrl": "https://res.cloudinary.com/...",
        "imagePublicId": "staff_reports/..."
      },
      ...
    ],
    "status": "pending",
    "createdAt": "2025-10-29T...",
    "updatedAt": "2025-10-29T..."
  }
}
```

### 2. Lấy Tất Cả Reports (GET /api/staff/reports)

**Headers:**

- `Authorization: Bearer <token>`

**Query Parameters:**

- `status` (optional): pending, processing, resolved, rejected
- `userId` (optional): Lọc theo user ID

**Ví dụ:**

```
GET /api/staff/reports?status=pending
GET /api/staff/reports?userId=6720...
```

### 3. Lấy Reports Của Tôi (GET /api/staff/reports/my)

**Headers:**

- `Authorization: Bearer <token>`

**Response:**

```json
{
  "total": 5,
  "reports": [...]
}
```

### 4. Lấy Report Theo ID (GET /api/staff/reports/:id)

**Headers:**

- `Authorization: Bearer <token>`

**Ví dụ:**

```
GET /api/staff/reports/6720abc123def456
```

### 5. Cập Nhật Report (PUT /api/staff/reports/:id)

**Headers:**

- `Authorization: Bearer <token>`

**Body (multipart/form-data):**

- `title` (string, optional): Tiêu đề mới
- `content` (string, optional): Nội dung mới
- `status` (string, optional - chỉ admin): pending, processing, resolved, rejected
- `removeImageIds` (array, optional): Danh sách imagePublicId cần xóa
- `images` (file[], optional): Ảnh mới cần thêm

**Ví dụ xóa ảnh cũ và thêm ảnh mới:**

1. Body → form-data:
   - `title`: "Báo cáo cập nhật"
   - `removeImageIds[]`: "staff_reports/abc123"
   - `removeImageIds[]`: "staff_reports/def456"
   - `images`: [Chọn file mới 1]
   - `images`: [Chọn file mới 2]

### 6. Xóa Report (DELETE /api/staff/reports/:id)

**Headers:**

- `Authorization: Bearer <token>`

**Note:** Tất cả ảnh trên Cloudinary sẽ được xóa tự động

### 7. Cập Nhật Status (PATCH /api/staff/reports/:id/status) - Chỉ Admin

**Headers:**

- `Authorization: Bearer <token>`

**Body (application/json):**

```json
{
  "status": "resolved"
}
```

## Quyền Truy Cập

- **Staff & Admin:** Có thể tạo, xem, và quản lý reports
- **Chỉ người tạo hoặc Admin:** Có thể cập nhật và xóa report
- **Chỉ Admin:** Có thể thay đổi status của report

## Giới Hạn Upload

- **Số lượng ảnh:** Tối đa 10 ảnh/lần
- **Kích thước:** Mỗi ảnh tối đa 5MB
- **Định dạng:** jpeg, jpg, png, gif, webp

## Lưu Ý

1. File ảnh được lưu tạm trong thư mục `uploads/` trước khi upload lên Cloudinary
2. Sau khi upload thành công, file tạm sẽ được giữ lại (có thể xóa thủ công nếu cần)
3. Khi xóa hoặc cập nhật report, ảnh cũ trên Cloudinary sẽ được xóa tự động
4. Nếu upload thất bại giữa chừng, các ảnh đã upload sẽ được cleanup tự động

## Test với cURL

### Tạo report với nhiều ảnh:

```bash
curl -X POST http://localhost:5000/api/staff/reports \
  -H "Authorization: Bearer <your-token>" \
  -F "title=Báo cáo sự cố" \
  -F "content=Mô tả chi tiết..." \
  -F "images=@/path/to/image1.jpg" \
  -F "images=@/path/to/image2.jpg" \
  -F "images=@/path/to/image3.jpg"
```

### Cập nhật report:

```bash
curl -X PUT http://localhost:5000/api/staff/reports/<report-id> \
  -H "Authorization: Bearer <your-token>" \
  -F "title=Tiêu đề cập nhật" \
  -F "removeImageIds[]=staff_reports/old_image_id" \
  -F "images=@/path/to/new_image.jpg"
```
