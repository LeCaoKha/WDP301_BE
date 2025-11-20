const ChargingSession = require('../models/ChargingSession');
const Booking = require('../models/Booking');
const ChargingPoint = require('../models/ChargingPoint');
const crypto = require('crypto');
const Invoice = require('../models/Invoice');
const Station = require('../models/Station');
const Vehicle = require('../models/Vehicle');
const Account = require('../models/Account');

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
    
    // Check if booking is expired or cancelled
    if (['expired', 'cancelled'].includes(booking.status)) {
      return res.status(400).json({
        message: 'Cannot generate QR code for expired or cancelled booking',
        current_status: booking.status,
        booking_id: booking._id,
      });
    }
    
    // Check if booking end_time has passed
    const now = new Date();
    if (booking.end_time < now) {
      return res.status(400).json({
        message: 'Booking has expired. Cannot generate QR code after booking end time',
        booking_end_time: booking.end_time,
        current_time: now,
        booking_id: booking._id,
      });
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
    
    // ✅ Check if booking is expired or cancelled
    if (!booking) {
      return res.status(404).json({
        message: 'Booking not found for this session',
      });
    }
    
    if (['expired', 'cancelled'].includes(booking.status)) {
      return res.status(400).json({
        message: 'Cannot start session for expired or cancelled booking',
        current_status: booking.status,
        booking_id: booking._id,
      });
    }
    
    // ✅ Check if booking end_time has passed (allow 15 minutes buffer for late arrival)
    const now = new Date();
    const bufferMinutes = 15; // Allow 15 minutes after end_time
    const allowedEndTime = new Date(booking.end_time.getTime() + bufferMinutes * 60 * 1000);
    
    if (now > allowedEndTime) {
      return res.status(400).json({
        message: 'Booking has expired. Cannot start session after booking end time',
        booking_end_time: booking.end_time,
        current_time: now,
        allowed_until: allowedEndTime,
        booking_id: booking._id,
        note: `Booking expired ${Math.round((now - booking.end_time) / (1000 * 60))} minutes ago`,
      });
    }
    
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

    // ✅ Check charging point status
    const chargingPoint = session.chargingPoint_id;
    if (chargingPoint.status !== 'available' && chargingPoint.status !== 'in_use') {
      return res.status(400).json({
        message: 'Charging point is not available',
        current_status: chargingPoint.status,
      });
    }
    
    // Start session
    session.start_time = new Date();
    session.status = 'in_progress';
    session.initial_battery_percentage = initial_battery_percentage;
    session.target_battery_percentage = target;
    session.current_battery_percentage = initial_battery_percentage;
    await session.save();
    
    // Update booking status to active
    await Booking.findByIdAndUpdate(session.booking_id._id, {
      status: 'active',
    });

    // ✅ Update charging point status to in_use and link session
    await ChargingPoint.findByIdAndUpdate(chargingPoint._id, {
      status: 'in_use',
      current_session_id: session._id,
    });
    
    // ✅ TÍNH THỜI GIAN ƯỚC TÍNH dựa trên công thức mới
    const vehicle = session.vehicle_id;
    
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
    
    // ============== CHECK IF DIRECT CHARGING (NO BASE FEE) =================
    const is_direct_charging = session.is_direct_charging || false;
    
    // ============== CALCULATE OVERTIME PENALTY =================
    // ✅ ÁP DỤNG CHO CẢ BOOKING VÀ DIRECT CHARGING
    // So sánh session.end_time với booking.end_time
    let overtime_minutes = 0;
    let overtime_fee = 0;
    const overtime_fee_rate = 500; // 500 đồng/phút

    if (booking && booking.end_time) {
      if (session.end_time > booking.end_time) {
        const overtimeMs = session.end_time - booking.end_time;
        overtime_minutes = Math.ceil(overtimeMs / (1000 * 60)); // Làm tròn lên
        overtime_fee = overtime_minutes * overtime_fee_rate;
        console.log(`⚠️ Overtime detected: ${overtime_minutes} phút, penalty: ${overtime_fee.toLocaleString('vi-VN')} đ`);
        console.log(`   Booking end: ${booking.end_time.toISOString()}, Session end: ${session.end_time.toISOString()}`);
      }
    }
    
    // ============== CHECK SUBSCRIPTION & APPLY DISCOUNT =================
    // ✅ DISCOUNT CHỈ ÁP DỤNG CHO CHARGING_FEE, KHÔNG ÁP DỤNG CHO BASE_FEE
    // Base fee đã được thanh toán khi confirm booking (hoặc = 0 nếu direct charging)
    const VehicleSubscription = require('../models/VehicleSubscription');
    const SubscriptionPlan = require('../models/SubscriptionPlan');
    
    let discount_percentage = 0;
    let discount_amount = 0;
    let subscription_id = null;
    let subscription_plan_name = null;
    const original_charging_fee = calculation.charging_fee;
    // ✅ Direct charging: base_fee = 0, Booking: base_fee từ calculation
    const base_fee = is_direct_charging ? 0 : calculation.base_fee;
    
    // Check if vehicle has active subscription
    if (vehicle.vehicle_subscription_id) {
      try {
        const vehicleSubscription = await VehicleSubscription.findById(vehicle.vehicle_subscription_id)
          .populate('subscription_id');
        
        if (vehicleSubscription && 
            vehicleSubscription.status === 'active' && 
            vehicleSubscription.subscription_id) {
          
          // Check if subscription is still valid (within date range)
          const now = new Date();
          if (now >= vehicleSubscription.start_date && now <= vehicleSubscription.end_date) {
            const subscriptionPlan = vehicleSubscription.subscription_id;
            const discountString = subscriptionPlan.discount || '0%';
            
            // Parse discount percentage (e.g., "15%" -> 15)
            discount_percentage = parseFloat(discountString.replace('%', '').trim()) || 0;
            
            if (discount_percentage > 0 && discount_percentage <= 100) {
              // ✅ DISCOUNT CHỈ ÁP DỤNG CHO CHARGING_FEE
              discount_amount = Math.round((original_charging_fee * discount_percentage) / 100);
              subscription_id = vehicleSubscription._id;
              subscription_plan_name = subscriptionPlan.name;
            }
          }
        }
      } catch (error) {
        // If subscription check fails, continue without discount
        console.error('Error checking subscription:', error.message);
      }
    }
    
    // Calculate discounted charging fee and final total amount
    const discounted_charging_fee = original_charging_fee - discount_amount;
    const final_total_amount = base_fee + discounted_charging_fee + overtime_fee; // ✅ Thêm overtime_fee
    // ✅ Final amount = charging_fee + overtime_fee (base_fee đã thanh toán khi confirm booking)
    const final_amount = discounted_charging_fee + overtime_fee;
    
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
      charging_fee: discounted_charging_fee, // ✅ Charging fee sau discount (để lưu vào invoice)
      original_charging_fee: original_charging_fee, // ✅ Charging fee trước discount (để lưu vào invoice)
      total_amount: final_total_amount, // ✅ Base fee + discounted charging fee + overtime_fee
      final_amount: final_amount, // ✅ Số tiền cần thanh toán: charging_fee + overtime_fee
      
      // Overtime Penalty
      booking_end_time: booking.end_time,
      overtime_minutes: overtime_minutes,
      overtime_fee: overtime_fee,
      overtime_fee_rate: overtime_fee_rate,
      
      // Subscription Discount (NEW)
      subscription_id: subscription_id,
      discount_percentage: discount_percentage > 0 ? discount_percentage : null,
      discount_amount: discount_amount > 0 ? discount_amount : null,
      
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
        original_charging_fee: original_charging_fee, // ✅ Charging fee trước discount
        charging_fee: discounted_charging_fee, // ✅ Charging fee sau discount
        total_amount: final_total_amount, // ✅ Base fee + discounted charging fee + overtime_fee
        
        base_fee_formatted: is_direct_charging 
          ? '0 đ (không có phí cơ bản - direct charging)'
          : calculation.base_fee.toLocaleString('vi-VN') + ' đ',
        original_charging_fee_formatted: original_charging_fee.toLocaleString('vi-VN') + ' đ',
        charging_fee_formatted: discounted_charging_fee.toLocaleString('vi-VN') + ' đ',
        total_amount_formatted: final_total_amount.toLocaleString('vi-VN') + ' đ',
        
        // Subscription discount info (if applicable)
        ...(discount_amount > 0 && {
          subscription_discount: {
            plan_name: subscription_plan_name,
            discount_percentage: discount_percentage + '%',
            discount_amount: discount_amount.toLocaleString('vi-VN') + ' đ',
            note: 'Discount chỉ áp dụng cho phí sạc (charging fee), không áp dụng cho phí cơ bản (base fee)',
          }
        }),
        
        // ✅ OVERTIME PENALTY
        overtime: {
          has_overtime: overtime_minutes > 0,
          overtime_minutes: overtime_minutes,
          overtime_fee_rate: overtime_fee_rate + ' đ/phút',
          overtime_fee: overtime_fee,
          overtime_fee_formatted: overtime_fee.toLocaleString('vi-VN') + ' đ',
          booking_end_time: booking.end_time ? booking.end_time.toISOString() : null,
          session_end_time: session.end_time.toISOString(),
          note: overtime_minutes > 0 
            ? `Sạc quá ${overtime_minutes} phút so với thời gian booking`
            : 'Không có phạt quá giờ',
        },
        
        breakdown: (() => {
          let breakdown = '';
          
          // Base fee (chỉ cho booking, không có cho direct charging)
          if (!is_direct_charging && calculation.base_fee > 0) {
            breakdown = discount_amount > 0
              ? `${calculation.base_fee.toLocaleString('vi-VN')} đ (phí cơ bản - đã thanh toán) + ${calculation.actual_energy_delivered_kwh} kWh × ${calculation.price_per_kwh.toLocaleString('vi-VN')} đ/kWh = ${original_charging_fee.toLocaleString('vi-VN')} đ - ${discount_amount.toLocaleString('vi-VN')} đ (giảm ${discount_percentage}% từ gói ${subscription_plan_name}) = ${discounted_charging_fee.toLocaleString('vi-VN')} đ`
              : `${calculation.base_fee.toLocaleString('vi-VN')} đ (phí cơ bản - đã thanh toán) + ${calculation.actual_energy_delivered_kwh} kWh × ${calculation.price_per_kwh.toLocaleString('vi-VN')} đ/kWh = ${discounted_charging_fee.toLocaleString('vi-VN')} đ`;
          } else {
            // Direct charging
            breakdown = discount_amount > 0
              ? `${calculation.actual_energy_delivered_kwh} kWh × ${calculation.price_per_kwh.toLocaleString('vi-VN')} đ/kWh = ${original_charging_fee.toLocaleString('vi-VN')} đ - ${discount_amount.toLocaleString('vi-VN')} đ (giảm ${discount_percentage}% từ gói ${subscription_plan_name}) = ${discounted_charging_fee.toLocaleString('vi-VN')} đ`
              : `${calculation.actual_energy_delivered_kwh} kWh × ${calculation.price_per_kwh.toLocaleString('vi-VN')} đ/kWh = ${discounted_charging_fee.toLocaleString('vi-VN')} đ`;
          }
          
          // ✅ Thêm overtime fee vào breakdown
          if (overtime_minutes > 0) {
            breakdown += ` + ${overtime_minutes} phút × ${overtime_fee_rate.toLocaleString('vi-VN')} đ/phút (phạt quá giờ) = ${overtime_fee.toLocaleString('vi-VN')} đ`;
          }
          
          breakdown += ` → Tổng: ${final_total_amount.toLocaleString('vi-VN')} đ`;
          
          return breakdown;
        })(),
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
        amount: discounted_charging_fee + overtime_fee, // ✅ Bao gồm cả overtime_fee
        invoice_id: invoice._id,
        note: is_direct_charging 
          ? overtime_minutes > 0
            ? `Direct charging: Chỉ thanh toán phí sạc + Phạt quá giờ (${overtime_minutes} phút × 500 đ/phút = ${overtime_fee.toLocaleString('vi-VN')} đ).`
            : 'Direct charging: Không có phí cơ bản. Chỉ thanh toán phí sạc.'
          : overtime_minutes > 0
            ? `Base fee đã được thanh toán khi confirm booking. Cần thanh toán: Charging fee + Phạt quá giờ (${overtime_minutes} phút × 500 đ/phút = ${overtime_fee.toLocaleString('vi-VN')} đ).`
            : 'Base fee đã được thanh toán khi confirm booking. Chỉ cần thanh toán charging fee.',
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
      
      // Populate booking với station_id để tính toán
      const booking = await Booking.findById(session.booking_id).populate('station_id');
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
      
      // ============== CHECK IF DIRECT CHARGING (NO BASE FEE) =================
      const is_direct_charging = session.is_direct_charging || false;
      
      // ============== CALCULATE OVERTIME PENALTY =================
      // ✅ ÁP DỤNG CHO CẢ BOOKING VÀ DIRECT CHARGING
      let overtime_minutes = 0;
      let overtime_fee = 0;
      const overtime_fee_rate = 500; // 500 đồng/phút

      if (booking && booking.end_time) {
        if (session.end_time > booking.end_time) {
          const overtimeMs = session.end_time - booking.end_time;
          overtime_minutes = Math.ceil(overtimeMs / (1000 * 60)); // Làm tròn lên
          overtime_fee = overtime_minutes * overtime_fee_rate;
          console.log(`⚠️ [Auto-stop] Overtime detected: ${overtime_minutes} phút, penalty: ${overtime_fee.toLocaleString('vi-VN')} đ`);
        }
      }
      
      // ============== CHECK SUBSCRIPTION & APPLY DISCOUNT =================
      const VehicleSubscription = require('../models/VehicleSubscription');
      const SubscriptionPlan = require('../models/SubscriptionPlan');
      const Invoice = require('../models/Invoice');
      
      let discount_percentage = 0;
      let discount_amount = 0;
      let subscription_id = null;
      let subscription_plan_name = null;
      const original_charging_fee = calculation.charging_fee;
      const base_fee = is_direct_charging ? 0 : calculation.base_fee;
      
      // Check if vehicle has active subscription
      if (vehicle.vehicle_subscription_id) {
        try {
          const vehicleSubscription = await VehicleSubscription.findById(vehicle.vehicle_subscription_id)
            .populate('subscription_id');
          
          if (vehicleSubscription && 
              vehicleSubscription.status === 'active' && 
              vehicleSubscription.subscription_id) {
            
            const now = new Date();
            if (now >= vehicleSubscription.start_date && now <= vehicleSubscription.end_date) {
              const subscriptionPlan = vehicleSubscription.subscription_id;
              const discountString = subscriptionPlan.discount || '0%';
              
              discount_percentage = parseFloat(discountString.replace('%', '').trim()) || 0;
              
              if (discount_percentage > 0 && discount_percentage <= 100) {
                discount_amount = Math.round((original_charging_fee * discount_percentage) / 100);
                subscription_id = vehicleSubscription._id;
                subscription_plan_name = subscriptionPlan.name;
              }
            }
          }
        } catch (error) {
          console.error('Error checking subscription:', error.message);
        }
      }
      
      // Calculate discounted charging fee and final total amount
      const discounted_charging_fee = original_charging_fee - discount_amount;
      const final_total_amount = base_fee + discounted_charging_fee + overtime_fee;
      // ✅ Final amount = charging_fee + overtime_fee (base_fee đã thanh toán khi confirm booking)
      const final_amount = discounted_charging_fee + overtime_fee;
      
      // Create invoice
      const invoice = await Invoice.create({
        session_id: session._id,
        user_id: booking.user_id,
        booking_id: booking._id,
        vehicle_id: vehicle._id,
        station_id: station._id,
        chargingPoint_id: chargingPoint._id,
        
        start_time: session.start_time,
        end_time: session.end_time,
        charging_duration_seconds: totalSeconds,
        charging_duration_minutes: calculation.charging_duration_minutes,
        charging_duration_hours: parseFloat(calculation.charging_duration_hours),
        charging_duration_formatted: durationFormatted,
        
        initial_battery_percentage: calculation.initial_battery_percentage,
        final_battery_percentage: calculation.final_battery_percentage,
        target_battery_percentage: target,
        battery_charged_percentage: calculation.battery_charged_percentage,
        target_reached: target_reached,
        
        battery_capacity_kwh: calculation.battery_capacity_kwh,
        power_capacity_kw: calculation.power_capacity_kw,
        energy_delivered_kwh: parseFloat(calculation.actual_energy_delivered_kwh),
        charging_efficiency: calculation.charging_efficiency,
        calculation_method: calculation.calculation_method === 'Based on actual battery percentage' 
          ? 'battery_based' 
          : 'time_based',
        
        base_fee: calculation.base_fee,
        price_per_kwh: calculation.price_per_kwh,
        charging_fee: discounted_charging_fee,
        original_charging_fee: original_charging_fee,
        total_amount: final_total_amount,
        final_amount: final_amount, // ✅ Số tiền cần thanh toán: charging_fee + overtime_fee
        
        booking_end_time: booking.end_time,
        overtime_minutes: overtime_minutes,
        overtime_fee: overtime_fee,
        overtime_fee_rate: overtime_fee_rate,
        
        subscription_id: subscription_id,
        discount_percentage: discount_percentage > 0 ? discount_percentage : null,
        discount_amount: discount_amount > 0 ? discount_amount : null,
        
        station_name: station.name,
        station_address: station.address,
        vehicle_plate_number: vehicle.plate_number,
        vehicle_model: vehicle.model,
        
        payment_status: 'unpaid',
        payment_method: 'vnpay',
      });
      
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
        target_status: `✅ Đạt mục tiêu 100%`,
        
        session: {
          id: session._id,
          start_time: session.start_time,
          end_time: session.end_time,
          duration: durationFormatted,
          duration_seconds: totalSeconds,
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
          original_charging_fee: original_charging_fee,
          charging_fee: discounted_charging_fee,
          
          base_fee_formatted: is_direct_charging 
            ? '0 đ (không có phí cơ bản - direct charging)'
            : calculation.base_fee.toLocaleString('vi-VN') + ' đ',
          original_charging_fee_formatted: original_charging_fee.toLocaleString('vi-VN') + ' đ',
          charging_fee_formatted: discounted_charging_fee.toLocaleString('vi-VN') + ' đ',
          total_amount_formatted: final_total_amount.toLocaleString('vi-VN') + ' đ',
          
          ...(discount_amount > 0 && {
            subscription_discount: {
              plan_name: subscription_plan_name,
              discount_percentage: discount_percentage + '%',
              discount_amount: discount_amount.toLocaleString('vi-VN') + ' đ',
              note: 'Discount chỉ áp dụng cho phí sạc (charging fee), không áp dụng cho phí cơ bản (base fee)',
            }
          }),
          
          overtime: {
            has_overtime: overtime_minutes > 0,
            overtime_minutes: overtime_minutes,
            overtime_fee_rate: overtime_fee_rate + ' đ/phút',
            overtime_fee: overtime_fee,
            overtime_fee_formatted: overtime_fee.toLocaleString('vi-VN') + ' đ',
            booking_end_time: booking.end_time ? booking.end_time.toISOString() : null,
            session_end_time: session.end_time.toISOString(),
            note: overtime_minutes > 0 
              ? `Sạc quá ${overtime_minutes} phút so với thời gian booking`
              : 'Không có phạt quá giờ',
          },
          
          total_amount: final_total_amount,
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
          amount: discounted_charging_fee + overtime_fee,
          invoice_id: invoice._id,
          note: is_direct_charging 
            ? overtime_minutes > 0
              ? `Direct charging: Chỉ thanh toán phí sạc + Phạt quá giờ (${overtime_minutes} phút × 500 đ/phút = ${overtime_fee.toLocaleString('vi-VN')} đ).`
              : 'Direct charging: Không có phí cơ bản. Chỉ thanh toán phí sạc.'
            : overtime_minutes > 0
              ? `Base fee đã được thanh toán khi confirm booking. Cần thanh toán: Charging fee + Phạt quá giờ (${overtime_minutes} phút × 500 đ/phút = ${overtime_fee.toLocaleString('vi-VN')} đ).`
              : 'Base fee đã được thanh toán khi confirm booking. Chỉ cần thanh toán charging fee.',
        },
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
    
    // ============== CHECK OVERTIME (REAL-TIME) =================
    // ✅ Tính phạt real-time nếu booking.end_time đã qua
    const booking = await Booking.findById(session.booking_id);
    let overtime_warning = null;
    const overtime_fee_rate = 500; // 500 đồng/phút
    
    if (booking && booking.end_time) {
      const now = new Date();
      if (now > booking.end_time) {
        // Booking end_time đã qua, đang tính phạt
        const overtimeMs = now - booking.end_time;
        const overtime_minutes = Math.ceil(overtimeMs / (1000 * 60)); // Làm tròn lên
        const current_overtime_fee = overtime_minutes * overtime_fee_rate;
        
        overtime_warning = {
          message: `⚠️ Đã quá thời gian booking! Đang tính phạt quá giờ.`,
          booking_end_time: booking.end_time.toISOString(),
          current_time: now.toISOString(),
          overtime_minutes: overtime_minutes,
          overtime_fee_rate: overtime_fee_rate + ' đ/phút',
          current_overtime_fee: current_overtime_fee,
          current_overtime_fee_formatted: current_overtime_fee.toLocaleString('vi-VN') + ' đ',
          note: `Phạt sẽ tiếp tục tính cho đến khi session kết thúc. Hiện tại: ${overtime_minutes} phút × ${overtime_fee_rate} đ/phút = ${current_overtime_fee.toLocaleString('vi-VN')} đ`,
        };
        
        console.log(`⚠️ [Real-time] Overtime in progress: ${overtime_minutes} phút, current penalty: ${current_overtime_fee.toLocaleString('vi-VN')} đ`);
      }
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
      overtime_warning, // null nếu chưa quá booking.end_time
      can_continue: current_battery_percentage < 100,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ============== NEW: START DIRECT CHARGING (WITHOUT BOOKING) =================
/**
 * Start charging session directly without pre-booking
 * Automatically creates a booking and starts the session immediately
 * 
 * @route POST /api/charging-sessions/start-direct
 * @body {string} user_id - User ID
 * @body {string} vehicle_id - Vehicle ID
 * @body {string} chargingPoint_id - Charging Point ID
 * @body {number} initial_battery_percentage - Initial battery percentage (0-100)
 * @body {number} target_battery_percentage - Target battery percentage (optional, default: 100)
 */
exports.startDirectCharging = async (req, res) => {
  try {
    const {
      user_id,
      vehicle_id,
      chargingPoint_id,
      initial_battery_percentage,
      target_battery_percentage,
    } = req.body;

    // Validate required fields
    if (!user_id || !vehicle_id || !chargingPoint_id) {
      return res.status(400).json({
        message: 'user_id, vehicle_id, and chargingPoint_id are required',
      });
    }

    if (
      initial_battery_percentage === undefined ||
      initial_battery_percentage < 0 ||
      initial_battery_percentage > 100
    ) {
      return res.status(400).json({
        message: 'initial_battery_percentage is required (0-100)',
      });
    }

    // Validate target (optional, default = 100)
    const target = target_battery_percentage || 100;
    if (target <= initial_battery_percentage || target > 100) {
      return res.status(400).json({
        message: 'target_battery_percentage must be > initial and <= 100',
      });
    }

    // Validate user exists
    const user = await Account.findById(user_id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Validate vehicle exists and belongs to user
    const vehicle = await Vehicle.findById(vehicle_id);
    if (!vehicle) {
      return res.status(404).json({ message: 'Vehicle not found' });
    }
    if (vehicle.user_id.toString() !== user_id) {
      return res.status(403).json({
        message: 'Vehicle does not belong to this user',
      });
    }

    // Validate charging point exists
    const chargingPoint = await ChargingPoint.findById(chargingPoint_id).populate('stationId');
    if (!chargingPoint) {
      return res.status(404).json({ message: 'Charging point not found' });
    }

    // Check charging point status
    if (chargingPoint.status !== 'available') {
      return res.status(400).json({
        message: 'Charging point is not available',
        current_status: chargingPoint.status,
      });
    }

    // Check if charging point type allows direct usage (offline) or online
    // Both types can be used for direct charging, but offline is preferred
    if (chargingPoint.type !== 'offline' && chargingPoint.type !== 'online') {
      return res.status(400).json({
        message: 'Invalid charging point type',
        current_type: chargingPoint.type,
      });
    }

    // Get station info for pricing
    const station = chargingPoint.stationId;
    if (!station) {
      return res.status(404).json({ message: 'Station not found' });
    }

    const price_per_kwh = station.price_per_kwh || 3000;
    const base_fee = station.base_fee || 10000;
    const power_capacity_kw = station.power_capacity;

    // Calculate estimated end time (based on battery capacity and power)
    const now = new Date();
    let estimatedEndTime = new Date(now.getTime() + 2 * 60 * 60 * 1000); // Default: 2 hours
    
    if (vehicle.batteryCapacity) {
      const battery_to_charge_percent = target - initial_battery_percentage;
      const energy_needed_kwh = (battery_to_charge_percent / 100) * vehicle.batteryCapacity;
      const charging_efficiency = 0.90;
      const estimated_hours = energy_needed_kwh / (power_capacity_kw * charging_efficiency);
      estimatedEndTime = new Date(now.getTime() + estimated_hours * 3600000);
      
      // Add 30 minutes buffer
      estimatedEndTime = new Date(estimatedEndTime.getTime() + 30 * 60 * 1000);
    }

    // Create booking automatically with status 'active'
    const booking = await Booking.create({
      user_id: user_id,
      station_id: station._id,
      vehicle_id: vehicle_id,
      chargingPoint_id: chargingPoint_id,
      start_time: now,
      end_time: estimatedEndTime,
      status: 'active', // Set to active immediately
    });

    // Generate QR token (optional, for consistency)
    const qrToken = crypto.randomBytes(32).toString('hex');

    // Create charging session
    const session = await ChargingSession.create({
      booking_id: booking._id,
      chargingPoint_id: chargingPoint_id,
      vehicle_id: vehicle_id,
      qr_code_token: qrToken,
      status: 'in_progress', // Start immediately
      start_time: now,
      initial_battery_percentage: initial_battery_percentage,
      current_battery_percentage: initial_battery_percentage,
      target_battery_percentage: target,
      price_per_kwh: price_per_kwh,
      base_fee: 0, // ✅ Direct charging: KHÔNG CÓ BASE FEE
      is_direct_charging: true, // ✅ Đánh dấu là direct charging
    });

    // Update charging point status to in_use
    await ChargingPoint.findByIdAndUpdate(chargingPoint_id, {
      status: 'in_use',
    });

    // Calculate estimated time info
    let estimated_time_info = null;
    if (vehicle.batteryCapacity) {
      const battery_to_charge_percent = target - initial_battery_percentage;
      const energy_needed_kwh = (battery_to_charge_percent / 100) * vehicle.batteryCapacity;
      const charging_efficiency = 0.90;
      const estimated_hours = energy_needed_kwh / (power_capacity_kw * charging_efficiency);
      const estimated_completion = new Date(Date.now() + estimated_hours * 3600000);

      estimated_time_info = {
        energy_needed: energy_needed_kwh.toFixed(2) + ' kWh',
        estimated_time: estimated_hours.toFixed(2) + ' giờ',
        estimated_completion: estimated_completion.toISOString(),
        formula: `${energy_needed_kwh.toFixed(2)} kWh ÷ (${power_capacity_kw} kW × 0.9) = ${estimated_hours.toFixed(2)} giờ`,
      };
    }

    // Populate session for response
    await session.populate([
      { path: 'chargingPoint_id', select: 'name status type' },
      { path: 'vehicle_id', select: 'plate_number model batteryCapacity' },
      { path: 'booking_id', select: 'status start_time end_time' },
    ]);

    res.status(201).json({
      message: 'Direct charging session started successfully',
      session: {
        id: session._id,
        booking_id: booking._id,
        start_time: session.start_time,
        initial_battery: session.initial_battery_percentage + '%',
        target_battery: target + '%',
        battery_to_charge: (target - initial_battery_percentage) + '%',
        status: session.status,
        charging_point: {
          id: session.chargingPoint_id._id,
          name: session.chargingPoint_id.name || 'N/A',
          type: session.chargingPoint_id.type,
          power_capacity: power_capacity_kw + ' kW',
        },
        vehicle: {
          id: session.vehicle_id._id,
          plate_number: session.vehicle_id.plate_number,
          model: session.vehicle_id.model,
          battery_capacity: vehicle.batteryCapacity ? vehicle.batteryCapacity + ' kWh' : 'N/A',
        },
        station: {
          id: station._id,
          name: station.name,
          address: station.address,
        },
        pricing: {
          base_fee: '0 đ (không có phí cơ bản - direct charging)',
          price_per_kwh: session.price_per_kwh.toLocaleString('vi-VN') + ' đ/kWh',
          note: 'Direct charging: Chỉ tính phí sạc theo năng lượng sử dụng, không có phí cơ bản.',
        },
        estimated_time: estimated_time_info,
      },
      booking_info: {
        id: booking._id,
        status: booking.status,
        start_time: booking.start_time,
        estimated_end_time: estimatedEndTime,
      },
      instructions: {
        auto_stop: 'Session will auto-stop at 100%',
        manual_stop: 'You can stop anytime using POST /api/charging-sessions/:session_id/end',
        update_battery: 'Update battery level using PATCH /api/charging-sessions/:session_id/battery',
        target_warning: target < 100 ? `Will notify when reaching ${target}%` : null,
      },
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