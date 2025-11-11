const ChargingSession = require('../models/ChargingSession');
const Booking = require('../models/Booking');
const ChargingPoint = require('../models/ChargingPoint');
const crypto = require('crypto');
const Invoice = require('../models/Invoice');

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
    
    // Lấy giá từ Station
    const station = booking.station_id;
    const price_per_kwh = station.price_per_kwh || 3000; // Mặc định 3000 nếu không có
    const base_fee = station.base_fee || 10000; // Mặc định 10000 nếu không có
    
    // Create session
    session = await ChargingSession.create({
      booking_id: booking._id,
      chargingPoint_id: booking.chargingPoint_id._id,
      vehicle_id: booking.vehicle_id._id,
      qr_code_token: qrToken,
      status: 'pending',
      initial_battery_percentage: 0,
      price_per_kwh: price_per_kwh,
      base_fee: base_fee,
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
    const { qr_token, initial_battery_percentage, target_battery_percentage } = req.body;
    
    const session = await ChargingSession.findOne({
      qr_code_token: qr_token,
      status: 'pending',
    })
      .populate('booking_id')
      .populate('chargingPoint_id')
      .populate('vehicle_id');
    
    if (!session) {
      return res.status(404).json({
        message: 'Invalid QR code or session already started/expired',
      });
    }
    
    // ✅ KIỂM TRA BOOKING PHẢI CONFIRMED
    // TODO: TEMPORARILY DISABLED FOR DEMO - REMOVE AFTER PRESENTATION
    const booking = session.booking_id;
    // if (booking.status !== 'confirmed') {
    //   return res.status(400).json({
    //     message: 'Booking must be confirmed before starting session',
    //     current_booking_status: booking.status,
    //     required_status: 'confirmed',
    //     confirm_endpoint: `/api/bookings/${booking._id}/confirm`,
    //   });
    // }
    
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
    
    // Start session
    session.start_time = new Date();
    session.status = 'in_progress';
    session.initial_battery_percentage = initial_battery_percentage;
    session.target_battery_percentage = target; // ✅ LƯU TARGET
    session.current_battery_percentage = initial_battery_percentage; // ✅ INIT CURRENT
    await session.save();
    
    // Update booking
    await Booking.findByIdAndUpdate(session.booking_id._id, {
      status: 'active',
    });
    
    // ✅ TÍNH THỜI GIAN ƯỚC TÍNH dựa trên công thức mới
    const vehicle = session.vehicle_id;
    const chargingPoint = session.chargingPoint_id;
    
    // Lấy power_capacity từ Station
    await chargingPoint.populate('stationId');
    const power_capacity_kw = chargingPoint.stationId.power_capacity;
    
    let estimated_time_info = null;
    if (vehicle.batteryCapacity) {
      // Năng lượng cần sạc (kWh)
      const battery_to_charge_percent = target - initial_battery_percentage;
      const energy_needed_kwh = (battery_to_charge_percent / 100) * vehicle.batteryCapacity;
      
      // Thời gian ước tính (giờ) - với hiệu suất 90%
      const charging_efficiency = 0.90;
      const estimated_hours = energy_needed_kwh / (power_capacity_kw * charging_efficiency);
      
      // Ước tính thời gian hoàn thành
      const estimated_completion = new Date(Date.now() + estimated_hours * 3600000);
      
      estimated_time_info = {
        energy_needed: energy_needed_kwh.toFixed(2) + ' kWh',
        estimated_time: estimated_hours.toFixed(2) + ' giờ',
        estimated_completion: estimated_completion.toISOString(),
        formula: `${energy_needed_kwh.toFixed(2)} kWh ÷ (${power_capacity_kw} kW × 0.9) = ${estimated_hours.toFixed(2)} giờ`,
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
          power_capacity: power_capacity_kw + ' kW',
        },
        vehicle: {
          plate_number: session.vehicle_id.plate_number,
          model: session.vehicle_id.model,
          battery_capacity: vehicle.batteryCapacity ? vehicle.batteryCapacity + ' kWh' : 'N/A',
        },
        pricing: {
          base_fee: session.base_fee.toLocaleString('vi-VN') + ' đ',
          price_per_kwh: session.price_per_kwh.toLocaleString('vi-VN') + ' đ/kWh',
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
    const { final_battery_percentage } = req.body;
    
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
    
    session.end_time = new Date();
    session.status = 'completed';
    
    const calculation = await session.calculateCharges();
    await session.save();
    
    const booking = await session.booking_id.populate('station_id');
    const vehicle = session.vehicle_id;
    const station = booking.station_id;
    const chargingPoint = session.chargingPoint_id;
    
    const target = session.target_battery_percentage || 100;
    const final_battery = calculation.final_battery_percentage;
    const target_reached = final_battery >= target;
    
    // ✅ TÍNH THỜI GIAN CHÍNH XÁC (GIÂY)
    const durationMs = session.end_time - session.start_time;
    const totalSeconds = Math.floor(durationMs / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    
    // ✅ FORMAT DURATION
    let durationFormatted = '';
    if (hours > 0) durationFormatted += `${hours} giờ `;
    if (minutes > 0) durationFormatted += `${minutes} phút `;
    if (seconds > 0 || totalSeconds === 0) durationFormatted += `${seconds} giây`;
    durationFormatted = durationFormatted.trim();
    
    const invoice = await Invoice.create({
      // References
      session_id: session._id,
      user_id: booking.user_id,
      booking_id: booking._id,
      vehicle_id: vehicle._id,
      station_id: station._id,
      chargingPoint_id: chargingPoint._id,
      
      // Thời gian
      start_time: session.start_time,
      end_time: session.end_time,
      charging_duration_seconds: totalSeconds, // ✅ TỔNG GIÂY
      charging_duration_minutes: calculation.charging_duration_minutes,
      charging_duration_hours: parseFloat(calculation.charging_duration_hours),
      charging_duration_formatted: durationFormatted, // ✅ "1 giờ 30 phút 45 giây"
      
      // Battery
      initial_battery_percentage: calculation.initial_battery_percentage,
      final_battery_percentage: calculation.final_battery_percentage,
      target_battery_percentage: target,
      battery_charged_percentage: calculation.battery_charged_percentage,
      target_reached: target_reached,
      
      // Energy
      battery_capacity_kwh: calculation.battery_capacity_kwh,
      power_capacity_kw: calculation.power_capacity_kw,
      energy_delivered_kwh: parseFloat(calculation.actual_energy_delivered_kwh),
      charging_efficiency: calculation.charging_efficiency,
      calculation_method: calculation.calculation_method === 'Based on actual battery percentage' 
        ? 'battery_based' 
        : 'time_based',
      
      // Pricing
      base_fee: calculation.base_fee,
      price_per_kwh: calculation.price_per_kwh,
      charging_fee: calculation.charging_fee,
      total_amount: calculation.total_amount,
      
      // Additional Info
      station_name: station.name,
      station_address: station.address,
      vehicle_plate_number: vehicle.plate_number,
      vehicle_model: vehicle.model,
      
      payment_status: 'unpaid',
      payment_method: 'vnpay',
    });
    
    await ChargingPoint.findByIdAndUpdate(session.chargingPoint_id._id, {
      status: 'available',
    });
    
    await Booking.findByIdAndUpdate(session.booking_id._id, {
      status: 'completed',
    });
    
    res.status(200).json({
      message: 'Charging session ended successfully',
      target_status: target_reached 
        ? `✅ Đạt mục tiêu ${target}%` 
        : `⚠️ Dừng sớm (Mục tiêu: ${target}%, Thực tế: ${final_battery}%)`,
      
      session: {
        id: session._id,
        start_time: session.start_time,
        end_time: session.end_time,
        duration: durationFormatted, // ✅ "1 giờ 30 phút 45 giây"
        duration_seconds: totalSeconds, // ✅ TỔNG GIÂY
        duration_hours: calculation.charging_duration_hours + ' giờ',
        
        initial_battery: calculation.initial_battery_percentage + '%',
        final_battery: calculation.final_battery_percentage + '%',
        target_battery: target + '%',
        battery_charged: calculation.battery_charged_percentage + '%',
        target_reached,
        
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
        
        base_fee_formatted: calculation.base_fee.toLocaleString('vi-VN') + ' đ',
        charging_fee_formatted: calculation.charging_fee.toLocaleString('vi-VN') + ' đ',
        total_amount_formatted: calculation.total_amount.toLocaleString('vi-VN') + ' đ',
        
        breakdown: `${calculation.base_fee.toLocaleString('vi-VN')} đ (phí cơ bản) + ${calculation.actual_energy_delivered_kwh} kWh × ${calculation.price_per_kwh.toLocaleString('vi-VN')} đ/kWh = ${calculation.total_amount.toLocaleString('vi-VN')} đ`,
      },
      
      invoice: {
        invoice_id: invoice._id,
        created_at: invoice.createdAt,
        payment_status: invoice.payment_status,
        payment_method: invoice.payment_method,
        total_amount: `${invoice.total_amount.toLocaleString('vi-VN')} đ`,
      },
      
      payment_data: {
        session_id: session._id,
        user_id: booking.user_id,
        vehicle_id: vehicle._id,
        amount: calculation.total_amount,
        invoice_id: invoice._id,
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
          total_amount: Math.round(calculation.total_amount).toLocaleString('vi-VN') + ' đ',
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

// ============== 7. GET USER'S COMPLETED CHARGING HISTORY =================
exports.getUserChargingHistory = async (req, res) => {
  try {
    const { user_id } = req.params;
    const { 
      page = 1, 
      limit = 10,
      start_date,
      end_date,
      vehicle_id,
      station_id
    } = req.query;

    // Build filter
    let bookingFilter = { user_id };
    
    // Filter theo vehicle
    if (vehicle_id) {
      bookingFilter.vehicle_id = vehicle_id;
    }
    
    // Filter theo station
    if (station_id) {
      bookingFilter.station_id = station_id;
    }

    // Tìm tất cả bookings của user
    const bookings = await Booking.find(bookingFilter).select('_id');
    const bookingIds = bookings.map(b => b._id);

    // ✅ KIỂM TRA nếu user không có booking nào
    if (bookingIds.length === 0) {
      return res.status(200).json({
        charging_history: [],
        statistics: {
          total_sessions: 0,
          total_energy_delivered: '0.00 kWh',
          total_charging_time: '0 giờ 0 phút',
          total_amount_spent: '0 đ',
          average_battery_charged: '0.0%'
        },
        pagination: {
          currentPage: parseInt(page),
          totalPages: 0,
          totalItems: 0,
          itemsPerPage: parseInt(limit)
        }
      });
    }

    // Filter sessions - CHỈ LẤY COMPLETED
    let sessionFilter = {
      booking_id: { $in: bookingIds },
      status: 'completed' // ✅ CHỈ LẤY PHIÊN ĐÃ HOÀN THÀNH
    };

    // Filter theo thời gian
    if (start_date || end_date) {
      sessionFilter.end_time = {};
      if (start_date) sessionFilter.end_time.$gte = new Date(start_date);
      if (end_date) sessionFilter.end_time.$lte = new Date(end_date);
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Lấy sessions đã completed
    const sessions = await ChargingSession.find(sessionFilter)
      .populate({
        path: 'booking_id',
        populate: [
          { path: 'station_id', select: 'name address' },
          { path: 'user_id', select: 'username email' }
        ]
      })
      .populate('chargingPoint_id', 'name status')
      .populate('vehicle_id', 'plate_number model batteryCapacity')
      .sort({ end_time: -1 }) // Mới nhất trước
      .skip(skip)
      .limit(parseInt(limit));

    const total = await ChargingSession.countDocuments(sessionFilter);

    // Tính tổng thống kê
    const stats = await ChargingSession.aggregate([
      { $match: sessionFilter },
      {
        $group: {
          _id: null,
          total_sessions: { $sum: 1 },
          total_energy: { $sum: '$energy_delivered_kwh' },
          total_duration_minutes: { $sum: '$charging_duration_minutes' },
          total_amount: { $sum: '$total_amount' },
          avg_battery_charged: { $avg: '$battery_charged_percentage' }
        }
      }
    ]);

    const statistics = stats[0] || {
      total_sessions: 0,
      total_energy: 0,
      total_duration_minutes: 0,
      total_amount: 0,
      avg_battery_charged: 0
    };

    // Format response
    const formattedSessions = sessions.map(session => {
      const booking = session.booking_id;
      const station = booking?.station_id;
      const vehicle = session.vehicle_id;
      const chargingPoint = session.chargingPoint_id;

      // Tính duration
      const durationMs = session.end_time - session.start_time;
      const totalSeconds = Math.floor(durationMs / 1000);
      const hours = Math.floor(totalSeconds / 3600);
      const minutes = Math.floor((totalSeconds % 3600) / 60);
      
      let durationFormatted = '';
      if (hours > 0) durationFormatted += `${hours} giờ `;
      if (minutes > 0) durationFormatted += `${minutes} phút`;
      durationFormatted = durationFormatted.trim();

      return {
        session_id: session._id,
        
        // Thời gian
        start_time: session.start_time,
        end_time: session.end_time,
        duration: durationFormatted,
        duration_minutes: session.charging_duration_minutes,
        
        // Địa điểm
        station: {
          id: station?._id,
          name: station?.name,
          address: station?.address
        },
        charging_point: {
          id: chargingPoint?._id,
          name: chargingPoint?.name
        },
        
        // Xe
        vehicle: {
          id: vehicle?._id,
          plate_number: vehicle?.plate_number,
          model: vehicle?.model,
          battery_capacity: vehicle?.batteryCapacity ? `${vehicle.batteryCapacity} kWh` : 'N/A'
        },
        
        // Pin
        battery_info: {
          initial: `${session.initial_battery_percentage || 0}%`,
          final: `${session.final_battery_percentage || session.current_battery_percentage || 0}%`,
          target: `${session.target_battery_percentage || 100}%`,
          charged: `${session.battery_charged_percentage || 0}%`,
          target_reached: session.target_reached || false
        },
        
        // Năng lượng
        energy_delivered: `${session.energy_delivered_kwh?.toFixed(2) || 0} kWh`,
        power_capacity: session.power_capacity_kw ? `${session.power_capacity_kw} kW` : 'N/A',
        
        // Tiền
        pricing: {
          base_fee: session.base_fee ? `${session.base_fee.toLocaleString('vi-VN')} đ` : 'N/A',
          price_per_kwh: session.price_per_kwh ? `${session.price_per_kwh.toLocaleString('vi-VN')} đ/kWh` : 'N/A',
          charging_fee: session.charging_fee ? `${session.charging_fee.toLocaleString('vi-VN')} đ` : 'N/A',
          total_amount: session.total_amount ? `${session.total_amount.toLocaleString('vi-VN')} đ` : 'N/A'
        },
        
        status: session.status
      };
    });

    res.status(200).json({
      charging_history: formattedSessions,
      statistics: {
        total_sessions: statistics.total_sessions,
        total_energy_delivered: `${(statistics.total_energy || 0).toFixed(2)} kWh`,
        total_charging_time: `${Math.floor((statistics.total_duration_minutes || 0) / 60)} giờ ${(statistics.total_duration_minutes || 0) % 60} phút`,
        total_amount_spent: `${(statistics.total_amount || 0).toLocaleString('vi-VN')} đ`,
        average_battery_charged: `${(statistics.avg_battery_charged || 0).toFixed(1)}%`
      },
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / parseInt(limit)),
        totalItems: total,
        itemsPerPage: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Error in getUserChargingHistory:', error);
    res.status(500).json({ 
      message: error.message,
      error: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};