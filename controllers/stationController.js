const Station = require("../models/Station");
const ChargingPoint = require("../models/ChargingPoint");
const Account = require("../models/Account");

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
    const stations = await Station.find().populate(
      "staff_id",
      "username email role status"
    );
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

    const station = await Station.findById(id).populate(
      "staff_id",
      "username email role status"
    );
    if (!station) {
      return res.status(404).json({ error: "Station not found" });
    }

    // Lấy tất cả charging points của station này
    const chargingPoints = await ChargingPoint.find({ stationId: id }).populate(
      {
        path: "current_session_id",
        populate: [
          { path: "booking_id", select: "user_id start_time end_time" },
          { path: "vehicle_id", select: "plate_number model brand" },
        ],
      }
    );

    // Phân loại charging points theo type và status
    const onlinePoints = { available: [], in_use: [], maintenance: [] };
    const offlinePoints = { available: [], in_use: [], maintenance: [] };

    chargingPoints.forEach((cp) => {
      const pointInfo = {
        _id: cp._id,
        status: cp.status,
        type: cp.type,
      };

      // Nếu đang được sử dụng, thêm thông tin session
      if (cp.status === "in_use" && cp.current_session_id) {
        pointInfo.session_info = {
          session_id: cp.current_session_id._id,
          start_time: cp.current_session_id.start_time,
          vehicle: cp.current_session_id.vehicle_id,
          booking: cp.current_session_id.booking_id,
        };
      }

      // Phân loại theo type
      if (cp.type === "online") {
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
        price_per_kwh: station.price_per_kwh,
        status: station.status,
        connector_type: station.connector_type,
        rating: station.rating,
        create_at: station.create_at,
        staff_id: station.staff_id,
      },
      charging_points: {
        total: chargingPoints.length,
        // Charging points cho booking online (đặt trước qua app)
        online: {
          total:
            onlinePoints.available.length +
            onlinePoints.in_use.length +
            onlinePoints.maintenance.length,
          available: onlinePoints.available.length,
          in_use: onlinePoints.in_use.length,
          maintenance: onlinePoints.maintenance.length,
          details: onlinePoints,
        },
        // Charging points cho sử dụng offline (đến trực tiếp)
        offline: {
          total:
            offlinePoints.available.length +
            offlinePoints.in_use.length +
            offlinePoints.maintenance.length,
          available: offlinePoints.available.length,
          in_use: offlinePoints.in_use.length,
          maintenance: offlinePoints.maintenance.length,
          details: offlinePoints,
        },
      },
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
      return res.status(404).json({ error: "Station not found" });
    }

    const chargingPoints = await ChargingPoint.find({ stationId: id }).populate(
      {
        path: "current_session_id",
        populate: [
          { path: "booking_id", select: "user_id start_time end_time" },
          { path: "vehicle_id", select: "plate_number model brand" },
        ],
      }
    );

    // Phân loại charging points theo type và status
    const onlinePoints = { available: [], in_use: [], maintenance: [] };
    const offlinePoints = { available: [], in_use: [], maintenance: [] };

    chargingPoints.forEach((cp) => {
      const pointInfo = {
        _id: cp._id,
        status: cp.status,
        type: cp.type,
      };

      // Nếu đang được sử dụng, thêm thông tin session
      if (cp.status === "in_use" && cp.current_session_id) {
        pointInfo.session_info = {
          session_id: cp.current_session_id._id,
          start_time: cp.current_session_id.start_time,
          vehicle: cp.current_session_id.vehicle_id,
          booking: cp.current_session_id.booking_id,
        };
      }

      // Phân loại theo type
      if (cp.type === "online") {
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
        total:
          onlinePoints.available.length +
          onlinePoints.in_use.length +
          onlinePoints.maintenance.length,
        available: onlinePoints.available.length,
        in_use: onlinePoints.in_use.length,
        maintenance: onlinePoints.maintenance.length,
        details: onlinePoints,
      },
      // Charging points cho sử dụng offline (đến trực tiếp)
      offline_charging_points: {
        total:
          offlinePoints.available.length +
          offlinePoints.in_use.length +
          offlinePoints.maintenance.length,
        available: offlinePoints.available.length,
        in_use: offlinePoints.in_use.length,
        maintenance: offlinePoints.maintenance.length,
        details: offlinePoints,
      },
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};
// Update a station
exports.updateStation = async (req, res) => {
  try {
    const station = await Station.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    });
    if (!station) {
      return res.status(404).json({ error: "Station not found" });
    }
    res.status(200).json(station);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};
//Delete a station
exports.deleteStation = async (req, res) => {
  try {
    const { id } = req.params;

    // Find station first to check if it exists
    const station = await Station.findById(id);
    if (!station) {
      return res.status(404).json({ error: "Station not found" });
    }

    // Find all staff accounts with station_id matching the station to be deleted
    const staffAccounts = await Account.find({
      station_id: id,
      role: "staff",
    });

    // Set station_id = null for all staff accounts
    let updatedStaffCount = 0;
    if (staffAccounts.length > 0) {
      const updateResult = await Account.updateMany(
        { station_id: id },
        { station_id: null }
      );
      updatedStaffCount = updateResult.modifiedCount;
    }

    // Delete the station
    await Station.findByIdAndDelete(id);

    res.status(200).json({
      message: "Station deleted successfully",
      station: {
        _id: station._id,
        name: station.name,
        address: station.address,
      },
      staffsUpdated: updatedStaffCount,
      note:
        updatedStaffCount > 0
          ? `${updatedStaffCount} staff account(s) had their station_id set to null`
          : "No staff accounts were affected",
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Gán staff vào station
exports.addStaffToStation = async (req, res) => {
  try {
    const { station_id, staff_ids } = req.body;

    // Validate required fields
    if (!station_id) {
      return res.status(400).json({
        error: "station_id là bắt buộc",
      });
    }

    if (!staff_ids || !Array.isArray(staff_ids) || staff_ids.length === 0) {
      return res.status(400).json({
        error: "staff_ids phải là một mảng không rỗng",
      });
    }

    // Validate station tồn tại
    const station = await Station.findById(station_id);
    if (!station) {
      return res.status(404).json({
        error: "Không tìm thấy station",
      });
    }

    // Validate các staff accounts tồn tại và có role là "staff"
    const staffAccounts = await Account.find({
      _id: { $in: staff_ids },
      role: "staff",
    });

    if (staffAccounts.length !== staff_ids.length) {
      const foundIds = staffAccounts.map((acc) => acc._id.toString());
      const notFoundIds = staff_ids.filter(
        (id) => !foundIds.includes(id.toString())
      );
      return res.status(404).json({
        error: "Một số staff không tồn tại hoặc không phải là staff",
        notFoundIds: notFoundIds,
      });
    }

    // Bước 1: Cập nhật station_id cho các staff accounts
    const updateAccountResult = await Account.updateMany(
      { _id: { $in: staff_ids } },
      { station_id: station_id }
    );

    // Bước 2: Thêm các staff_ids vào staff_id array của station (tránh duplicate)
    const existingStaffIds = station.staff_id.map((id) => id.toString());
    const newStaffIds = staff_ids.filter(
      (id) => !existingStaffIds.includes(id.toString())
    );

    if (newStaffIds.length > 0) {
      station.staff_id.push(...newStaffIds);
      await station.save();
    }

    // Lấy thông tin station đã cập nhật với populate staff_id
    const updatedStation = await Station.findById(station_id).populate(
      "staff_id",
      "username email role status"
    );

    // Lấy danh sách staff đã được cập nhật
    const updatedStaffs = await Account.find({
      _id: { $in: staff_ids },
    })
      .select("-password")
      .populate("station_id", "name address")
      .populate("company_id", "name address contact_email");

    res.status(200).json({
      message: `Đã gán ${updateAccountResult.modifiedCount} staff vào station thành công`,
      station: {
        _id: updatedStation._id,
        name: updatedStation.name,
        address: updatedStation.address,
        staff_id: updatedStation.staff_id,
      },
      staffsCount: updatedStaffs.length,
      staffs: updatedStaffs,
    });
  } catch (error) {
    console.error("Error adding staff to station:", error);
    res.status(500).json({
      error: "Lỗi khi gán staff vào station",
      message: error.message,
    });
  }
};

// Xóa staff khỏi station
exports.removeStaffFromStation = async (req, res) => {
  try {
    const { station_id, staff_ids } = req.body;

    // Validate required fields
    if (!station_id) {
      return res.status(400).json({
        error: "station_id là bắt buộc",
      });
    }

    if (!staff_ids || !Array.isArray(staff_ids) || staff_ids.length === 0) {
      return res.status(400).json({
        error: "staff_ids phải là một mảng không rỗng",
      });
    }

    // Validate station tồn tại
    const station = await Station.findById(station_id);
    if (!station) {
      return res.status(404).json({
        error: "Không tìm thấy station",
      });
    }

    // Validate các staff accounts tồn tại và có role là "staff"
    const staffAccounts = await Account.find({
      _id: { $in: staff_ids },
      role: "staff",
    });

    if (staffAccounts.length !== staff_ids.length) {
      const foundIds = staffAccounts.map((acc) => acc._id.toString());
      const notFoundIds = staff_ids.filter(
        (id) => !foundIds.includes(id.toString())
      );
      return res.status(404).json({
        error: "Một số staff không tồn tại hoặc không phải là staff",
        notFoundIds: notFoundIds,
      });
    }

    // Bước 1: Set station_id = null cho các staff accounts
    const updateAccountResult = await Account.updateMany(
      { _id: { $in: staff_ids } },
      { station_id: null }
    );

    // Bước 2: Xóa các staff_ids khỏi staff_id array của station
    const staffIdsToRemove = staff_ids.map((id) => id.toString());
    station.staff_id = station.staff_id.filter(
      (id) => !staffIdsToRemove.includes(id.toString())
    );
    await station.save();

    // Lấy thông tin station đã cập nhật với populate staff_id
    const updatedStation = await Station.findById(station_id).populate(
      "staff_id",
      "username email role status"
    );

    // Lấy danh sách staff đã được cập nhật
    const updatedStaffs = await Account.find({
      _id: { $in: staff_ids },
    })
      .select("-password")
      .populate("station_id", "name address")
      .populate("company_id", "name address contact_email");

    res.status(200).json({
      message: `Đã xóa ${updateAccountResult.modifiedCount} staff khỏi station thành công`,
      station: {
        _id: updatedStation._id,
        name: updatedStation.name,
        address: updatedStation.address,
        staff_id: updatedStation.staff_id,
      },
      staffsCount: updatedStaffs.length,
      staffs: updatedStaffs,
    });
  } catch (error) {
    console.error("Error removing staff from station:", error);
    res.status(500).json({
      error: "Lỗi khi xóa staff khỏi station",
      message: error.message,
    });
  }
};
