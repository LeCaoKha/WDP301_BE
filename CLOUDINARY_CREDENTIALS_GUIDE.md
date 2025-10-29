# Hướng Dẫn Lấy Cloudinary Credentials

## 📍 Bước 1: Truy Cập Cloudinary Dashboard

1. Đăng nhập vào: https://cloudinary.com/
2. Sau khi đăng nhập, bạn sẽ thấy **Dashboard**

## 📋 Bước 2: Lấy Thông Tin

Tại trang Dashboard, bạn sẽ thấy phần **Account Details** với:

```
Cloud name:     dejilsup7
API Key:        123456789012345
API Secret:     **************** (click để xem)
```

### Chi tiết:

#### 🌐 Cloud Name

- Hiển thị ngay trên Dashboard
- Ví dụ: `dejilsup7`
- **Copy** và dán vào `.env`:
  ```env
  CLOUDINARY_CLOUD_NAME=dejilsup7
  ```

#### 🔑 API Key

- Hiển thị ngay dưới Cloud Name
- Ví dụ: `123456789012345`
- **Copy** và dán vào `.env`:
  ```env
  CLOUDINARY_API_KEY=123456789012345
  ```

#### 🔒 API Secret

- Mặc định bị ẩn (`****************`)
- Click vào icon **"eye"** hoặc text để hiển thị
- Ví dụ: `abcXYZ123_secretKey`
- **Copy** và dán vào `.env`:
  ```env
  CLOUDINARY_API_SECRET=abcXYZ123_secretKey
  ```

---

## ⚖️ Sự Khác Biệt: Upload Preset vs API Secret

### 🎯 Cách 1: Upload từ Frontend (Unsigned - Upload Preset)

**Ví dụ code của bạn:**

```javascript
const formData = new FormData();
formData.append("file", file);
formData.append("upload_preset", "SDN_Blog"); // ← Upload Preset
formData.append("cloud_name", "dejilsup7");

fetch("https://api.cloudinary.com/v1_1/dejilsup7/image/upload", {
  method: "POST",
  body: formData,
});
```

**Đặc điểm:**

- ✅ Upload trực tiếp từ browser/frontend
- ✅ Không cần API Secret
- ✅ Sử dụng **Upload Preset** (cấu hình sẵn)
- ❌ Ít kiểm soát bảo mật hơn
- ❌ Bất kỳ ai có preset name đều upload được

**Cách tạo Upload Preset:**

1. Vào Dashboard → Settings → Upload
2. Scroll xuống **Upload presets**
3. Click **Add upload preset**
4. Đặt tên (VD: `SDN_Blog`)
5. Chọn **Signing Mode**: `Unsigned`
6. Save

---

### 🎯 Cách 2: Upload qua Backend (Signed - API Secret)

**Ví dụ trong hệ thống vừa tạo:**

**Backend (Node.js):**

```javascript
const cloudinary = require("cloudinary").v2;

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET, // ← Bảo mật
});

// Upload
const result = await cloudinary.uploader.upload(file.path, {
  folder: "staff_reports",
});
```

**Frontend:**

```javascript
const formData = new FormData();
formData.append("images", file1);
formData.append("images", file2);
formData.append("title", "Report title");
formData.append("content", "Report content");

// Gửi lên backend của bạn (KHÔNG phải Cloudinary trực tiếp)
fetch("http://localhost:5000/api/staff/reports", {
  method: "POST",
  headers: {
    Authorization: `Bearer ${token}`,
  },
  body: formData,
});
```

**Đặc điểm:**

- ✅ **Bảo mật cao hơn** - API Secret ở server
- ✅ **Kiểm soát đầy đủ** - validate, resize, watermark...
- ✅ **Phân quyền** - chỉ user đăng nhập mới upload
- ✅ **Quản lý tốt hơn** - lưu DB, theo dõi ai upload gì
- ❌ Phức tạp hơn (cần backend)
- ❌ File đi qua 2 server (frontend → backend → Cloudinary)

---

## 🔐 File .env Hoàn Chỉnh

```env
# Database
MONGODB_URI=mongodb://localhost:27017/evdriver

# JWT
JWT_SECRET=your-secret-key-here
JWT_REFRESH_SECRET=your-refresh-secret-key-here
JWT_EXPIRES_IN=1h
JWT_REFRESH_EXPIRES_IN=7d

# Server
PORT=5000

# Cloudinary - Lấy từ Dashboard
CLOUDINARY_CLOUD_NAME=dejilsup7
CLOUDINARY_API_KEY=123456789012345
CLOUDINARY_API_SECRET=abcXYZ123_secretKey

# VNPay
VNPAY_TMN_CODE=your-vnpay-tmn-code
VNPAY_HASH_SECRET=your-vnpay-hash-secret
VNPAY_URL=https://sandbox.vnpayment.vn/paymentv2/vpcpay.html
VNPAY_RETURN_URL=http://localhost:5000/api/payment/vnpay_return
```

---

## ✅ Checklist Cấu Hình

- [ ] Đăng ký/Đăng nhập Cloudinary
- [ ] Copy **Cloud Name** từ Dashboard
- [ ] Copy **API Key** từ Dashboard
- [ ] Click hiển thị và copy **API Secret**
- [ ] Tạo file `.env` trong project
- [ ] Paste 3 giá trị vào `.env`
- [ ] Restart server
- [ ] Test upload qua API `/api/staff/reports`

---

## 🚨 Lưu Ý Bảo Mật

1. ❌ **KHÔNG BAO GIỜ** commit file `.env` lên Git
2. ❌ **KHÔNG BAO GIỜ** để API Secret trong code frontend
3. ✅ Thêm `.env` vào `.gitignore` (đã làm)
4. ✅ Tạo `.env.example` với giá trị mẫu (không có giá trị thật)
5. ✅ Sử dụng `process.env.CLOUDINARY_API_SECRET` trong code

---

## 🆚 Nên Dùng Cách Nào?

### Dùng Upload Preset (Frontend) khi:

- Demo/Prototype nhanh
- App đơn giản không cần phân quyền
- Chấp nhận rủi ro bảo mật thấp

### Dùng API Secret (Backend) khi: ✅ **KHUYẾN NGHỊ**

- App production/thực tế
- Cần phân quyền user
- Cần kiểm soát ai upload gì
- Cần validate/transform ảnh trước khi lưu
- **→ ĐÂY LÀ CÁCH HỆ THỐNG STAFF REPORT ĐANG DÙNG**

---

## 📞 Support

Nếu gặp vấn đề:

- Cloudinary Docs: https://cloudinary.com/documentation
- Dashboard: https://cloudinary.com/console
- Support: https://support.cloudinary.com/
