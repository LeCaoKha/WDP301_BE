const Station = require('../models/Station')
const ChargingPoint = require('../models/ChargingPoint');

// Create a new station
exports.createStation = async (req, res) => {
  try {
    const station = await Station.create(req.body);
    res.status(201).json(station);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};
// Get all stations
exports.getStations = async (req, res) => {
  try {
    const stations = await Station.find();
    res.status(200).json(stations);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};
/**
 * Lấy thông tin chi tiết của một trạm sạc theo ID
 * Bao gồm cả thông tin charging points phân loại theo type (online/offline)
 * 
 * @route GET /api/stations/:id
 */
exports.getStationById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const station = await Station.findById(id);
    if (!station) {
      return res.status(404).json({ error: 'Station not found' });
    }

    // Lấy tất cả charging points của station này
    const chargingPoints = await ChargingPoint.find({ stationId: id })
      .populate({
        path: 'current_session_id',
        populate: [
          { path: 'booking_id', select: 'user_id start_time end_time' },
          { path: 'vehicle_id', select: 'plate_number model brand' }
        ]
      });

    // Phân loại charging points theo type và status
    const onlinePoints = { available: [], in_use: [], maintenance: [] };
    const offlinePoints = { available: [], in_use: [], maintenance: [] };

    chargingPoints.forEach(cp => {
      const pointInfo = {
        _id: cp._id,
        status: cp.status,
        type: cp.type
      };

      // Nếu đang được sử dụng, thêm thông tin session
      if (cp.status === 'in_use' && cp.current_session_id) {
        pointInfo.session_info = {
          session_id: cp.current_session_id._id,
          start_time: cp.current_session_id.start_time,
          vehicle: cp.current_session_id.vehicle_id,
          booking: cp.current_session_id.booking_id
        };
      }

      // Phân loại theo type
      if (cp.type === 'online') {
        onlinePoints[cp.status].push(pointInfo);
      } else {
        offlinePoints[cp.status].push(pointInfo);
      }
    });

    res.status(200).json({
      station: {
        _id: station._id,
        name: station.name,
        address: station.address,
        latitude: station.latitude,
        longitude: station.longitude,
        power_capacity: station.power_capacity,
        connector_type: station.connector_type,
        rating: station.rating,
        create_at: station.create_at
      },
      charging_points: {
        total: chargingPoints.length,
        // Charging points cho booking online (đặt trước qua app)
        online: {
          total: onlinePoints.available.length + onlinePoints.in_use.length + onlinePoints.maintenance.length,
          available: onlinePoints.available.length,
          in_use: onlinePoints.in_use.length,
          maintenance: onlinePoints.maintenance.length,
          details: onlinePoints
        },
        // Charging points cho sử dụng offline (đến trực tiếp)
        offline: {
          total: offlinePoints.available.length + offlinePoints.in_use.length + offlinePoints.maintenance.length,
          available: offlinePoints.available.length,
          in_use: offlinePoints.in_use.length,
          maintenance: offlinePoints.maintenance.length,
          details: offlinePoints
        }
      }
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

/**
 * Lấy danh sách charging points theo station
 * Phân loại theo type (online/offline) và status
 * 
 * @route GET /api/stations/:id/charging-points
 */
exports.getChargingPointsByStation = async (req, res) => {
  try {
    const { id } = req.params;

    // Kiểm tra station có tồn tại không
    const station = await Station.findById(id);
    if (!station) {
      return res.status(404).json({ error: 'Station not found' });
    }

    const chargingPoints = await ChargingPoint.find({ stationId: id })
      .populate({
        path: 'current_session_id',
        populate: [
          { path: 'booking_id', select: 'user_id start_time end_time' },
          { path: 'vehicle_id', select: 'plate_number model brand' }
        ]
      });

    // Phân loại charging points theo type và status
    const onlinePoints = { available: [], in_use: [], maintenance: [] };
    const offlinePoints = { available: [], in_use: [], maintenance: [] };

    chargingPoints.forEach(cp => {
      const pointInfo = {
        _id: cp._id,
        status: cp.status,
        type: cp.type
      };

      // Nếu đang được sử dụng, thêm thông tin session
      if (cp.status === 'in_use' && cp.current_session_id) {
        pointInfo.session_info = {
          session_id: cp.current_session_id._id,
          start_time: cp.current_session_id.start_time,
          vehicle: cp.current_session_id.vehicle_id,
          booking: cp.current_session_id.booking_id
        };
      }

      // Phân loại theo type
      if (cp.type === 'online') {
        onlinePoints[cp.status].push(pointInfo);
      } else {
        offlinePoints[cp.status].push(pointInfo);
      }
    });

    res.status(200).json({
      stationId: id,
      station_name: station.name,
      power_capacity: station.power_capacity,
      connector_type: station.connector_type,
      total: chargingPoints.length,
      // Charging points cho booking online (đặt trước qua app)
      online_charging_points: {
        total: onlinePoints.available.length + onlinePoints.in_use.length + onlinePoints.maintenance.length,
        available: onlinePoints.available.length,
        in_use: onlinePoints.in_use.length,
        maintenance: onlinePoints.maintenance.length,
        details: onlinePoints
      },
      // Charging points cho sử dụng offline (đến trực tiếp)
      offline_charging_points: {
        total: offlinePoints.available.length + offlinePoints.in_use.length + offlinePoints.maintenance.length,
        available: offlinePoints.available.length,
        in_use: offlinePoints.in_use.length,
        maintenance: offlinePoints.maintenance.length,
        details: offlinePoints
      }
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};
// Update a station
exports.updateStation = async (req, res) => {
    try {
        const station = await Station.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!station) {
            return res.status(404).json({ error: 'Station not found' });
        }
        res.status(200).json(station);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};
//Delete a station
exports.deleteStation = async (req, res) => {
  try {
    const station = await Station.findByIdAndDelete(req.params.id); 
    if (!station) {
      return res.status(404).json({ error: 'Station not found' });
    }
    res.status(204).send();
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};