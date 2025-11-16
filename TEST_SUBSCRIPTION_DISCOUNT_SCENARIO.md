# Kịch Bản Test: Subscription Discount cho Invoice

## Mục đích
Kiểm tra logic tính tiền invoice có áp dụng discount từ subscription hay không.

---

## Prerequisites (Dữ liệu cần chuẩn bị)

### 1. Tạo User
```json
POST /api/accounts/register
{
  "username": "testuser",
  "email": "testuser@example.com",
  "password": "password123",
  "role": "user"
}
```
Lưu lại `user_id`

### 2. Tạo Station
```json
POST /api/stations
{
  "name": "Test Station",
  "address": "123 Test Street",
  "latitude": 10.7769,
  "longitude": 106.7009,
  "connector_type": "DC",
  "power_capacity": 50,
  "price_per_kwh": 3000,
  "base_fee": 10000
}
```
Lưu lại `station_id`

### 3. Tạo Charging Point (Offline)
```json
POST /api/charging-point
{
  "stationId": "<station_id>",
  "type": "offline"
}
```
Lưu lại `chargingPoint_id`

### 4. Tạo Vehicle
```json
POST /api/vehicles
{
  "user_id": "<user_id>",
  "plate_number": "TEST-12345",
  "model": "Tesla Model 3",
  "batteryCapacity": 75
}
```
Lưu lại `vehicle_id` - LƯU Ý: KHÔNG có `vehicle_subscription_id` lúc này

---

## Test Case 1: Invoice KHÔNG có Subscription (Tính tiền bình thường)

### Bước 1: Tạo Direct Charging Session
```json
POST /api/charging-sessions/start-direct
{
  "user_id": "<user_id>",
  "vehicle_id": "<vehicle_id>",
  "chargingPoint_id": "<chargingPoint_id>",
  "initial_battery_percentage": 30,
  "target_battery_percentage": 80
}
```
Lưu lại `session_id`

### Bước 2: End Session
```json
POST /api/charging-sessions/<session_id>/end
{
  "final_battery_percentage": 80
}
```

### Kết quả mong đợi:
```json
{
  "message": "Charging session ended successfully",
  "fee_calculation": {
    "base_fee": 10000,
    "price_per_kwh": 3000,
    "energy_charged": "37.50 kWh",
    "charging_fee": 112500,
    "original_amount": 122500,
    "total_amount": 122500,  // ✅ KHÔNG CÓ DISCOUNT
    "breakdown": "10,000 đ (phí cơ bản) + 37.50 kWh × 3,000 đ/kWh = 122,500 đ"
    // ✅ KHÔNG CÓ subscription_discount field
  }
}
```

### Bước 3: Kiểm tra Invoice Detail
```json
GET /api/invoices/<invoice_id>
```

### Kết quả mong đợi:
```json
{
  "pricing": {
    "base_fee": 10000,
    "charging_fee": 112500,
    "original_amount": 122500,
    "total_amount": 122500,  // ✅ KHÔNG CÓ DISCOUNT
    "breakdown": "10,000 đ (phí cơ bản) + 37.50 kWh × 3,000 đ/kWh = 122,500 đ"
    // ✅ KHÔNG CÓ subscription_discount field
  }
}
```

---

## Test Case 2: Invoice CÓ Subscription (Áp dụng discount 15%)

### Bước 1: Tạo Subscription Plan
```json
POST /api/subscription-plans
{
  "type": "prepaid",
  "name": "Premium Plan",
  "price": 500000,
  "billing_cycle": "1 month",
  "description": "Premium subscription with 15% discount",
  "discount": "15%",
  "is_active": true
}
```
Lưu lại `subscription_plan_id`

### Bước 2: Tạo Vehicle Subscription
```json
POST /api/vehicle-subscriptions
{
  "vehicle_id": "<vehicle_id>",
  "subscription_id": "<subscription_plan_id>",
  "auto_renew": false,
  "payment_status": "paid"
}
```
Lưu lại `vehicle_subscription_id`

### Bước 3: Cập nhật Vehicle với Subscription
```json
PATCH /api/vehicles/<vehicle_id>
{
  "vehicle_subscription_id": "<vehicle_subscription_id>"
}
```

### Bước 4: Tạo Direct Charging Session
```json
POST /api/charging-sessions/start-direct
{
  "user_id": "<user_id>",
  "vehicle_id": "<vehicle_id>",
  "chargingPoint_id": "<chargingPoint_id>",
  "initial_battery_percentage": 30,
  "target_battery_percentage": 80
}
```
Lưu lại `session_id`

### Bước 5: End Session
```json
POST /api/charging-sessions/<session_id>/end
{
  "final_battery_percentage": 80
}
```

### Kết quả mong đợi:
```json
{
  "message": "Charging session ended successfully",
  "fee_calculation": {
    "base_fee": 10000,
    "price_per_kwh": 3000,
    "energy_charged": "37.50 kWh",
    "charging_fee": 112500,
    "original_amount": 122500,  // ✅ Tổng tiền TRƯỚC discount
    "total_amount": 104125,     // ✅ Tổng tiền SAU discount (122500 - 18375)
    "subscription_discount": {
      "plan_name": "Premium Plan",
      "discount_percentage": "15%",
      "discount_amount": "18,375 đ"  // ✅ 15% của 122500 = 18375
    },
    "breakdown": "10,000 đ (phí cơ bản) + 37.50 kWh × 3,000 đ/kWh = 122,500 đ - 18,375 đ (giảm 15% từ gói Premium Plan) = 104,125 đ"
  }
}
```

### Bước 6: Kiểm tra Invoice Detail
```json
GET /api/invoices/<invoice_id>
```

### Kết quả mong đợi:
```json
{
  "pricing": {
    "base_fee": 10000,
    "charging_fee": 112500,
    "original_amount": 122500,  // ✅ Tổng tiền TRƯỚC discount
    "total_amount": 104125,     // ✅ Tổng tiền SAU discount
    "subscription_discount": {
      "discount_percentage": "15%",
      "discount_amount": "18,375 đ",
      "subscription_id": "<vehicle_subscription_id>"
    },
    "breakdown": "10,000 đ (phí cơ bản) + 37.50 kWh × 3,000 đ/kWh = 122,500 đ - 18,375 đ (giảm 15%) = 104,125 đ"
  }
}
```

---

## Test Case 3: Invoice CÓ Subscription với discount 30%

### Bước 1: Tạo Subscription Plan mới (30% discount)
```json
POST /api/subscription-plans
{
  "type": "prepaid",
  "name": "Super Premium Plan",
  "price": 1000000,
  "billing_cycle": "3 months",
  "description": "Super premium subscription with 30% discount",
  "discount": "30%",
  "is_active": true
}
```
Lưu lại `subscription_plan_id_2`

### Bước 2: Tạo Vehicle Subscription mới
```json
POST /api/vehicle-subscriptions
{
  "vehicle_id": "<vehicle_id>",
  "subscription_id": "<subscription_plan_id_2>",
  "auto_renew": false,
  "payment_status": "paid"
}
```
Lưu lại `vehicle_subscription_id_2`

### Bước 3: Cập nhật Vehicle với Subscription mới
```json
PATCH /api/vehicles/<vehicle_id>
{
  "vehicle_subscription_id": "<vehicle_subscription_id_2>"
}
```

### Bước 4: Tạo và End Session (tương tự Test Case 2)

### Kết quả mong đợi:
```json
{
  "fee_calculation": {
    "original_amount": 122500,
    "total_amount": 85750,  // ✅ 122500 - 36750 (30% discount)
    "subscription_discount": {
      "plan_name": "Super Premium Plan",
      "discount_percentage": "30%",
      "discount_amount": "36,750 đ"  // ✅ 30% của 122500 = 36750
    }
  }
}
```

---

## Test Case 4: Subscription đã hết hạn (KHÔNG áp dụng discount)

### Bước 1: Tạo Vehicle Subscription với ngày hết hạn trong quá khứ
```javascript
// Sử dụng MongoDB hoặc API để update subscription
{
  "vehicle_id": "<vehicle_id>",
  "subscription_id": "<subscription_plan_id>",
  "start_date": "2024-01-01T00:00:00Z",
  "end_date": "2024-01-31T23:59:59Z",  // ✅ Đã hết hạn
  "status": "expired"
}
```

### Bước 2: Tạo và End Session

### Kết quả mong đợi:
```json
{
  "fee_calculation": {
    "total_amount": 122500,  // ✅ KHÔNG CÓ DISCOUNT vì subscription hết hạn
    // ✅ KHÔNG CÓ subscription_discount field
  }
}
```

---

## Test Case 5: Subscription status = "expired" (KHÔNG áp dụng discount)

### Bước 1: Cập nhật subscription status = "expired"
```json
PATCH /api/vehicle-subscriptions/<vehicle_subscription_id>
{
  "status": "expired"
}
```

### Bước 2: Tạo và End Session

### Kết quả mong đợi:
- Tương tự Test Case 4: KHÔNG áp dụng discount

---

## Test Case 6: Vehicle KHÔNG có subscription_id (KHÔNG áp dụng discount)

### Bước 1: Tạo Vehicle MỚI (không có subscription)
```json
POST /api/vehicles
{
  "user_id": "<user_id>",
  "plate_number": "TEST-NO-SUB",
  "model": "Tesla Model Y",
  "batteryCapacity": 75
}
```

### Bước 2: Tạo và End Session với vehicle này

### Kết quả mong đợi:
- Tương tự Test Case 1: KHÔNG áp dụng discount

---

## Test Case 7: Subscription Plan có discount = "0%" hoặc null

### Bước 1: Tạo Subscription Plan không có discount
```json
POST /api/subscription-plans
{
  "type": "prepaid",
  "name": "Basic Plan",
  "price": 200000,
  "billing_cycle": "1 month",
  "discount": "0%",  // hoặc null
  "is_active": true
}
```

### Bước 2: Tạo Vehicle Subscription và End Session

### Kết quả mong đợi:
```json
{
  "fee_calculation": {
    "total_amount": 122500,  // ✅ KHÔNG CÓ DISCOUNT
    // ✅ KHÔNG CÓ subscription_discount field
  }
}
```

---

## Checklist Test

- [ ] Test Case 1: Invoice KHÔNG có Subscription ✅
- [ ] Test Case 2: Invoice CÓ Subscription (15% discount) ✅
- [ ] Test Case 3: Invoice CÓ Subscription (30% discount) ✅
- [ ] Test Case 4: Subscription hết hạn (KHÔNG discount) ✅
- [ ] Test Case 5: Subscription status = "expired" (KHÔNG discount) ✅
- [ ] Test Case 6: Vehicle KHÔNG có subscription_id (KHÔNG discount) ✅
- [ ] Test Case 7: Subscription Plan discount = "0%" (KHÔNG discount) ✅

---

## Công thức tính toán

### Không có Subscription:
```
total_amount = base_fee + charging_fee
```

### Có Subscription (discount X%):
```
original_amount = base_fee + charging_fee
discount_amount = original_amount × (discount_percentage / 100)
total_amount = original_amount - discount_amount
```

### Ví dụ:
- base_fee = 10,000 đ
- charging_fee = 112,500 đ (37.5 kWh × 3,000 đ/kWh)
- original_amount = 122,500 đ
- discount_percentage = 15%
- discount_amount = 122,500 × 0.15 = 18,375 đ
- total_amount = 122,500 - 18,375 = 104,125 đ

---

## Lưu ý

1. **original_amount** luôn = base_fee + charging_fee
2. **total_amount** = original_amount - discount_amount (nếu có discount)
3. Nếu không có subscription hoặc subscription hết hạn: total_amount = original_amount
4. discount_amount chỉ có khi subscription active và có discount > 0
5. Tất cả các field discount được lưu trong Invoice để audit trail
