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
    "original_charging_fee": 112500,
    "charging_fee": 112500,  // ✅ KHÔNG CÓ DISCOUNT
    "total_amount": 122500,  // ✅ Base fee + charging fee
    "breakdown": "10,000 đ (phí cơ bản - đã thanh toán) + 37.50 kWh × 3,000 đ/kWh = 112,500 đ → Tổng: 122,500 đ"
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
    "original_charging_fee": 112500,
    "charging_fee": 112500,  // ✅ KHÔNG CÓ DISCOUNT
    "total_amount": 122500,  // ✅ Base fee + charging fee
    "breakdown": "10,000 đ (phí cơ bản - đã thanh toán) + 37.50 kWh × 3,000 đ/kWh = 112,500 đ → Tổng: 122,500 đ"
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
    "original_charging_fee": 112500,  // ✅ Charging fee TRƯỚC discount
    "charging_fee": 95625,             // ✅ Charging fee SAU discount (112500 - 16875)
    "total_amount": 105625,            // ✅ Base fee + discounted charging fee (10000 + 95625)
    "subscription_discount": {
      "plan_name": "Premium Plan",
      "discount_percentage": "15%",
      "discount_amount": "16,875 đ",  // ✅ 15% của 112500 (charging_fee) = 16875
      "note": "Discount chỉ áp dụng cho phí sạc (charging fee), không áp dụng cho phí cơ bản (base fee)"
    },
    "breakdown": "10,000 đ (phí cơ bản - đã thanh toán) + 37.50 kWh × 3,000 đ/kWh = 112,500 đ - 16,875 đ (giảm 15% từ gói Premium Plan) = 95,625 đ → Tổng: 105,625 đ"
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
    "original_charging_fee": 112500,  // ✅ Charging fee TRƯỚC discount
    "charging_fee": 95625,            // ✅ Charging fee SAU discount
    "total_amount": 105625,           // ✅ Base fee + discounted charging fee
    "subscription_discount": {
      "discount_percentage": "15%",
      "discount_amount": "16,875 đ",
      "subscription_id": "<vehicle_subscription_id>",
      "note": "Discount chỉ áp dụng cho phí sạc (charging fee), không áp dụng cho phí cơ bản (base fee)"
    },
    "breakdown": "10,000 đ (phí cơ bản - đã thanh toán) + 37.50 kWh × 3,000 đ/kWh = 112,500 đ - 16,875 đ (giảm 15%) = 95,625 đ → Tổng: 105,625 đ"
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
    "original_charging_fee": 112500,
    "charging_fee": 78750,   // ✅ 112500 - 33750 (30% discount của charging_fee)
    "total_amount": 88750,   // ✅ 10000 + 78750 (base_fee + discounted charging_fee)
    "subscription_discount": {
      "plan_name": "Super Premium Plan",
      "discount_percentage": "30%",
      "discount_amount": "33,750 đ"  // ✅ 30% của 112500 (charging_fee) = 33750
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
    "original_charging_fee": 112500,
    "charging_fee": 112500,  // ✅ KHÔNG CÓ DISCOUNT vì subscription hết hạn
    "total_amount": 122500,  // ✅ Base fee + charging fee
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
    "original_charging_fee": 112500,
    "charging_fee": 112500,  // ✅ KHÔNG CÓ DISCOUNT
    "total_amount": 122500,  // ✅ Base fee + charging fee
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

### ✅ LƯU Ý QUAN TRỌNG:
- **Base fee** đã được thanh toán khi confirm booking → **KHÔNG bị discount**
- **Discount chỉ áp dụng cho charging_fee**, không áp dụng cho base_fee

### Không có Subscription:
```
original_charging_fee = energy_delivered_kwh × price_per_kwh
charging_fee = original_charging_fee
total_amount = base_fee + charging_fee
```

### Có Subscription (discount X%):
```
original_charging_fee = energy_delivered_kwh × price_per_kwh
discount_amount = original_charging_fee × (discount_percentage / 100)
charging_fee = original_charging_fee - discount_amount
total_amount = base_fee + charging_fee
```

### Ví dụ:
- base_fee = 10,000 đ (đã thanh toán khi confirm booking)
- original_charging_fee = 112,500 đ (37.5 kWh × 3,000 đ/kWh)
- discount_percentage = 15%
- discount_amount = 112,500 × 0.15 = 16,875 đ (chỉ discount charging_fee)
- charging_fee = 112,500 - 16,875 = 95,625 đ
- total_amount = 10,000 + 95,625 = 105,625 đ

---

## Lưu ý

1. **Base fee** đã được thanh toán khi confirm booking → **KHÔNG bị discount**
2. **original_charging_fee** = energy_delivered_kwh × price_per_kwh (trước discount)
3. **charging_fee** = original_charging_fee - discount_amount (sau discount, nếu có)
4. **total_amount** = base_fee + charging_fee (charging_fee đã được discount nếu có)
5. **discount_amount** chỉ áp dụng cho charging_fee, không áp dụng cho base_fee
6. Nếu không có subscription hoặc subscription hết hạn: charging_fee = original_charging_fee
7. discount_amount chỉ có khi subscription active và có discount > 0
8. Tất cả các field discount được lưu trong Invoice để audit trail
9. Khi list invoice, **total_amount** đã là giá sau discount (nếu có)
