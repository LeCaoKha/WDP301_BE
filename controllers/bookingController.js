const Booking = require("../models/Booking");
const Account = require("../models/Account");
const Station = require("../models/Station");
const Vehicle = require("../models/Vehicle");
const ChargingPoint = require("../models/ChargingPoint");

// Create Booking
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
    if (!chargingPoint) {
      return res.status(400).json({ message: "Charging point not found" });
    }

    // Validate charging point belongs to the station
    // Note: ChargingPoint model uses `stationId` field
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

    const booking = await Booking.create({
      user_id,
      station_id,
      vehicle_id,
      chargingPoint_id,
      start_time: startTime,
      end_time: endTime,
    });

    // Populate the response
    const populatedBooking = await Booking.findById(booking._id)
      .populate("user_id", "username email role status")
      .populate("station_id", "name address location")
      .populate("vehicle_id", "license_plate model user_id company_id")
      .populate("chargingPoint_id", "name status power_rating");

    res.status(201).json(populatedBooking);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get all Bookings
exports.getAllBookings = async (req, res) => {
  try {
    const {
      user_id,
      station_id,
      vehicle_id,
      chargingPoint_id,
      status,
      start_date,
      end_date,
      page = 1,
      limit = 10,
    } = req.query;

    let filter = {};

    // Apply filters
    if (user_id) filter.user_id = user_id;
    if (station_id) filter.station_id = station_id;
    if (vehicle_id) filter.vehicle_id = vehicle_id;
    if (chargingPoint_id) filter.chargingPoint_id = chargingPoint_id;
    if (status) filter.status = status;

    // Date range filter
    if (start_date || end_date) {
      filter.start_time = {};
      if (start_date) filter.start_time.$gte = new Date(start_date);
      if (end_date) filter.start_time.$lte = new Date(end_date);
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const bookings = await Booking.find(filter)
      .populate("user_id", "username email role status")
      .populate("station_id", "name address location")
      .populate("vehicle_id", "license_plate model user_id company_id")
      .populate("chargingPoint_id", "name status power_rating")
      .sort({ start_time: 1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Booking.countDocuments(filter);

    res.status(200).json({
      bookings,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / parseInt(limit)),
        totalItems: total,
        itemsPerPage: parseInt(limit),
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get Booking by id
exports.getBookingById = async (req, res) => {
  try {
    const { id } = req.params;
    const booking = await Booking.findById(id)
      .populate("user_id", "username email role status")
      .populate("station_id", "name address location")
      .populate("vehicle_id", "license_plate model user_id company_id")
      .populate("chargingPoint_id", "name status power_rating");

    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    res.status(200).json(booking);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update Booking by id
exports.updateBookingById = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      user_id,
      station_id,
      vehicle_id,
      chargingPoint_id,
      start_time,
      end_time,
      status,
    } = req.body;

    // Validate user exists (if provided)
    if (user_id) {
      const user = await Account.findById(user_id);
      if (!user) {
        return res.status(400).json({ message: "User not found" });
      }
    }

    // Validate station exists (if provided)
    if (station_id) {
      const station = await Station.findById(station_id);
      if (!station) {
        return res.status(400).json({ message: "Station not found" });
      }
    }

    // Validate vehicle exists (if provided)
    if (vehicle_id) {
      const vehicle = await Vehicle.findById(vehicle_id);
      if (!vehicle) {
        return res.status(400).json({ message: "Vehicle not found" });
      }
    }

    // Validate charging point exists (if provided)
    if (chargingPoint_id) {
      const chargingPoint = await ChargingPoint.findById(chargingPoint_id);
      if (!chargingPoint) {
        return res.status(400).json({ message: "Charging point not found" });
      }
    }

    // Validate dates (if provided)
    if (start_time && end_time) {
      const startTime = new Date(start_time);
      const endTime = new Date(end_time);

      if (startTime >= endTime) {
        return res.status(400).json({
          message: "End time must be after start time",
        });
      }

      // Check for time conflicts with other bookings (excluding current booking)
      const conflictingBookings = await Booking.find({
        chargingPoint_id:
          chargingPoint_id || (await Booking.findById(id)).chargingPoint_id,
        _id: { $ne: id },
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
          message: "Time slot conflicts with existing bookings",
          conflictingBookings: conflictingBookings.map((booking) => ({
            id: booking._id,
            start_time: booking.start_time,
            end_time: booking.end_time,
            status: booking.status,
          })),
        });
      }
    }

    const updated = await Booking.findByIdAndUpdate(
      id,
      {
        user_id,
        station_id,
        vehicle_id,
        chargingPoint_id,
        start_time,
        end_time,
        status,
      },
      { new: true, runValidators: true }
    )
      .populate("user_id", "username email role status")
      .populate("station_id", "name address location")
      .populate("vehicle_id", "license_plate model user_id company_id")
      .populate("chargingPoint_id", "name status power_rating");

    if (!updated) {
      return res.status(404).json({ message: "Booking not found" });
    }

    res.status(200).json(updated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Delete Booking by id
exports.deleteBookingById = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await Booking.findByIdAndDelete(id);
    if (!deleted) {
      return res.status(404).json({ message: "Booking not found" });
    }
    res.status(200).json({ message: "Booking deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get bookings by user ID
exports.getBookingsByUserId = async (req, res) => {
  try {
    const { userId } = req.params;
    const { status, start_date, end_date } = req.query;

    let filter = { user_id: userId };

    if (status) filter.status = status;

    // Date range filter
    if (start_date || end_date) {
      filter.start_time = {};
      if (start_date) filter.start_time.$gte = new Date(start_date);
      if (end_date) filter.start_time.$lte = new Date(end_date);
    }

    const bookings = await Booking.find(filter)
      .populate("station_id", "name address location")
      .populate("vehicle_id", "license_plate model user_id company_id")
      .populate("chargingPoint_id", "name status power_rating")
      .sort({ start_time: 1 });

    res.status(200).json(bookings);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get bookings by station ID
exports.getBookingsByStationId = async (req, res) => {
  try {
    const { stationId } = req.params;
    const { status, start_date, end_date } = req.query;

    let filter = { station_id: stationId };

    if (status) filter.status = status;

    // Date range filter
    if (start_date || end_date) {
      filter.start_time = {};
      if (start_date) filter.start_time.$gte = new Date(start_date);
      if (end_date) filter.start_time.$lte = new Date(end_date);
    }

    const bookings = await Booking.find(filter)
      .populate("user_id", "username email role status")
      .populate("vehicle_id", "license_plate model user_id company_id")
      .populate("chargingPoint_id", "name status power_rating")
      .sort({ start_time: 1 });

    res.status(200).json(bookings);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Cancel booking
exports.cancelBooking = async (req, res) => {
  try {
    const { id } = req.params;
    const booking = await Booking.findById(id);

    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    if (!booking.canBeCancelled()) {
      return res.status(400).json({
        message: "Booking cannot be cancelled at this time",
        currentStatus: booking.status,
        startTime: booking.start_time,
      });
    }

    booking.status = "cancelled";
    await booking.save();

    const updatedBooking = await Booking.findById(id)
      .populate("user_id", "username email role status")
      .populate("station_id", "name address location")
      .populate("vehicle_id", "license_plate model user_id company_id")
      .populate("chargingPoint_id", "name status power_rating");

    res.status(200).json({
      message: "Booking cancelled successfully",
      booking: updatedBooking,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Confirm booking
exports.confirmBooking = async (req, res) => {
  try {
    const { id } = req.params;
    const booking = await Booking.findById(id);

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
      .populate("user_id", "username email role status")
      .populate("station_id", "name address location")
      .populate("vehicle_id", "license_plate model user_id company_id")
      .populate("chargingPoint_id", "name status power_rating");

    res.status(200).json({
      message: "Booking confirmed successfully",
      booking: updatedBooking,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get my bookings (current user's bookings)
exports.getMyBookings = async (req, res) => {
  try {
    // Get user ID from JWT token (set by auth middleware)
    const userId = req.user.accountId;
    const { status, start_date, end_date, page = 1, limit = 10 } = req.query;

    let filter = { user_id: userId };

    // Apply filters
    if (status) filter.status = status;

    // Date range filter
    if (start_date || end_date) {
      filter.start_time = {};
      if (start_date) filter.start_time.$gte = new Date(start_date);
      if (end_date) filter.start_time.$lte = new Date(end_date);
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const bookings = await Booking.find(filter)
      .populate("station_id", "name address location")
      .populate("vehicle_id", "license_plate model user_id company_id")
      .populate("chargingPoint_id", "name status power_rating")
      .sort({ start_time: 1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Booking.countDocuments(filter);

    res.status(200).json({
      bookings,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / parseInt(limit)),
        totalItems: total,
        itemsPerPage: parseInt(limit),
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
