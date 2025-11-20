# Hướng dẫn chi tiết về Node-Cron

## 📚 Tổng quan

`node-cron` là một thư viện Node.js cho phép bạn lên lịch các tác vụ chạy định kỳ sử dụng cú pháp cron expression. Nó là một wrapper đơn giản và mạnh mẽ cho việc scheduling tasks trong Node.js.

## 🎯 Tại sao sử dụng node-cron thay vì setInterval?

### setInterval (cách cũ):
```javascript
// Chạy mỗi 1 giờ (3600000 milliseconds)
setInterval(async () => {
  await doSomething();
}, 60 * 60 * 1000);
```

**Nhược điểm:**
- Khó đọc và maintain
- Phải tính toán milliseconds thủ công
- Không hỗ trợ cron expression (ví dụ: "chạy vào 9h sáng mỗi ngày")
- Không hỗ trợ timezone
- Khó cấu hình lịch phức tạp

### node-cron (cách mới):
```javascript
// Chạy mỗi giờ vào phút thứ 0
cron.schedule('0 * * * *', async () => {
  await doSomething();
});
```

**Ưu điểm:**
- Dễ đọc và hiểu
- Cron expression chuẩn, quen thuộc
- Hỗ trợ timezone
- Linh hoạt cho các lịch phức tạp
- Có thể bật/tắt dễ dàng

## 📖 Cron Expression Syntax

Cron expression trong node-cron có 5 hoặc 6 trường (tùy phiên bản):

### Format 5 trường (phút, giờ, ngày, tháng, thứ):
```
* * * * *
│ │ │ │ │
│ │ │ │ └─── Day of week (0-7, 0 và 7 = Chủ nhật)
│ │ │ └───── Month (1-12)
│ │ └─────── Day of month (1-31)
│ └───────── Hour (0-23)
└─────────── Minute (0-59)
```

### Format 6 trường (giây, phút, giờ, ngày, tháng, thứ):
```
* * * * * *
│ │ │ │ │ │
│ │ │ │ │ └─── Day of week (0-7)
│ │ │ │ └───── Month (1-12)
│ │ │ └─────── Day of month (1-31)
│ │ └───────── Hour (0-23)
│ └─────────── Minute (0-59)
└───────────── Second (0-59)
```

## 📝 Ví dụ Cron Expression

### Các ví dụ cơ bản:

```javascript
// Mỗi phút
'* * * * *'

// Mỗi 5 phút
'*/5 * * * *'

// Mỗi giờ vào phút thứ 0
'0 * * * *'

// Mỗi ngày lúc 9:00 AM
'0 9 * * *'

// Mỗi ngày lúc 9:30 AM
'30 9 * * *'

// Mỗi tuần vào thứ 2 lúc 9:00 AM
'0 9 * * 1'

// Mỗi tháng vào ngày 1 lúc 00:00
'0 0 1 * *'

// Mỗi ngày vào 12:00 PM và 6:00 PM
'0 12,18 * * *'

// Mỗi ngày từ 9:00 AM đến 5:00 PM, mỗi giờ
'0 9-17 * * *'

// Mỗi 15 phút
'*/15 * * * *'
```

### Các ví dụ nâng cao:

```javascript
// Mỗi ngày làm việc (thứ 2-6) lúc 9:00 AM
'0 9 * * 1-5'

// Mỗi ngày cuối tháng lúc 23:59
'59 23 28-31 * *'

// Mỗi 30 giây (format 6 trường)
'*/30 * * * * *'

// Mỗi giờ vào phút thứ 0, 15, 30, 45
'0,15,30,45 * * * *'
```

## 🔧 Cách sử dụng trong dự án

### 1. Import node-cron

```javascript
const cron = require('node-cron');
```

### 2. Tạo scheduled task

```javascript
cron.schedule(cronExpression, callback, options);
```

### 3. Ví dụ trong dự án EvDriver

#### Subscription Scheduler (chạy mỗi giờ):
```javascript
// Chạy vào phút thứ 0 của mỗi giờ
// Ví dụ: 00:00, 01:00, 02:00, ..., 23:00
cron.schedule("0 * * * *", async () => {
  console.log("⏰ Checking for expired subscriptions...");
  try {
    await updateExpiredSubscriptions();
  } catch (error) {
    console.error("❌ Error:", error.message);
  }
}, {
  scheduled: true,
  timezone: "Asia/Ho_Chi_Minh"
});
```

**Giải thích:**
- `"0 * * * *"`: Chạy vào phút 0 của mỗi giờ, mỗi ngày, mỗi tháng
- `scheduled: true`: Bật scheduler ngay lập tức
- `timezone: "Asia/Ho_Chi_Minh"`: Sử dụng múi giờ Việt Nam

#### Booking Scheduler (chạy mỗi N phút):
```javascript
const intervalMinutes = parseInt(process.env.BOOKING_CHECK_INTERVAL) || 1;
const cronExpression = `*/${intervalMinutes} * * * *`;

cron.schedule(cronExpression, async () => {
  console.log(`⏰ Checking bookings... (every ${intervalMinutes} min)`);
  try {
    await activateBookingsAtStartTime();
    await expirePastBookings();
  } catch (error) {
    console.error("❌ Error:", error.message);
  }
}, {
  scheduled: true,
  timezone: "Asia/Ho_Chi_Minh"
});
```

**Giải thích:**
- `*/1 * * * *`: Chạy mỗi 1 phút (mặc định)
- `*/5 * * * *`: Chạy mỗi 5 phút (nếu set BOOKING_CHECK_INTERVAL=5)
- Có thể config qua biến môi trường

## ⚙️ Options trong cron.schedule()

```javascript
cron.schedule(cronExpression, callback, {
  scheduled: true,        // Bật/tắt scheduler (default: true)
  timezone: "Asia/Ho_Chi_Minh"  // Timezone (default: server timezone)
});
```

### scheduled
- `true`: Scheduler sẽ chạy ngay lập tức
- `false`: Scheduler được tạo nhưng chưa chạy, cần gọi `.start()` sau

### timezone
- Sử dụng timezone string theo IANA Time Zone Database
- Ví dụ: `"Asia/Ho_Chi_Minh"`, `"America/New_York"`, `"Europe/London"`
- Nếu không set, sẽ dùng timezone của server

## 🎮 Quản lý Scheduled Tasks

### Lưu trữ task để quản lý:

```javascript
// Tạo task và lưu reference
const subscriptionTask = cron.schedule("0 * * * *", async () => {
  await updateExpiredSubscriptions();
}, {
  scheduled: false  // Tạo nhưng chưa chạy
});

// Bắt đầu task
subscriptionTask.start();

// Dừng task
subscriptionTask.stop();

// Kiểm tra trạng thái
console.log(subscriptionTask.running); // true/false

// Xóa task
subscriptionTask.destroy();
```

## 🔍 Debugging và Monitoring

### Kiểm tra task có chạy không:

```javascript
const task = cron.schedule("0 * * * *", async () => {
  console.log("Task running at:", new Date().toISOString());
  await doSomething();
});

// Kiểm tra trạng thái
console.log("Task is running:", task.running);

// Log thời gian chạy tiếp theo (nếu có)
// Note: node-cron không có built-in method để lấy next run time
// Có thể dùng thư viện khác như 'cron-parser' để tính toán
```

### Thêm logging để debug:

```javascript
cron.schedule("0 * * * *", async () => {
  const startTime = new Date();
  console.log(`[${startTime.toISOString()}] Starting subscription check...`);
  
  try {
    await updateExpiredSubscriptions();
    const endTime = new Date();
    const duration = endTime - startTime;
    console.log(`[${endTime.toISOString()}] Completed in ${duration}ms`);
  } catch (error) {
    console.error(`[${new Date().toISOString()}] Error:`, error);
  }
});
```

## ⚠️ Lưu ý quan trọng

### 1. Error Handling
Luôn bọc code trong try-catch để tránh crash:

```javascript
cron.schedule("* * * * *", async () => {
  try {
    await riskyOperation();
  } catch (error) {
    console.error("Error in scheduled task:", error);
    // Không throw error, để task tiếp tục chạy lần sau
  }
});
```

### 2. Async/Await
node-cron hỗ trợ async callback:

```javascript
// ✅ Đúng
cron.schedule("* * * * *", async () => {
  await asyncFunction();
});

// ❌ Không cần thiết
cron.schedule("* * * * *", () => {
  asyncFunction().catch(console.error);
});
```

### 3. Memory Leaks
Nếu tạo nhiều tasks, nhớ destroy khi không dùng:

```javascript
const tasks = [];

// Tạo task
const task = cron.schedule("* * * * *", () => {});
tasks.push(task);

// Cleanup khi cần
tasks.forEach(task => task.destroy());
```

### 4. Server Restart
- Khi server restart, tất cả scheduled tasks sẽ bị mất
- Tasks sẽ được tạo lại khi server khởi động
- Nếu cần persistence, nên dùng `agenda` hoặc `bull` với Redis

## 📊 So sánh với các công nghệ khác

| Tính năng | node-cron | setInterval | agenda | bull |
|-----------|-----------|-------------|--------|------|
| Đơn giản | ✅✅✅ | ✅✅ | ❌ | ❌ |
| Cron expression | ✅ | ❌ | ✅ | ✅ |
| Timezone support | ✅ | ❌ | ✅ | ✅ |
| Persistence | ❌ | ❌ | ✅ | ✅ |
| Retry mechanism | ❌ | ❌ | ✅ | ✅ |
| Job queue | ❌ | ❌ | ✅ | ✅ |
| Distributed | ❌ | ❌ | ✅ | ✅ |
| Cần database | ❌ | ❌ | ✅ (MongoDB) | ✅ (Redis) |

## 🚀 Best Practices

1. **Luôn có error handling**: Bọc code trong try-catch
2. **Logging**: Thêm log để theo dõi task execution
3. **Timezone**: Luôn set timezone rõ ràng
4. **Environment variables**: Dùng env vars cho các interval có thể thay đổi
5. **Testing**: Test cron expression trước khi deploy
6. **Documentation**: Ghi chú rõ ràng về schedule của mỗi task

## 📚 Tài liệu tham khảo

- [node-cron GitHub](https://github.com/node-cron/node-cron)
- [Cron Expression Generator](https://crontab.guru/)
- [IANA Time Zone Database](https://www.iana.org/time-zones)

## 🎯 Tóm tắt cho dự án EvDriver

### Subscription Scheduler:
- **Schedule**: Mỗi giờ vào phút thứ 0 (`0 * * * *`)
- **Chức năng**: Check và update expired subscriptions
- **Timezone**: Asia/Ho_Chi_Minh

### Booking Scheduler:
- **Schedule**: Mỗi N phút (mặc định 1 phút) (`*/N * * * *`)
- **Chức năng**: Activate bookings và expire past bookings
- **Config**: Có thể thay đổi qua `BOOKING_CHECK_INTERVAL` env var
- **Timezone**: Asia/Ho_Chi_Minh

---

**Lưu ý**: File này được tạo để hướng dẫn sử dụng node-cron trong dự án. Cập nhật khi có thay đổi về scheduling logic.

