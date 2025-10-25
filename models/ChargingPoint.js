const mongoose = require('mongoose');

// Schema cho Charging Point (Điểm sạc)
// Mô tả: Đại diện cho từng điểm sạc tại một trạm sạc
const chargingPointSchema = new mongoose.Schema({
  // ID của trạm sạc mà điểm sạc này thuộc về
  stationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Station',
    required: true,
  },
  
  // Công suất sạc được lấy từ Station (không lưu riêng ở ChargingPoint nữa)
  // Sử dụng populate để lấy power_capacity từ Station khi cần
  
  // Trạng thái hoạt động của điểm sạc
  // available: Sẵn sàng để sử dụng
  // in_use: Đang được sử dụng
  // maintenance: Đang bảo trì
  status: {
    type: String,
    enum: ['available', 'in_use', 'maintenance'],
    default: 'available',
  },
  
  // Loại điểm sạc - SET CỨNG khi tạo charging point
  // online: Điểm sạc dành cho người đặt trước qua app (cần booking)
  // offline: Điểm sạc dành cho người dùng đến trực tiếp (không cần booking)
  // VD: 1 station có 6 charging points -> set 4 cái là 'online', 2 cái là 'offline'
  type: {
    type: String,
    enum: ['online', 'offline'],
    required: true,
    description: 'Type of charging point - online (for bookings) or offline (for walk-in customers)'
  },
  
  // ID của phiên sạc hiện tại (nếu đang được sử dụng)
  // Null nếu điểm sạc đang available hoặc maintenance
  current_session_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ChargingSession',
    default: null
  },
  
  // Thời gian tạo điểm sạc
  create_at: { type: Date, default: Date.now },
});

module.exports = mongoose.model('ChargingPoint', chargingPointSchema);
