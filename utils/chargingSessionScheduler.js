// utils/chargingSessionScheduler.js
const ChargingSession = require('../models/ChargingSession');
const ChargingPoint = require('../models/ChargingPoint');
const Vehicle = require('../models/Vehicle');
const Booking = require('../models/Booking');
const Invoice = require('../models/Invoice');
const VehicleSubscription = require('../models/VehicleSubscription');
const SubscriptionPlan = require('../models/SubscriptionPlan');
const { emitBatteryUpdate, emitSessionStatusChange } = require('../socket/socketService');

// Store active charging sessions being tracked
const activeChargingSessions = new Map();

/**
 * Calculate current battery percentage based on elapsed time and power capacity
 * Formula: Energy delivered = Power (kW) × Time (hours) × Efficiency (0.9)
 * Battery % = Initial % + (Energy delivered / Battery capacity) × 100
 */
async function calculateBatteryByTime(session) {
  try {
    // Get charging point and station
    const chargingPoint = await ChargingPoint.findById(session.chargingPoint_id).populate('stationId');
    if (!chargingPoint || !chargingPoint.stationId) {
      throw new Error('Charging point or station not found');
    }

    const power_capacity_kw = chargingPoint.stationId.power_capacity;
    const charging_efficiency = 0.90; // 90% efficiency

    // Get battery capacity
    let battery_capacity_kwh = null;
    if (session.vehicle_id) {
      const vehicle = await Vehicle.findById(session.vehicle_id);
      if (vehicle && vehicle.batteryCapacity) {
        battery_capacity_kwh = vehicle.batteryCapacity;
      }
    } else if (session.guest_battery_capacity) {
      battery_capacity_kwh = session.guest_battery_capacity;
    }

    if (!battery_capacity_kwh) {
      console.warn(`⚠️ Cannot calculate battery for session ${session._id}: No battery capacity`);
      return null;
    }

    // Calculate elapsed time
    const now = new Date();
    const elapsed_ms = now - session.start_time;
    const elapsed_hours = elapsed_ms / (1000 * 60 * 60);

    // Calculate energy delivered (kWh)
    const energy_delivered_kwh = power_capacity_kw * elapsed_hours * charging_efficiency;

    // Calculate battery percentage gained
    const battery_gained_percent = (energy_delivered_kwh / battery_capacity_kwh) * 100;

    // Calculate current battery percentage
    const current_battery = Math.min(
      100, // Never exceed 100%
      session.initial_battery_percentage + battery_gained_percent
    );

    return {
      current_battery: Math.round(current_battery * 10) / 10, // Round to 1 decimal
      energy_delivered_kwh: energy_delivered_kwh,
      elapsed_hours: elapsed_hours,
    };
  } catch (error) {
    console.error(`Error calculating battery for session ${session._id}:`, error.message);
    return null;
  }
}

/**
 * Update battery for a single charging session
 */
async function updateChargingSessionBattery(sessionId) {
  try {
    const session = await ChargingSession.findById(sessionId)
      .populate('chargingPoint_id')
      .populate('vehicle_id');

    if (!session || session.status !== 'in_progress') {
      // Remove from active tracking
      activeChargingSessions.delete(sessionId.toString());
      return;
    }

    // Calculate current battery based on time
    const batteryData = await calculateBatteryByTime(session);
    if (!batteryData) {
      return;
    }

    const target = session.target_battery_percentage || 100;
    const currentBattery = batteryData.current_battery;

    // Update session
    session.current_battery_percentage = currentBattery;
    
    // Check if reached target or 100%
    if (currentBattery >= 100 || currentBattery >= target) {
      // ✅ AUTO-COMPLETE: Tạo Invoice giống như endSession
      await autoCompleteSessionWithInvoice(session, currentBattery, target);

      // Emit socket event for completion
      emitSessionStatusChange(sessionId.toString(), {
        status: 'completed',
        message: '🔋 Session auto-stopped: Battery FULL',
        auto_stopped: true,
        final_battery: currentBattery,
        target_reached: currentBattery >= target,
      });

      // Remove from active tracking
      activeChargingSessions.delete(sessionId.toString());
      
      console.log(`✅ Session ${sessionId} auto-completed at ${currentBattery}%`);
      return;
    }

    // Save updated battery
    await session.save();

    // Calculate warnings
    let warning = null;
    if (currentBattery >= target && target < 100) {
      warning = {
        message: `⚡ Target battery ${target}% reached! You can stop charging now.`,
        target_reached: true,
        can_stop_now: true,
      };
    }

    // Check overtime
    let overtime_warning = null;
    if (session.booking_id) {
      const booking = await Booking.findById(session.booking_id);
      if (booking && booking.end_time) {
        const now = new Date();
        if (now > booking.end_time) {
          const overtimeMs = now - booking.end_time;
          const overtime_minutes = Math.ceil(overtimeMs / (1000 * 60));
          const overtime_fee_rate = 500;
          const current_overtime_fee = overtime_minutes * overtime_fee_rate;

          overtime_warning = {
            message: `⚠️ Đã quá thời gian booking! Đang tính phạt quá giờ.`,
            overtime_minutes: overtime_minutes,
            overtime_fee_rate: overtime_fee_rate + ' đ/phút',
            current_overtime_fee: current_overtime_fee,
            current_overtime_fee_formatted: current_overtime_fee.toLocaleString('vi-VN') + ' đ',
          };
        }
      }
    }

    // Emit socket event for battery update
    emitBatteryUpdate(sessionId.toString(), {
      battery: {
        initial: session.initial_battery_percentage,
        current: currentBattery,
        target: target,
        charged: currentBattery - session.initial_battery_percentage,
        remaining_to_target: Math.max(0, target - currentBattery),
        target_reached: currentBattery >= target,
      },
      warning: warning,
      overtime_warning: overtime_warning,
      can_continue: currentBattery < 100,
    });

    console.log(`📡 Updated battery for session ${sessionId}: ${currentBattery}%`);
  } catch (error) {
    console.error(`Error updating battery for session ${sessionId}:`, error);
  }
}

/**
 * Auto-complete session and create invoice (reuse logic from endSession)
 */
async function autoCompleteSessionWithInvoice(session, currentBattery, target) {
  try {
    // Set end time and status
    session.end_time = new Date();
    session.status = 'completed';
    
    // Calculate charges
    const calculation = await session.calculateCharges();
    await session.save();

    // Get related data
    let booking = null;
    if (session.booking_id) {
      booking = await Booking.findById(session.booking_id).populate('station_id');
    }

    let vehicle = null;
    if (session.vehicle_id) {
      vehicle = await Vehicle.findById(session.vehicle_id);
    }

    const chargingPoint = await ChargingPoint.findById(session.chargingPoint_id).populate('stationId');
    if (!chargingPoint || !chargingPoint.stationId) {
      throw new Error('Charging point or station not found');
    }
    const station = chargingPoint.stationId;

    const final_battery = calculation.final_battery_percentage;
    const target_reached = final_battery >= target;

    // Calculate duration
    const durationMs = session.end_time - session.start_time;
    const totalSeconds = Math.floor(durationMs / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    let durationFormatted = '';
    if (hours > 0) durationFormatted += `${hours} giờ `;
    if (minutes > 0) durationFormatted += `${minutes} phút `;
    if (seconds > 0 || totalSeconds === 0) durationFormatted += `${seconds} giây`;
    durationFormatted = durationFormatted.trim();

    // Check if direct charging
    const is_direct_charging = session.is_direct_charging || false;

    // Calculate overtime penalty
    let overtime_minutes = 0;
    let overtime_fee = 0;
    const overtime_fee_rate = 500;

    if (booking && booking.end_time) {
      if (session.end_time > booking.end_time) {
        const overtimeMs = session.end_time - booking.end_time;
        overtime_minutes = Math.ceil(overtimeMs / (1000 * 60));
        overtime_fee = overtime_minutes * overtime_fee_rate;
      }
    }

    // Check subscription & apply discount
    let discount_percentage = 0;
    let discount_amount = 0;
    let subscription_id = null;
    let subscription_plan_name = null;
    const original_charging_fee = calculation.charging_fee;
    const base_fee = is_direct_charging ? 0 : calculation.base_fee;

    if (vehicle && vehicle.vehicle_subscription_id) {
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

    // Calculate final amounts
    const discounted_charging_fee = original_charging_fee - discount_amount;
    const final_total_amount = base_fee + discounted_charging_fee + overtime_fee;
    const final_amount = discounted_charging_fee + overtime_fee;

    // Get vehicle info
    let vehicle_plate_number = null;
    let vehicle_model = null;

    if (vehicle) {
      vehicle_plate_number = vehicle.plate_number;
      vehicle_model = vehicle.model;
    } else if (session.guest_plate_number) {
      vehicle_plate_number = session.guest_plate_number;
      vehicle_model = session.guest_vehicle_model;
    }

    // ✅ CREATE INVOICE
    const invoice = await Invoice.create({
      session_id: session._id,
      user_id: booking ? booking.user_id : null,
      booking_id: booking ? booking._id : null,
      vehicle_id: vehicle ? vehicle._id : null,
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
      final_amount: final_amount,
      
      booking_end_time: booking ? booking.end_time : null,
      overtime_minutes: overtime_minutes,
      overtime_fee: overtime_fee,
      overtime_fee_rate: overtime_fee_rate,
      
      subscription_id: subscription_id,
      discount_percentage: discount_percentage > 0 ? discount_percentage : null,
      discount_amount: discount_amount > 0 ? discount_amount : null,
      
      station_name: station.name,
      station_address: station.address,
      vehicle_plate_number: vehicle_plate_number,
      vehicle_model: vehicle_model,
      
      payment_status: 'unpaid',
      payment_method: 'vnpay',
    });

    // Update charging point
    await ChargingPoint.findByIdAndUpdate(session.chargingPoint_id._id, {
      status: 'available',
      current_session_id: null,
    });

    // Update booking if exists
    if (booking) {
      await Booking.findByIdAndUpdate(session.booking_id, {
        status: 'completed',
      });
    }

    console.log(`📄 Invoice created for session ${session._id}: ${invoice._id}`);
    return invoice;
  } catch (error) {
    console.error(`Error creating invoice for session ${session._id}:`, error);
    throw error;
  }
}

/**
 * Process all active charging sessions
 */
async function processActiveChargingSessions() {
  try {
    // Find all in_progress sessions
    const activeSessions = await ChargingSession.find({
      status: 'in_progress',
      start_time: { $ne: null },
    }).select('_id');

    if (activeSessions.length > 0) {
      console.log(`🔄 Processing ${activeSessions.length} active charging sessions...`);
    }

    // Update each session
    for (const session of activeSessions) {
      await updateChargingSessionBattery(session._id);
    }
  } catch (error) {
    console.error('Error processing active charging sessions:', error);
  }
}

/**
 * Start charging session scheduler
 * Updates battery for all active sessions every few seconds
 */
function startChargingSessionScheduler(options = {}) {
  const intervalSeconds = options.intervalSeconds || 5; // Default: update every 5 seconds

  console.log(`⚡ Starting charging session scheduler (update every ${intervalSeconds} seconds)...`);

  // Run immediately on start
  processActiveChargingSessions();

  // Schedule periodic updates
  const interval = setInterval(async () => {
    await processActiveChargingSessions();
  }, intervalSeconds * 1000);

  // Store interval for potential cleanup
  return interval;
}

module.exports = {
  startChargingSessionScheduler,
  updateChargingSessionBattery,
  processActiveChargingSessions,
};

