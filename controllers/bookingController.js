const Booking = require("../models/Booking");
const Account = require("../models/Account");
const Station = require("../models/Station");
const Vehicle = require("../models/Vehicle");
const ChargingPoint = require("../models/ChargingPoint");

// ✅ CREATE BOOKING
exports.createBooking = async (req, res) => {
  try {
    const {
      user_id,
      station_id,
      vehicle_id,
      chargingPoint_id,
      start_time,
      end_time,
    } = req.body;

    // Validate user exists
    const user = await Account.findById(user_id);
    if (!user) {
      console.log("User ID:", user_id);
      return res.status(400).json({ message: "User not found" });
    }

    // Validate station exists
    const station = await Station.findById(station_id);
    if (!station) {
      return res.status(400).json({ message: "Station not found" });
    }

    // Validate vehicle exists
    const vehicle = await Vehicle.findById(vehicle_id);
    if (!vehicle) {
      return res.status(400).json({ message: "Vehicle not found" });
    }

    // Validate charging point exists
    const chargingPoint = await ChargingPoint.findById(chargingPoint_id);

    console.log("Charging Point:", {
      id: chargingPoint._id,
      type: chargingPoint.type,
      status: chargingPoint.status,
    });

    if (chargingPoint.type !== "online") {
      console.log("BLOCKED: Charging point type is offline");
      return res.status(400).json({
        error: "Cannot book this charging point",
        charging_point_type: chargingPoint.type,
      });
    }

    // Validate charging point belongs to the station
    if (chargingPoint.stationId.toString() !== station_id) {
      return res.status(400).json({
        message: "Charging point does not belong to the specified station",
      });
    }

    // Validate dates
    const startTime = new Date(start_time);
    const endTime = new Date(end_time);
    const now = new Date();

    if (startTime >= endTime) {
      return res.status(400).json({
        message: "End time must be after start time",
      });
    }

    if (startTime <= now) {
      return res.status(400).json({
        message: "Start time must be in the future",
      });
    }

    // Check for time conflicts with existing bookings
    const conflictingBookings = await Booking.find({
      chargingPoint_id,
      status: { $in: ["pending", "confirmed", "active"] },
      $or: [
        {
          start_time: { $lt: endTime },
          end_time: { $gt: startTime },
        },
      ],
    });

    if (conflictingBookings.length > 0) {
      return res.status(400).json({
        message: "Time slot is already booked for this charging point",
        conflictingBookings: conflictingBookings.map((booking) => ({
          id: booking._id,
          start_time: booking.start_time,
          end_time: booking.end_time,
          status: booking.status,
        })),
      });
    }

    // Tạo booking
    const booking = await Booking.create({
      user_id,
      station_id,
      vehicle_id,
      chargingPoint_id,
      start_time: startTime,
      end_time: endTime,
      status: "pending", // ✅ MẶC ĐỊNH LÀ PENDING
    });

    // Populate the response
    const populatedBooking = await Booking.findById(booking._id)
      .populate("user_id", "username email phone_number")
      .populate("station_id", "name address power_capacity base_fee price_per_kwh") // ✅ THÊM BASE_FEE & PRICE_PER_KWH
      .populate("vehicle_id", "plate_number model brand batteryCapacity")
      .populate({
        path: "chargingPoint_id",
        select: "name type status",
        populate: {
          path: "stationId",
          select: "power_capacity base_fee price_per_kwh", // ✅ THÊM GIÁ
        },
      });

    // ✅ TRẢ VỀ THÔNG TIN GIÁ
    res.status(201).json({
      message: "Booking created successfully. Please confirm to proceed.",
      booking: {
        id: populatedBooking._id,
        status: populatedBooking.status, // "pending"
        
        user: {
          id: populatedBooking.user_id._id,
          username: populatedBooking.user_id.username,
          email: populatedBooking.user_id.email,
        },
        
        station: {
          id: populatedBooking.station_id._id,
          name: populatedBooking.station_id.name,
          address: populatedBooking.station_id.address,
          power_capacity: populatedBooking.station_id.power_capacity,
        },
        
        vehicle: {
          id: populatedBooking.vehicle_id._id,
          plate_number: populatedBooking.vehicle_id.plate_number,
          model: populatedBooking.vehicle_id.model,
          battery_capacity: populatedBooking.vehicle_id.batteryCapacity,
        },
        
        charging_point: {
          id: populatedBooking.chargingPoint_id._id,
          name: populatedBooking.chargingPoint_id.name,
          type: populatedBooking.chargingPoint_id.type,
          status: populatedBooking.chargingPoint_id.status,
        },
        
        schedule: {
          start_time: populatedBooking.start_time,
          end_time: populatedBooking.end_time,
        },
        
        // ✅ THÔNG TIN GIÁ ĐỂ FRONTEND HIỂN THỊ
        pricing: {
          base_fee: populatedBooking.station_id.base_fee || 10000,
          base_fee_formatted: `${(populatedBooking.station_id.base_fee || 10000).toLocaleString('vi-VN')} VND`,
          
          price_per_kwh: populatedBooking.station_id.price_per_kwh || 3000,
          price_per_kwh_formatted: `${(populatedBooking.station_id.price_per_kwh || 3000).toLocaleString('vi-VN')} VND/kWh`,

          note: "Base fee will be charged when you start charging. Energy fee depends on actual usage.",
        },
      },
      
      // ✅ NEXT STEP
      next_step: {
        action: "confirm_booking",
        message: "Please confirm this booking to proceed with charging",
        confirm_endpoint: `/api/bookings/${booking._id}/confirm`,
      },
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// ✅ GET ALL BOOKINGS
exports.getAllBookings = async (req, res) => {
  try {
    const bookings = await Booking.find()
      .populate("user_id", "username email phone_number")
      .populate("station_id", "name address")
      .populate("vehicle_id", "plate_number model brand")
      .populate("chargingPoint_id", "name type status");
    
    res.status(200).json(bookings);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ✅ GET BOOKING BY ID
exports.getBookingById = async (req, res) => {
  try {
    const { id } = req.params;
    const booking = await Booking.findById(id)
      .populate("user_id", "username email phone_number")
      .populate("station_id", "name address base_fee price_per_kwh")
      .populate("vehicle_id", "plate_number model brand batteryCapacity")
      .populate("chargingPoint_id", "name type status");
    
    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }
    
    res.status(200).json(booking);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ✅ UPDATE BOOKING BY ID
exports.updateBookingById = async (req, res) => {
  try {
    const { id } = req.params;
    const booking = await Booking.findByIdAndUpdate(id, req.body, {
      new: true,
      runValidators: true,
    })
      .populate("user_id", "username email phone_number")
      .populate("station_id", "name address")
      .populate("vehicle_id", "plate_number model brand")
      .populate("chargingPoint_id", "name type status");
    
    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }
    
    res.status(200).json({
      message: "Booking updated successfully",
      booking,
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// ✅ DELETE BOOKING BY ID
exports.deleteBookingById = async (req, res) => {
  try {
    const { id } = req.params;
    const booking = await Booking.findByIdAndDelete(id);
    
    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }
    
    res.status(200).json({
      message: "Booking deleted successfully",
      booking,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ✅ GET BOOKINGS BY USER ID
exports.getBookingsByUserId = async (req, res) => {
  try {
    const { userId } = req.params;
    const bookings = await Booking.find({ user_id: userId })
      .populate("station_id", "name address")
      .populate("vehicle_id", "plate_number model brand")
      .populate("chargingPoint_id", "name type status")
      .sort({ createdAt: -1 });
    
    res.status(200).json(bookings);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ✅ GET BOOKINGS BY STATION ID
exports.getBookingsByStationId = async (req, res) => {
  try {
    const { stationId } = req.params;
    const bookings = await Booking.find({ station_id: stationId })
      .populate("user_id", "username email phone_number")
      .populate("vehicle_id", "plate_number model brand")
      .populate("chargingPoint_id", "name type status")
      .sort({ createdAt: -1 });
    
    res.status(200).json(bookings);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ✅ CANCEL BOOKING
exports.cancelBooking = async (req, res) => {
  try {
    const { id } = req.params;
    const booking = await Booking.findById(id);
    
    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }
    
    if (booking.status === "completed" || booking.status === "cancelled") {
      return res.status(400).json({
        message: "Cannot cancel booking",
        currentStatus: booking.status,
      });
    }
    
    booking.status = "cancelled";
    await booking.save();
    
    res.status(200).json({
      message: "Booking cancelled successfully",
      booking,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ✅ CONFIRM BOOKING
exports.confirmBooking = async (req, res) => {
  try {
    const { id } = req.params;
    const booking = await Booking.findById(id)
      .populate("station_id", "name address base_fee price_per_kwh");

    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    if (booking.status !== "pending") {
      return res.status(400).json({
        message: "Only pending bookings can be confirmed",
        currentStatus: booking.status,
      });
    }

    booking.status = "confirmed";
    await booking.save();

    const updatedBooking = await Booking.findById(id)
      .populate("user_id", "username email phone_number")
      .populate("station_id", "name address base_fee price_per_kwh")
      .populate("vehicle_id", "plate_number model brand")
      .populate("chargingPoint_id", "name type status");

    res.status(200).json({
      message: "Booking confirmed successfully. You can now start charging.",
      booking: {
        id: updatedBooking._id,
        status: updatedBooking.status,
        
        station: updatedBooking.station_id.name,
        vehicle: `${updatedBooking.vehicle_id.model} - ${updatedBooking.vehicle_id.plate_number}`,
        
        schedule: {
          start_time: updatedBooking.start_time,
          end_time: updatedBooking.end_time,
        },
        
        pricing: {
          base_fee: `${updatedBooking.station_id.base_fee.toLocaleString('vi-VN')} VND`,
          price_per_kwh: `${updatedBooking.station_id.price_per_kwh.toLocaleString('vi-VN')} VND/kWh`,
        },
      },
      
      next_step: {
        action: "generate_qr_code",
        message: "Generate QR code to start charging session",
        qr_endpoint: `/api/charging-sessions/generate-qr/${id}`,
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
