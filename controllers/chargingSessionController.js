const ChargingSession = require('../models/ChargingSession');
const Booking = require('../models/Booking');
const ChargingPoint = require('../models/ChargingPoint');
const crypto = require('crypto');

// ============== 1. GENERATE QR CODE =================
exports.generateQRCode = async (req, res) => {
  try {
    const { booking_id } = req.params;
    
    const booking = await Booking.findById(booking_id)
      .populate('chargingPoint_id')
      .populate('vehicle_id')
      .populate('station_id');
    
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }
    
    if (!['confirmed', 'pending'].includes(booking.status)) {
      return res.status(400).json({
        message: 'Booking must be confirmed or pending',
        current_status: booking.status,
      });
    }
    
    // Kiểm tra đã có session chưa
    let session = await ChargingSession.findOne({
      booking_id: booking_id,
      status: { $in: ['pending', 'in_progress'] },
    });
    
    if (session && session.qr_code_token) {
      return res.status(200).json({
        message: 'QR Code already exists',
        session_id: session._id,
        qr_code_token: session.qr_code_token,
        qr_url: `${req.protocol}://${req.get('host')}/api/charging-sessions/start/${session.qr_code_token}`,
      });
    }
    
    // Generate QR token
    const qrToken = crypto.randomBytes(32).toString('hex');
    
    // Create session
    session = await ChargingSession.create({
      booking_id: booking._id,
      chargingPoint_id: booking.chargingPoint_id._id,
      vehicle_id: booking.vehicle_id._id,
      qr_code_token: qrToken,
      status: 'pending',
      initial_battery_percentage: 0,
      price_per_kwh: 3000,
      base_fee: 10000,
    });
    
    const qrUrl = `${req.protocol}://${req.get('host')}/api/charging-sessions/start/${qrToken}`;
    
    res.status(201).json({
      message: 'QR Code generated successfully',
      session_id: session._id,
      qr_code_token: qrToken,
      qr_url: qrUrl,
      booking_info: {
        id: booking._id,
        station: booking.station_id?.name,
        charging_point: booking.chargingPoint_id?.name,
        vehicle: booking.vehicle_id?.plate_number,
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ============== 2. START SESSION =================
exports.startSessionByQr = async (req, res) => {
  try {
    const { qr_token } = req.params;
    const { initial_battery_percentage } = req.body;
    
    // Validate
    if (
      initial_battery_percentage === undefined ||
      initial_battery_percentage < 0 ||
      initial_battery_percentage > 100
    ) {
      return res.status(400).json({
        message: 'initial_battery_percentage is required (0-100)',
      });
    }
    
    // Find session
    const session = await ChargingSession.findOne({
      qr_code_token: qr_token,
    })
      .populate('booking_id')
      .populate('chargingPoint_id')
      .populate('vehicle_id');
    
    if (!session) {
      return res.status(404).json({ message: 'Invalid QR code' });
    }
    
    if (session.start_time) {
      return res.status(400).json({
        message: 'Session already started',
        started_at: session.start_time,
      });
    }
    
    if (session.chargingPoint_id.status !== 'available') {
      return res.status(400).json({
        message: `Charging point is ${session.chargingPoint_id.status}`,
      });
    }
    
    // Start session
    session.start_time = new Date();
    session.status = 'in_progress';
    session.initial_battery_percentage = initial_battery_percentage;
    await session.save();
    
    // Update charging point
    await ChargingPoint.findByIdAndUpdate(session.chargingPoint_id._id, {
      status: 'in_use',
    });
    
    // Update booking
    await Booking.findByIdAndUpdate(session.booking_id._id, {
      status: 'active',
    });
    
    res.status(200).json({
      message: 'Charging session started successfully',
      session: {
        id: session._id,
        start_time: session.start_time,
        initial_battery: session.initial_battery_percentage + '%',
        status: session.status,
        charging_point: {
          name: session.chargingPoint_id.name || 'N/A',
          power_capacity: session.chargingPoint_id.power_capacity + ' kW',
        },
        vehicle: {
          plate_number: session.vehicle_id.plate_number,
          model: session.vehicle_id.model,
        },
        pricing: {
          base_fee: session.base_fee.toLocaleString('vi-VN') + ' VND',
          price_per_kwh: session.price_per_kwh.toLocaleString('vi-VN') + ' VND/kWh',
        },
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ============== 3. END SESSION =================
exports.endSession = async (req, res) => {
  try {
    const { session_id } = req.params;
    
    const session = await ChargingSession.findById(session_id)
      .populate('booking_id')
      .populate('chargingPoint_id')
      .populate('vehicle_id');
    
    if (!session) {
      return res.status(404).json({ message: 'Session not found' });
    }
    
    if (session.status !== 'in_progress') {
      return res.status(400).json({
        message: 'Session is not in progress',
        current_status: session.status,
      });
    }
    
    if (!session.start_time) {
      return res.status(400).json({ message: 'Session has not started' });
    }
    
    // End session
    session.end_time = new Date();
    session.status = 'completed';
    
    // Calculate charges
    const calculation = await session.calculateCharges();
    await session.save();
    
    // Update charging point
    await ChargingPoint.findByIdAndUpdate(session.chargingPoint_id._id, {
      status: 'available',
    });
    
    // Update booking
    await Booking.findByIdAndUpdate(session.booking_id._id, {
      status: 'completed',
    });
    
    res.status(200).json({
      message: 'Charging session ended successfully',
      session: {
        id: session._id,
        start_time: session.start_time,
        end_time: session.end_time,
        duration: calculation.charging_duration_formatted,
        duration_minutes: calculation.charging_duration_minutes,
        initial_battery: session.initial_battery_percentage + '%',
        energy_delivered: calculation.energy_delivered_kwh.toFixed(2) + ' kWh',
        status: session.status,
      },
      fee_calculation: {
        base_fee: calculation.base_fee,
        charging_fee: Math.round(calculation.charging_fee),
        total_amount: Math.round(calculation.total_amount),
        base_fee_formatted: calculation.base_fee.toLocaleString('vi-VN') + ' VND',
        charging_fee_formatted: Math.round(calculation.charging_fee).toLocaleString('vi-VN') + ' VND',
        total_amount_formatted: Math.round(calculation.total_amount).toLocaleString('vi-VN') + ' VND',
      },
      payment_data: {
        session_id: session._id,
        user_id: session.booking_id.user_id,
        vehicle_id: session.vehicle_id._id,
        amount: Math.round(calculation.total_amount),
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ============== 4. GET SESSION BY ID =================
exports.getSessionById = async (req, res) => {
  try {
    const { session_id } = req.params;
    
    const session = await ChargingSession.findById(session_id)
      .populate({
        path: 'booking_id',
        populate: { path: 'user_id', select: 'username email' },
      })
      .populate('chargingPoint_id')
      .populate('vehicle_id');
    
    if (!session) {
      return res.status(404).json({ message: 'Session not found' });
    }
    
    res.status(200).json(session);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ============== 5. GET ALL SESSIONS =================
exports.getAllSessions = async (req, res) => {
  try {
    const { status, user_id, page = 1, limit = 10 } = req.query;
    
    let filter = {};
    if (status) filter.status = status;
    
    if (user_id) {
      const bookings = await Booking.find({ user_id });
      const bookingIds = bookings.map((b) => b._id);
      filter.booking_id = { $in: bookingIds };
    }
    
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const sessions = await ChargingSession.find(filter)
      .populate({
        path: 'booking_id',
        populate: { path: 'user_id', select: 'username email' },
      })
      .populate('chargingPoint_id')
      .populate('vehicle_id')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));
    
    const total = await ChargingSession.countDocuments(filter);
    
    res.status(200).json({
      sessions,
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

// ============== 6. CANCEL SESSION =================
exports.cancelSession = async (req, res) => {
  try {
    const { session_id } = req.params;
    
    const session = await ChargingSession.findById(session_id)
      .populate('chargingPoint_id');
    
    if (!session) {
      return res.status(404).json({ message: 'Session not found' });
    }
    
    if (session.status === 'completed') {
      return res.status(400).json({ message: 'Cannot cancel completed session' });
    }
    
    session.status = 'cancelled';
    if (session.start_time && !session.end_time) {
      session.end_time = new Date();
    }
    await session.save();
    
    // Update charging point
    if (session.chargingPoint_id) {
      await ChargingPoint.findByIdAndUpdate(session.chargingPoint_id._id, {
        status: 'available',
      });
    }
    
    res.status(200).json({
      message: 'Session cancelled successfully',
      session,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};