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
    const { initial_battery_percentage, target_battery_percentage } = req.body;
    
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
    
    // Validate target (optional, mặc định = 100)
    const target = target_battery_percentage || 100;
    if (target <= initial_battery_percentage || target > 100) {
      return res.status(400).json({
        message: 'target_battery_percentage must be > initial and <= 100',
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
    session.target_battery_percentage = target; // ✅ LƯU TARGET
    session.current_battery_percentage = initial_battery_percentage; // ✅ INIT CURRENT
    await session.save();
    
    // Update charging point
    await ChargingPoint.findByIdAndUpdate(session.chargingPoint_id._id, {
      status: 'in_use',
    });
    
    // Update booking
    await Booking.findByIdAndUpdate(session.booking_id._id, {
      status: 'active',
    });
    
    // ✅ TÍNH THỜI GIAN ƯỚC TÍNH dựa trên công thức mới
    const vehicle = session.vehicle_id;
    const chargingPoint = session.chargingPoint_id;
    
    let estimated_time_info = null;
    if (vehicle.batteryCapacity) {
      // Năng lượng cần sạc (kWh)
      const battery_to_charge_percent = target - initial_battery_percentage;
      const energy_needed_kwh = (battery_to_charge_percent / 100) * vehicle.batteryCapacity;
      
      // Thời gian ước tính (giờ) - với hiệu suất 90%
      const charging_efficiency = 0.90;
      const estimated_hours = energy_needed_kwh / (chargingPoint.power_capacity * charging_efficiency);
      
      // Ước tính thời gian hoàn thành
      const estimated_completion = new Date(Date.now() + estimated_hours * 3600000);
      
      estimated_time_info = {
        energy_needed: energy_needed_kwh.toFixed(2) + ' kWh',
        estimated_time: estimated_hours.toFixed(2) + ' giờ',
        estimated_completion: estimated_completion.toISOString(),
        formula: `${energy_needed_kwh.toFixed(2)} kWh ÷ (${chargingPoint.power_capacity} kW × 0.9) = ${estimated_hours.toFixed(2)} giờ`,
      };
    }
    
    res.status(200).json({
      message: 'Charging session started successfully',
      session: {
        id: session._id,
        start_time: session.start_time,
        initial_battery: session.initial_battery_percentage + '%',
        target_battery: target + '%',
        battery_to_charge: (target - initial_battery_percentage) + '%',
        status: session.status,
        charging_point: {
          name: session.chargingPoint_id.name || 'N/A',
          power_capacity: session.chargingPoint_id.power_capacity + ' kW',
        },
        vehicle: {
          plate_number: session.vehicle_id.plate_number,
          model: session.vehicle_id.model,
          battery_capacity: vehicle.batteryCapacity ? vehicle.batteryCapacity + ' kWh' : 'N/A',
        },
        pricing: {
          base_fee: session.base_fee.toLocaleString('vi-VN') + ' VND',
          price_per_kwh: session.price_per_kwh.toLocaleString('vi-VN') + ' VND/kWh',
        },
        estimated_time: estimated_time_info,
      },
      instructions: {
        auto_stop: 'Session will auto-stop at 100%',
        manual_stop: 'You can stop anytime (even before reaching target)',
        target_warning: target < 100 ? `Will notify when reaching ${target}%` : null,
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
    const { final_battery_percentage } = req.body; // OPTIONAL: user nhập % cuối
    
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
    
    // ✅ Cho phép user nhập % pin cuối (nếu không có real-time update)
    if (final_battery_percentage !== undefined) {
      if (final_battery_percentage < session.initial_battery_percentage) {
        return res.status(400).json({
          message: 'Final battery cannot be less than initial battery',
          initial: session.initial_battery_percentage + '%',
          final: final_battery_percentage + '%',
        });
      }
      session.current_battery_percentage = Math.min(100, final_battery_percentage);
    }
    
    // End session
    session.end_time = new Date();
    session.status = 'completed';
    
    // Calculate charges
    const calculation = await session.calculateCharges();
    await session.save();
    
    // Update charging point & booking
    await ChargingPoint.findByIdAndUpdate(session.chargingPoint_id._id, {
      status: 'available',
    });
    
    await Booking.findByIdAndUpdate(session.booking_id._id, {
      status: 'completed',
    });
    
    // ✅ KIỂM TRA XEM CÓ ĐẠT TARGET KHÔNG
    const target = session.target_battery_percentage || 100;
    const final_battery = session.current_battery_percentage || session.initial_battery_percentage;
    const target_reached = final_battery >= target;
    
    res.status(200).json({
      message: 'Charging session ended successfully',
      target_status: target_reached 
        ? `✅ Target ${target}% reached!` 
        : `⚠️ Stopped early (Target: ${target}%, Actual: ${final_battery}%)`,
      session: {
        id: session._id,
        start_time: session.start_time,
        end_time: session.end_time,
        duration: calculation.charging_duration_formatted,
        duration_hours: calculation.charging_duration_hours + ' giờ',
        
        // BATTERY INFO
        initial_battery: calculation.initial_battery_percentage + '%',
        final_battery: calculation.final_battery_percentage + '%',
        target_battery: target + '%',
        battery_charged: calculation.battery_charged_percentage + '%',
        target_reached,
        
        // ENERGY INFO
        battery_capacity: calculation.battery_capacity_kwh + ' kWh',
        power_capacity: calculation.power_capacity_kw + ' kW',
        charging_efficiency: (calculation.charging_efficiency * 100) + '%',
        
        energy_needed: calculation.energy_needed_kwh + ' kWh',
        energy_delivered: calculation.actual_energy_delivered_kwh + ' kWh',
        
        calculation_method: calculation.calculation_method,
        formula: calculation.formula,
        
        status: session.status,
      },
      fee_calculation: {
        base_fee: calculation.base_fee,
        price_per_kwh: calculation.price_per_kwh,
        energy_charged: calculation.actual_energy_delivered_kwh + ' kWh',
        charging_fee: calculation.charging_fee,
        total_amount: calculation.total_amount,
        
        // Formatted
        base_fee_formatted: calculation.base_fee.toLocaleString('vi-VN') + ' VND',
        charging_fee_formatted: calculation.charging_fee.toLocaleString('vi-VN') + ' VND',
        total_amount_formatted: calculation.total_amount.toLocaleString('vi-VN') + ' VND',
        
        breakdown: `${calculation.base_fee.toLocaleString('vi-VN')} VND (phí cơ bản) + ${calculation.actual_energy_delivered_kwh} kWh × ${calculation.price_per_kwh.toLocaleString('vi-VN')} VND/kWh = ${calculation.total_amount.toLocaleString('vi-VN')} VND`,
      },
      payment_data: {
        session_id: session._id,
        user_id: session.booking_id.user_id,
        vehicle_id: session.vehicle_id._id,
        amount: calculation.total_amount,
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

// ============== NEW: UPDATE BATTERY LEVEL (Real-time từ IoT) =================
exports.updateBatteryLevel = async (req, res) => {
  try {
    const { session_id } = req.params;
    const { current_battery_percentage } = req.body;
    
    // Validate
    if (current_battery_percentage < 0 || current_battery_percentage > 100) {
      return res.status(400).json({ message: 'Invalid battery percentage (0-100)' });
    }
    
    const session = await ChargingSession.findById(session_id)
      .populate('chargingPoint_id')
      .populate('vehicle_id');
    
    if (!session || session.status !== 'in_progress') {
      return res.status(400).json({ 
        message: 'Session not active',
        current_status: session?.status 
      });
    }
    
    // Update current battery level
    session.current_battery_percentage = current_battery_percentage;
    
    // ✅ TỰ ĐỘNG NGẮT KHI ĐẠT 100% (Không cho phép vượt quá)
    if (current_battery_percentage >= 100) {
      session.end_time = new Date();
      session.status = 'completed';
      
      const calculation = await session.calculateCharges();
      await session.save();
      
      // Update charging point & booking
      await ChargingPoint.findByIdAndUpdate(session.chargingPoint_id._id, {
        status: 'available',
      });
      
      await Booking.findByIdAndUpdate(session.booking_id, {
        status: 'completed',
      });
      
      return res.status(200).json({
        message: '🔋 Session auto-stopped: Battery FULL (100%)',
        auto_stopped: true,
        session: {
          id: session._id,
          battery_charged: `${session.initial_battery_percentage}% → 100%`,
          duration: calculation.charging_duration_formatted,
          total_amount: Math.round(calculation.total_amount).toLocaleString('vi-VN') + ' VND',
        },
        calculation,
      });
    }
    
    // ⚠️ CẢNH BÁO KHI ĐẠT TARGET (nếu có set)
    const target = session.target_battery_percentage || 100;
    let warning = null;
    
    if (current_battery_percentage >= target && target < 100) {
      warning = {
        message: `⚡ Target battery ${target}% reached! You can stop charging now.`,
        target_reached: true,
        can_stop_now: true,
      };
    }
    
    await session.save();
    
    res.status(200).json({
      message: 'Battery level updated',
      battery_status: {
        initial: session.initial_battery_percentage + '%',
        current: current_battery_percentage + '%',
        target: target + '%',
        charged: (current_battery_percentage - session.initial_battery_percentage) + '%',
        remaining_to_target: Math.max(0, target - current_battery_percentage) + '%',
      },
      warning, // null nếu chưa đạt target
      can_continue: current_battery_percentage < 100,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};