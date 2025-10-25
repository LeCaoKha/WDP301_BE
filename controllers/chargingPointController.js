const ChargingPoint = require('../models/ChargingPoint');
const Station = require('../models/Station');

/**
 * Tạo charging point mới
 * Phải chỉ định type là 'online' hoặc 'offline' ngay khi tạo
 * 
 * @route POST /api/charging-point
 * @body {string} stationId - ID của trạm sạc
 * @body {number} power_capacity - Công suất sạc (kW)
 * @body {string} type - Loại điểm sạc: 'online' (cho booking) hoặc 'offline' (sử dụng trực tiếp)
 */
exports.createChargingPoint = async (req, res) => {
  try {
    const { stationId, power_capacity, type } = req.body;

    // Validate type - bắt buộc phải có và chỉ nhận 'online' hoặc 'offline'
    if (!type || !['online', 'offline'].includes(type)) {
      return res.status(400).json({ 
        error: 'Type is required and must be either "online" or "offline"',
        message: 'online: for bookings, offline: for walk-in customers'
      });
    }

    // Kiểm tra station có tồn tại không
    const station = await Station.findById(stationId);
    if (!station) {
      return res.status(404).json({ error: 'Station not found' });
    }

    // Tạo charging point với type
    const chargingPoint = await ChargingPoint.create({
      stationId,
      power_capacity,
      type,
      status: 'available'
    });

    res.status(201).json({
      message: 'Charging point created successfully',
      chargingPoint: {
        _id: chargingPoint._id,
        stationId: chargingPoint.stationId,
        power_capacity: chargingPoint.power_capacity,
        type: chargingPoint.type,
        status: chargingPoint.status,
        create_at: chargingPoint.create_at
      }
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

/**
 * Lấy tất cả charging points
 * 
 * @route GET /api/charging-point
 */
exports.getChargingPoints = async (req, res) => {
  try {
    const chargingPoints = await ChargingPoint.find()
      .populate('stationId')
      .populate({
        path: 'current_session_id',
        populate: [
          { path: 'booking_id', select: 'user_id start_time end_time' },
          { path: 'vehicle_id', select: 'plate_number model brand' }
        ]
      });

    res.status(200).json({
      total: chargingPoints.length,
      chargingPoints
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

/**
 * Lấy thông tin chi tiết một charging point theo ID
 * 
 * @route GET /api/charging-point/:id
 */
exports.getChargingPointById = async (req, res) => {
  try {
    const chargingPoint = await ChargingPoint.findById(req.params.id)
      .populate('stationId')
      .populate({
        path: 'current_session_id',
        populate: [
          { path: 'booking_id', select: 'user_id start_time end_time' },
          { path: 'vehicle_id', select: 'plate_number model brand' }
        ]
      });

    if (!chargingPoint) {
      return res.status(404).json({ error: 'Charging Point not found' });
    }

    res.status(200).json(chargingPoint);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

/**
 * Cập nhật thông tin charging point
 * Cho phép thay đổi type (online/offline) nếu charging point không đang được sử dụng
 * 
 * @route PUT /api/charging-point/:id
 */
exports.updateChargingPoint = async (req, res) => {
  try {
    const { type, ...otherUpdates } = req.body;

    // Lấy charging point hiện tại
    const chargingPoint = await ChargingPoint.findById(req.params.id);
    
    if (!chargingPoint) {
      return res.status(404).json({ error: 'Charging Point not found' });
    }

    // Nếu muốn thay đổi type
    if (type) {
      // Validate type
      if (!['online', 'offline'].includes(type)) {
        return res.status(400).json({ 
          error: 'Type must be either "online" or "offline"'
        });
      }

      // Kiểm tra charging point có đang được sử dụng không
      if (chargingPoint.status === 'in_use') {
        return res.status(400).json({ 
          error: 'Cannot change type while charging point is in use',
          current_status: chargingPoint.status,
          message: 'Please wait until charging session is completed'
        });
      }

      // Cho phép thay đổi type
      chargingPoint.type = type;
    }

    // Cập nhật các trường khác
    Object.keys(otherUpdates).forEach(key => {
      chargingPoint[key] = otherUpdates[key];
    });

    await chargingPoint.save();

    res.status(200).json({
      message: 'Charging point updated successfully',
      chargingPoint
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

/**
 * Xóa charging point
 * 
 * @route DELETE /api/charging-point/:id
 */
exports.deleteChargingPoint = async (req, res) => {
  try {
    const chargingPoint = await ChargingPoint.findById(req.params.id);
    
    if (!chargingPoint) {
      return res.status(404).json({ error: 'Charging Point not found' });
    }

    // Kiểm tra xem charging point có đang được sử dụng không
    if (chargingPoint.status === 'in_use') {
      return res.status(400).json({ 
        error: 'Cannot delete charging point that is currently in use',
        current_status: chargingPoint.status
      });
    }

    await ChargingPoint.findByIdAndDelete(req.params.id);
    
    res.status(200).json({ 
      message: 'Charging point deleted successfully' 
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

/**
 * Bắt đầu sử dụng offline charging point
 * CHỈ cho phép sử dụng với charging point có type = 'offline'
 * Dành cho người dùng đến trực tiếp trạm sạc (không qua booking)
 * 
 * @route POST /api/charging-point/:id/start-offline
 */
exports.startOfflineUsage = async (req, res) => {
  try {
    const { id } = req.params;

    const chargingPoint = await ChargingPoint.findById(id);
    if (!chargingPoint) {
      return res.status(404).json({ error: 'Charging Point not found' });
    }

    // Kiểm tra type phải là offline
    if (chargingPoint.type !== 'offline') {
      return res.status(400).json({ 
        error: 'This charging point is reserved for online bookings only',
        charging_point_type: chargingPoint.type,
        message: 'Please use a charging point with type "offline" for walk-in usage'
      });
    }

    // Kiểm tra status phải là available
    if (chargingPoint.status !== 'available') {
      return res.status(400).json({ 
        error: 'Charging point is not available',
        current_status: chargingPoint.status
      });
    }

    // Cập nhật status thành in_use
    chargingPoint.status = 'in_use';
    await chargingPoint.save();

    res.status(200).json({
      message: 'Offline charging started successfully',
      chargingPoint: {
        _id: chargingPoint._id,
        type: chargingPoint.type,
        status: chargingPoint.status,
        power_capacity: chargingPoint.power_capacity
      }
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

/**
 * Kết thúc sử dụng offline charging point
 * Giải phóng charging point để người khác có thể sử dụng
 * 
 * @route POST /api/charging-point/:id/stop-offline
 */
exports.stopOfflineUsage = async (req, res) => {
  try {
    const { id } = req.params;

    const chargingPoint = await ChargingPoint.findById(id);
    if (!chargingPoint) {
      return res.status(404).json({ error: 'Charging Point not found' });
    }

    // Kiểm tra type phải là offline
    if (chargingPoint.type !== 'offline') {
      return res.status(400).json({ 
        error: 'This charging point is for online bookings only',
        charging_point_type: chargingPoint.type
      });
    }

    // Kiểm tra status phải là in_use
    if (chargingPoint.status !== 'in_use') {
      return res.status(400).json({ 
        error: 'Charging point is not in use',
        current_status: chargingPoint.status
      });
    }

    // Cập nhật status về available
    chargingPoint.status = 'available';
    chargingPoint.current_session_id = null;
    await chargingPoint.save();

    res.status(200).json({
      message: 'Offline charging stopped successfully',
      chargingPoint: {
        _id: chargingPoint._id,
        type: chargingPoint.type,
        status: chargingPoint.status
      }
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};
