# Database Diagram - EV Driver System

## Mermaid ER Diagram

```mermaid
erDiagram
    Account ||--o{ Vehicle : "has"
    Account ||--o{ Booking : "makes"
    Account ||--o{ Payment : "makes"
    Account ||--o{ Invoice : "receives"
    Account ||--o{ StaffReport : "creates"

    Company ||--o{ Vehicle : "manages"

    SubscriptionPlan ||--o{ VehicleSubscription : "defines"
    Vehicle ||--o| VehicleSubscription : "has"

    Station ||--o{ ChargingPoint : "contains"
    Station ||--o{ Booking : "hosts"
    Station ||--o{ Invoice : "generates"

    ChargingPoint ||--o{ Booking : "reserved_by"
    ChargingPoint ||--o{ ChargingSession : "used_in"
    ChargingPoint }o--|| Station : "belongs_to"

    Booking ||--o| ChargingSession : "creates"
    Booking }o--|| Account : "made_by"
    Booking }o--|| Station : "at"
    Booking }o--|| Vehicle : "for"
    Booking }o--|| ChargingPoint : "uses"

    ChargingSession ||--o| Invoice : "generates"
    ChargingSession }o--|| Booking : "from"
    ChargingSession }o--|| ChargingPoint : "uses"
    ChargingSession }o--|| Vehicle : "charges"

    Invoice }o--|| ChargingSession : "from"
    Invoice }o--|| Account : "for"
    Invoice }o--|| Booking : "related_to"
    Invoice }o--|| Vehicle : "for"
    Invoice }o--|| Station : "at"
    Invoice }o--|| ChargingPoint : "at"

    Payment }o--|| Account : "made_by"
    Payment }o--o| Invoice : "pays"

    StaffReport }o--|| Account : "created_by"

    Account {
        ObjectId _id PK
        string username UK
        string email UK
        string phone UK
        string password
        string role "driver|admin|staff|company"
        string status "active|inactive"
        boolean isCompany
        string refreshToken
        ObjectId userId FK
        datetime createdAt
        datetime updatedAt
    }

    Vehicle {
        ObjectId _id PK
        ObjectId user_id FK
        ObjectId company_id FK
        string plate_number UK
        string model
        number batteryCapacity "kWh"
        ObjectId vehicle_subscription_id FK
        datetime createdAt
        datetime updatedAt
    }

    Company {
        ObjectId _id PK
        string name
        string address
        string contact_email UK
        datetime createdAt
        datetime updatedAt
    }

    SubscriptionPlan {
        ObjectId _id PK
        string type "prepaid"
        string name UK
        number price
        string billing_cycle "1 month|3 months|6 months|1 year"
        string description
        boolean isCompany
        string discount
        boolean is_active
        datetime createdAt
        datetime updatedAt
    }

    VehicleSubscription {
        ObjectId _id PK
        ObjectId vehicle_id FK
        ObjectId subscription_id FK
        datetime start_date
        datetime end_date
        string status "active|expired"
        boolean auto_renew
        string payment_status "paid|pending|failed|refunded"
        datetime createdAt
        datetime updatedAt
    }

    Station {
        ObjectId _id PK
        string name UK
        string address
        number latitude
        number longitude
        string connector_type "AC|DC"
        number power_capacity "kW"
        number price_per_kwh "VND/kWh"
        number base_fee "VND"
        string status "online|offline|maintenance"
        datetime createdAt
    }

    ChargingPoint {
        ObjectId _id PK
        ObjectId stationId FK
        string type "online|offline"
        string status "available|in_use|maintenance"
        ObjectId current_session_id FK
        datetime create_at
    }

    Booking {
        ObjectId _id PK
        ObjectId user_id FK
        ObjectId station_id FK
        ObjectId vehicle_id FK
        ObjectId chargingPoint_id FK
        datetime start_time
        datetime end_time
        string status "pending|confirmed|active|completed|cancelled|expired"
        datetime createdAt
        datetime updatedAt
    }

    ChargingSession {
        ObjectId _id PK
        ObjectId booking_id FK
        ObjectId chargingPoint_id FK
        ObjectId vehicle_id FK
        datetime start_time
        datetime end_time
        string status "pending|in_progress|completed|cancelled"
        number initial_battery_percentage "0-100"
        number current_battery_percentage "0-100"
        number target_battery_percentage "0-100"
        number energy_delivered_kwh
        number charging_duration_minutes
        number charging_duration_hours
        number base_fee "VND"
        number price_per_kwh "VND/kWh"
        number charging_fee "VND"
        number total_amount "VND"
        string qr_code_token UK
        datetime createdAt
        datetime updatedAt
    }

    Invoice {
        ObjectId _id PK
        ObjectId session_id FK UK
        ObjectId user_id FK
        ObjectId booking_id FK
        ObjectId vehicle_id FK
        ObjectId station_id FK
        ObjectId chargingPoint_id FK
        datetime start_time
        datetime end_time
        number charging_duration_minutes
        number charging_duration_hours
        string charging_duration_formatted
        number initial_battery_percentage
        number final_battery_percentage
        number target_battery_percentage
        number battery_charged_percentage
        boolean target_reached
        number battery_capacity_kwh
        number power_capacity_kw
        number energy_delivered_kwh
        number charging_efficiency
        string calculation_method "battery_based|time_based"
        number base_fee "VND"
        number price_per_kwh "VND/kWh"
        number charging_fee "VND"
        number total_amount "VND"
        string payment_status "unpaid|paid|refunded|cancelled"
        string payment_method "vnpay"
        datetime payment_date
        string transaction_id
        string station_name
        string station_address
        string vehicle_plate_number
        string vehicle_model
        string notes
        datetime createdAt
        datetime updatedAt
    }

    Payment {
        ObjectId _id PK
        ObjectId madeBy FK
        string type "subscription|charging|base_fee"
        ObjectId invoice_id FK
        string vehicleSubscriptionIdId
        string vnp_TxnRef
        number vnp_Amount
        string vnp_OrderInfo
        string vnp_TransactionNo
        string vnp_BankCode
        string vnp_CardType
        string vnp_PayDate
        string vnp_ResponseCode
        string vnp_TransactionStatus
        string vnp_SecureHash
        datetime createdAt
    }

    StaffReport {
        ObjectId _id PK
        string title
        string content
        ObjectId userId FK
        array images "imageUrl, imagePublicId"
        string status "pending|processing|resolved|rejected"
        datetime createdAt
        datetime updatedAt
    }
```

## Relationships Summary

### One-to-Many Relationships:

- **Account** → Vehicle (1 user có nhiều xe)
- **Account** → Booking (1 user có nhiều booking)
- **Account** → Payment (1 user có nhiều payment)
- **Account** → Invoice (1 user có nhiều invoice)
- **Account** → StaffReport (1 user tạo nhiều report)
- **Company** → Vehicle (1 company quản lý nhiều xe)
- **SubscriptionPlan** → VehicleSubscription (1 plan có nhiều subscription)
- **Station** → ChargingPoint (1 station có nhiều charging points)
- **Station** → Booking (1 station có nhiều booking)
- **Station** → Invoice (1 station tạo nhiều invoice)
- **ChargingPoint** → Booking (1 charging point có nhiều booking)
- **ChargingPoint** → ChargingSession (1 charging point có nhiều session)
- **Booking** → ChargingSession (1 booking tạo 1 session)
- **ChargingSession** → Invoice (1 session tạo 1 invoice)

### Many-to-One Relationships:

- **Vehicle** → Account (nhiều xe thuộc 1 user)
- **Vehicle** → Company (nhiều xe thuộc 1 company)
- **Vehicle** → VehicleSubscription (1 xe có 1 subscription)
- **VehicleSubscription** → SubscriptionPlan (nhiều subscription dùng 1 plan)
- **ChargingPoint** → Station (nhiều charging point thuộc 1 station)
- **Booking** → Account, Station, Vehicle, ChargingPoint
- **ChargingSession** → Booking, ChargingPoint, Vehicle
- **Invoice** → ChargingSession, Account, Booking, Vehicle, Station, ChargingPoint
- **Payment** → Account, Invoice
- **StaffReport** → Account

## Indexes (from models)

### Account

- username (unique)
- email (unique)
- phone (unique)

### Vehicle

- plate_number (unique)

### Company

- contact_email (unique)

### SubscriptionPlan

- type + is_active (compound)
- price

### VehicleSubscription

- vehicle_id + status (compound)
- subscription_id
- start_date + end_date (compound)
- status
- vehicle_id + status + start_date + end_date (compound)

### Booking

- user_id + status (compound)
- station_id + status (compound)
- vehicle_id + status (compound)
- chargingPoint_id + status (compound)
- start_time + end_time (compound)
- status
- station_id + chargingPoint_id + status + start_time + end_time (compound)

### ChargingSession

- qr_code_token (unique, sparse)

### Invoice

- session_id (unique)
- user_id + createdAt (compound)
- station_id + createdAt (compound)
- payment_status + createdAt (compound)
- total_amount

## Notes

1. **Account.userId**: Reference to User model (commented out in code, not implemented)
2. **ChargingPoint.type**:
   - `online`: Cho booking qua app
   - `offline`: Sử dụng trực tiếp (walk-in)
3. **ChargingPoint.power_capacity**: Lấy từ Station, không lưu riêng
4. **Invoice**: Lưu snapshot data (station_name, vehicle_plate_number) để tránh mất dữ liệu khi records bị xóa
5. **Payment.type**:
   - `subscription`: Thanh toán gói đăng ký
   - `charging`: Thanh toán phí sạc
   - `base_fee`: Thanh toán phí đặt chỗ
6. **VehicleSubscription.status**: Tự động chuyển `active` → `expired` khi hết hạn (scheduler chạy mỗi giờ)
