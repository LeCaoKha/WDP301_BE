# 📤 Hướng Dẫn Upload Ảnh với Postman - API Create Report

## ❌ Vấn Đề Thường Gặp

Khi test API `POST /api/staff/reports` trên Postman, request thành công nhưng **không upload được ảnh lên Cloudinary**.

## ✅ Nguyên Nhân

API sử dụng **Multer** middleware với field name là `images`. Nếu Postman không gửi đúng format, files sẽ không được parse.

## 🔧 Cách Fix - Cấu Hình Postman Đúng

### **Bước 1: Setup Request**

1. **Method**: Chọn `POST`
2. **URL**: `http://localhost:5000/api/staff/reports` (hoặc URL server của bạn)
3. **Headers**: 
   - `Authorization: Bearer YOUR_JWT_TOKEN` (Bắt buộc)
   - **KHÔNG** cần set `Content-Type` manually - Postman sẽ tự động set khi chọn form-data

### **Bước 2: Cấu Hình Body (QUAN TRỌNG)**

1. **Chọn tab "Body"**
2. **Chọn "form-data"** (KHÔNG phải `raw` hay `x-www-form-urlencoded`)
3. **Thêm các fields:**

| Key | Type | Value | Ghi Chú |
|-----|------|-------|---------|
| `title` | Text | "Báo cáo sự cố..." | Bắt buộc |
| `content` | Text | "Station ABC bị lỗi..." | Bắt buộc |
| `images` | **File** | [Chọn file 1] | Field name PHẢI là `images` |
| `images` | **File** | [Chọn file 2] | Có thể thêm nhiều field `images` |
| `images` | **File** | [Chọn file 3] | Tối đa 10 files |

### **Bước 3: Upload Nhiều Ảnh**

Để upload nhiều ảnh:
- Thêm **NHIỀU fields** với cùng Key = `images`
- Mỗi field chọn Type = `File`
- Chọn file khác nhau cho mỗi field

**Lưu ý**: 
- ✅ Field name PHẢI là `images` (chính xác, không có s hay số)
- ✅ Type PHẢI là `File` (không phải Text)
- ✅ Phải chọn `form-data` (không phải raw)

## 📸 Hình Ảnh Minh Họa

### **Đúng:**
```
Body → form-data
├── title (Text) = "Báo cáo sự cố"
├── content (Text) = "Mô tả chi tiết..."
├── images (File) = [Select Files] → Untitled.png
├── images (File) = [Select Files] → Tung.jpg
└── images (File) = [Select Files] → Image3.png
```

### **Sai:**
```
❌ Body → raw → JSON
❌ Body → x-www-form-urlencoded
❌ Field name = "image" (thiếu s)
❌ Field name = "files"
❌ Type = Text thay vì File
```

## 🧪 Test Request

### **Request Example:**
```http
POST /api/staff/reports
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

Content-Type: multipart/form-data

Body (form-data):
- title: "Báo cáo sự cố hệ thống charging"
- content: "Station ABC bị lỗi không sạc được..."
- images: [File: Untitled.png]
- images: [File: Tung.jpg]
```

### **Expected Response:**
```json
{
  "message": "Tạo report thành công",
  "report": {
    "_id": "...",
    "title": "Báo cáo sự cố...",
    "content": "Station ABC...",
    "images": [
      {
        "imageUrl": "https://res.cloudinary.com/.../staff_reports/...",
        "imagePublicId": "staff_reports/..."
      }
    ],
    "status": "pending"
  },
  "imagesUploaded": 2
}
```

## 🐛 Debug - Kiểm Tra Logs

Sau khi tôi cập nhật code, server sẽ log chi tiết:

```bash
=== CREATE REPORT DEBUG ===
req.body: { title: '...', content: '...' }
req.files: [
  { fieldname: 'images', originalname: 'Untitled.png', path: 'uploads/images-...' },
  { fieldname: 'images', originalname: 'Tung.jpg', path: 'uploads/images-...' }
]
Content-Type: multipart/form-data; boundary=----WebKitFormBoundary...
Found 2 file(s) to upload
Uploading file: Untitled.png from path: uploads/images-...
Uploaded successfully: https://res.cloudinary.com/...
```

**Nếu không thấy files:**
```bash
⚠️ No files found in req.files
💡 HINT: In Postman, make sure to:
   1. Select 'Body' tab
   2. Select 'form-data' (NOT raw or x-www-form-urlencoded)
   3. Add field with Key = 'images' and Type = 'File'
   4. For multiple images, add multiple 'images' fields
```

## ✅ Checklist

Trước khi test, đảm bảo:

- [ ] Method là `POST`
- [ ] URL đúng: `/api/staff/reports`
- [ ] Có header `Authorization: Bearer <token>`
- [ ] Body tab → Chọn `form-data` (KHÔNG phải raw)
- [ ] Field `title` (Type: Text)
- [ ] Field `content` (Type: Text)
- [ ] Field `images` (Type: **File**) - PHẢI là `images` không phải `image`
- [ ] Đã chọn file thực tế cho field `images`
- [ ] Nếu upload nhiều ảnh: thêm nhiều field `images` (cùng tên)

## 🔍 So Sánh Swagger vs Postman

| Tính Năng | Swagger | Postman |
|-----------|---------|---------|
| **Format** | Tự động dùng `multipart/form-data` | Cần chọn thủ công `form-data` |
| **Field Name** | Tự động map từ schema | Phải nhập đúng `images` |
| **File Upload** | UI có button "Choose File" | Phải chọn Type = File |
| **Multiple Files** | Có thể chọn nhiều files cùng lúc | Phải tạo nhiều fields `images` |

## 💡 Tips

1. **Kiểm tra Console Logs**: Server sẽ log chi tiết nếu có vấn đề
2. **Test với 1 ảnh trước**: Đảm bảo cấu hình đúng trước khi test nhiều ảnh
3. **Kiểm tra Token**: Đảm bảo JWT token còn hợp lệ và có role `staff` hoặc `admin`
4. **File Size**: Tối đa 5MB mỗi file
5. **File Types**: Chỉ chấp nhận: jpeg, jpg, png, gif, webp

## 🚨 Common Errors

### **Error: "Title và content là bắt buộc"**
→ Kiểm tra: Field `title` và `content` có giá trị không

### **Error: "No files found in req.files"**
→ Kiểm tra: 
- Đã chọn `form-data` chưa?
- Field name có đúng là `images` không?
- Type có phải là `File` không?

### **Error: "Chỉ chấp nhận file ảnh"**
→ Kiểm tra: File có đúng định dạng jpeg/jpg/png/gif/webp không?

### **Error: "File quá lớn"**
→ File vượt quá 5MB, cần compress hoặc resize

---

✅ **Sau khi fix, restart server và test lại!**

