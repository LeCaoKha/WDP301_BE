# 🧪 TEST INVOICE API

## 📋 Chuẩn bị

### 1. Start server
```bash
npm start
```

### 2. Truy cập Swagger UI
```
http://localhost:5000/api-docs
```
Tìm section **Invoices** để test trực tiếp trên Swagger UI

---

## 🔧 Test bằng cURL / Postman

### ✅ 1. Get All Invoices (Admin)

**Request:**
```bash
GET http://localhost:5000/api/invoices?page=1&limit=10
```

**cURL:**
```bash
curl -X GET "http://localhost:5000/api/invoices?page=1&limit=10"
```

**Filter by payment status:**
```bash
curl -X GET "http://localhost:5000/api/invoices?payment_status=unpaid"
```

**Filter by user:**
```bash
curl -X GET "http://localhost:5000/api/invoices?user_id=672345abc123"
```

**Expected Response:**
```json
{
  "invoices": [
    {
      "_id": "672345...",
      "user_id": {...},
      "station_id": {...},
      "total_amount": 118000,
      "payment_status": "unpaid",
      ...
    }
  ],
  "statistics": {
    "total_revenue": 1500000,
    "total_energy": 450.5,
    "count": 15
  },
  "pagination": {
    "currentPage": 1,
    "totalPages": 2,
    "totalItems": 15,
    "itemsPerPage": 10
  }
}
```

---

### ✅ 2. Get User's Invoices

**Request:**
```bash
GET http://localhost:5000/api/invoices/user/{user_id}?page=1&limit=10
```

**cURL:**
```bash
curl -X GET "http://localhost:5000/api/invoices/user/672345abc123?page=1&limit=10"
```

**Filter by payment status:**
```bash
curl -X GET "http://localhost:5000/api/invoices/user/672345abc123?payment_status=paid"
```

**Expected Response:**
```json
{
  "invoices": [
    {
      "id": "672345...",
      "created_at": "2025-11-04T08:30:00.000Z",
      "station": "Trạm sạc A",
      "address": "123 Nguyễn Huệ",
      "vehicle": "Tesla Model 3 - 30A-12345",
      "start_time": "2025-11-04T07:42:00.000Z",
      "end_time": "2025-11-04T08:30:00.000Z",
      "duration": "0h 48m",
      "energy_delivered": "36.00 kWh",
      "battery_charged": "60%",
      "total_amount": "118,000 VND",
      "payment_status": "unpaid",
      "payment_method": null,
      "payment_date": null
    }
  ],
  "summary": {
    "total_invoices": 5,
    "unpaid": {
      "count": 2,
      "total_amount": "250,000 VND",
      "total_energy": "75.50 kWh"
    },
    "paid": {
      "count": 3,
      "total_amount": "380,000 VND",
      "total_energy": "120.30 kWh"
    }
  },
  "pagination": {...}
}
```

---

### ✅ 3. Get User's Unpaid Invoices

**Request:**
```bash
GET http://localhost:5000/api/invoices/user/{user_id}/unpaid
```

**cURL:**
```bash
curl -X GET "http://localhost:5000/api/invoices/user/672345abc123/unpaid"
```

**Expected Response:**
```json
{
  "unpaid_invoices": [
    {
      "id": "672345...",
      "created_at": "2025-11-04T08:30:00.000Z",
      "station": "Trạm sạc A",
      "vehicle": "Tesla Model 3 - 30A-12345",
      "energy_delivered": "36.00 kWh",
      "total_amount": "118,000 VND",
      "duration": "0h 48m"
    },
    {
      "id": "672346...",
      "created_at": "2025-11-03T15:20:00.000Z",
      "station": "Trạm sạc B",
      "vehicle": "VinFast VF8 - 51F-67890",
      "energy_delivered": "28.50 kWh",
      "total_amount": "95,500 VND",
      "duration": "0h 35m"
    }
  ],
  "summary": {
    "count": 2,
    "total_unpaid": 213500,
    "total_unpaid_formatted": "213,500 VND"
  }
}
```

---

### ✅ 4. Get Invoice Detail

**Request:**
```bash
GET http://localhost:5000/api/invoices/{invoice_id}
```

**cURL:**
```bash
curl -X GET "http://localhost:5000/api/invoices/672345abc123"
```

**Expected Response:**
```json
{
  "invoice_info": {
    "id": "672345...",
    "created_at": "2025-11-04T08:30:00.000Z",
    "updated_at": "2025-11-04T08:30:00.000Z"
  },
  "user_info": {
    "id": "abc123...",
    "username": "john_doe",
    "email": "john@example.com",
    "phone": "0123456789"
  },
  "station_info": {
    "id": "station123...",
    "name": "Trạm sạc A",
    "address": "123 Nguyễn Huệ, Q1, TP.HCM",
    "charging_point": "CP-01",
    "connector_type": "CCS2"
  },
  "vehicle_info": {
    "id": "vehicle123...",
    "model": "Tesla Model 3",
    "plate_number": "30A-12345",
    "battery_capacity": "60 kWh"
  },
  "charging_session": {
    "session_id": "session123...",
    "booking_id": "booking123...",
    "start_time": "2025-11-04T07:42:00.000Z",
    "end_time": "2025-11-04T08:30:00.000Z",
    "duration": "0h 48m",
    "duration_minutes": 48,
    "duration_hours": 0.8,
    "initial_battery": "20%",
    "final_battery": "80%",
    "target_battery": "80%",
    "battery_charged": "60%",
    "target_reached": true,
    "power_capacity": "50 kW",
    "energy_delivered": "36.00 kWh",
    "charging_efficiency": "90%",
    "calculation_method": "time_based"
  },
  "pricing": {
    "base_fee": 10000,
    "base_fee_formatted": "10,000 VND",
    "price_per_kwh": 3000,
    "price_per_kwh_formatted": "3,000 VND/kWh",
    "charging_fee": 108000,
    "charging_fee_formatted": "108,000 VND",
    "total_amount": 118000,
    "total_amount_formatted": "118,000 VND",
    "breakdown": "10,000 VND (phí cơ bản) + 36.00 kWh × 3,000 VND/kWh = 118,000 VND"
  },
  "payment": {
    "status": "unpaid",
    "method": null,
    "payment_date": null,
    "transaction_id": null
  },
  "notes": null
}
```

---

### ✅ 5. Update Payment Status

**Request:**
```bash
PATCH http://localhost:5000/api/invoices/{invoice_id}/payment
```

**cURL - Mark as Paid:**
```bash
curl -X PATCH "http://localhost:5000/api/invoices/672345abc123/payment" \
  -H "Content-Type: application/json" \
  -d '{
    "payment_status": "paid",
    "payment_method": "vnpay",
    "transaction_id": "VNPAY20251104123456",
    "notes": "Thanh toán thành công qua VNPay"
  }'
```

**cURL - Mark as Refunded:**
```bash
curl -X PATCH "http://localhost:5000/api/invoices/672345abc123/payment" \
  -H "Content-Type: application/json" \
  -d '{
    "payment_status": "refunded",
    "payment_method": "vnpay",
    "transaction_id": "VNPAY20251104123456",
    "notes": "Hoàn tiền do hủy booking"
  }'
```

**Expected Response (Success):**
```json
{
  "message": "Payment status updated successfully",
  "invoice": {
    "id": "672345abc123",
    "payment_status": "paid",
    "payment_method": "vnpay",
    "payment_date": "2025-11-04T09:00:00.000Z",
    "transaction_id": "VNPAY20251104123456",
    "total_amount": "118,000 VND"
  }
}
```

**Expected Response (Invalid Payment Method):**
```json
{
  "message": "Invalid payment method. Only VNPay is supported.",
  "valid_method": "vnpay"
}
```

**Expected Response (Invalid Status):**
```json
{
  "message": "Invalid payment status",
  "valid_statuses": ["unpaid", "paid", "refunded", "cancelled"]
}
```

**Expected Response (Not Found):**
```json
{
  "message": "Invoice not found"
}
```

---

## 📊 Test Scenarios

### Scenario 1: User xem lịch sử thanh toán
1. ✅ Get user's invoices: `/api/invoices/user/{user_id}`
2. ✅ Get invoice detail: `/api/invoices/{invoice_id}`

### Scenario 2: User xem hóa đơn chưa thanh toán
1. ✅ Get unpaid invoices: `/api/invoices/user/{user_id}/unpaid`
2. ✅ View total unpaid amount

### Scenario 3: User thanh toán qua VNPay
1. ✅ User chọn invoice cần thanh toán
2. ✅ Redirect đến VNPay gateway
3. ✅ VNPay callback về server
4. ✅ Update payment status: `PATCH /api/invoices/{invoice_id}/payment`
```json
{
  "payment_status": "paid",
  "payment_method": "vnpay",
  "transaction_id": "VNPAY123456789"
}
```

### Scenario 4: Admin xem tổng doanh thu
1. ✅ Get all invoices: `/api/invoices?payment_status=paid`
2. ✅ View statistics: `total_revenue`, `total_energy`

### Scenario 5: Admin hoàn tiền cho user
1. ✅ Update payment status: `PATCH /api/invoices/{invoice_id}/payment`
```json
{
  "payment_status": "refunded",
  "notes": "Hoàn tiền do lỗi hệ thống"
}
```

---

## 🎯 Postman Collection

Import vào Postman để test nhanh:

```json
{
  "info": {
    "name": "EV Driver - Invoice API",
    "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
  },
  "item": [
    {
      "name": "Get All Invoices",
      "request": {
        "method": "GET",
        "url": "http://localhost:5000/api/invoices?page=1&limit=10"
      }
    },
    {
      "name": "Get User Invoices",
      "request": {
        "method": "GET",
        "url": "http://localhost:5000/api/invoices/user/{{user_id}}?page=1&limit=10"
      }
    },
    {
      "name": "Get Unpaid Invoices",
      "request": {
        "method": "GET",
        "url": "http://localhost:5000/api/invoices/user/{{user_id}}/unpaid"
      }
    },
    {
      "name": "Get Invoice Detail",
      "request": {
        "method": "GET",
        "url": "http://localhost:5000/api/invoices/{{invoice_id}}"
      }
    },
    {
      "name": "Update Payment Status",
      "request": {
        "method": "PATCH",
        "url": "http://localhost:5000/api/invoices/{{invoice_id}}/payment",
        "header": [
          {
            "key": "Content-Type",
            "value": "application/json"
          }
        ],
        "body": {
          "mode": "raw",
          "raw": "{\n  \"payment_status\": \"paid\",\n  \"payment_method\": \"vnpay\",\n  \"transaction_id\": \"VNPAY123456789\",\n  \"notes\": \"Thanh toán thành công\"\n}"
        }
      }
    }
  ]
}
```

---

## ✅ Checklist Test

- [ ] Start server thành công
- [ ] Truy cập Swagger UI được
- [ ] GET all invoices trả về data đúng
- [ ] GET user invoices với pagination
- [ ] GET unpaid invoices hiển thị tổng tiền
- [ ] GET invoice detail đầy đủ thông tin
- [ ] PATCH payment status thành công
- [ ] PATCH với payment_method != vnpay bị reject
- [ ] PATCH với invalid status bị reject
- [ ] Filter by payment_status hoạt động
- [ ] Filter by user_id hoạt động
- [ ] Pagination hoạt động đúng

---

## 🚀 Quick Start

```bash
# 1. Start server
npm start

# 2. Test get invoices
curl http://localhost:5000/api/invoices

# 3. Test get user's invoices (thay {user_id} thực tế)
curl http://localhost:5000/api/invoices/user/672345abc123

# 4. Test update payment
curl -X PATCH http://localhost:5000/api/invoices/{invoice_id}/payment \
  -H "Content-Type: application/json" \
  -d '{"payment_status":"paid","payment_method":"vnpay","transaction_id":"VNPAY123"}'
```

---

## 📝 Notes

- **Invoice tự động tạo** sau khi `endSession` thành công
- **Payment method chỉ hỗ trợ VNPay**
- **Payment status**: unpaid → paid/refunded/cancelled
- **Transaction ID** từ VNPay callback
- **Pagination** mặc định: page=1, limit=10
