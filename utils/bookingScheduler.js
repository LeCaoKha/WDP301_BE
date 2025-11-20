const cron = require("node-cron");
const Booking = require("../models/Booking");
const ChargingPoint = require("../models/ChargingPoint");
const ChargingSession = require("../models/ChargingSession");

/**
 * Check and activate bookings that have reached their start_time
 * This function finds all bookings with status "confirmed" that have reached their start_time
 * and updates their status to "active" and charging point status to "in_use"
 */
const activateBookingsAtStartTime = async () => {
  try {
    const now = new Date();

    // Find all confirmed bookings that have reached their start_time
    const bookingsToActivate = await Booking.find({
      status: "confirmed",
      start_time: { $lte: now },
    }).populate("chargingPoint_id");

    if (bookingsToActivate.length === 0) {
      return { activated: 0, updated: 0 };
    }

    let activatedCount = 0;
    let chargingPointsUpdated = 0;

    // Process each booking
    for (const booking of bookingsToActivate) {
      try {
        // Check if charging point is available
        const chargingPoint = booking.chargingPoint_id;
        
        if (!chargingPoint) {
          console.warn(`⚠️ Charging point not found for booking ${booking._id}`);
          continue;
        }

        // Only update if charging point is available
        if (chargingPoint.status === "available") {
          // Update booking status to active
          booking.status = "active";
          await booking.save();

          // Find associated charging session if exists
          const session = await ChargingSession.findOne({
            booking_id: booking._id,
            status: { $in: ["pending", "in_progress"] },
          });

          // Update charging point status to in_use
          const updateData = {
            status: "in_use",
          };

          // If session exists, link it to charging point
          if (session) {
            updateData.current_session_id = session._id;
          }

          await ChargingPoint.findByIdAndUpdate(chargingPoint._id, updateData);

          activatedCount++;
          chargingPointsUpdated++;

          console.log(
            `✅ Activated booking ${booking._id} and updated charging point ${chargingPoint._id} to in_use`
          );
        } else {
          console.warn(
            `⚠️ Charging point ${chargingPoint._id} is not available (status: ${chargingPoint.status}) for booking ${booking._id}`
          );
        }
      } catch (error) {
        console.error(
          `❌ Error processing booking ${booking._id}:`,
          error.message
        );
        // Continue with next booking
      }
    }

    if (activatedCount > 0) {
      console.log(
        `✅ Activated ${activatedCount} booking(s) and updated ${chargingPointsUpdated} charging point(s) to in_use`
      );
    }

    return {
      activated: activatedCount,
      updated: chargingPointsUpdated,
    };
  } catch (error) {
    console.error("❌ Error activating bookings at start time:", error.message);
    throw error;
  }
};

/**
 * Check and expire bookings that have passed their end_time
 * This function finds all bookings with status "active" or "confirmed" that have passed their end_time
 * and updates their status to "expired" and releases charging points
 */
const expirePastBookings = async () => {
  try {
    const now = new Date();

    // Find all active/confirmed bookings that have passed their end_time
    const expiredBookings = await Booking.find({
      status: { $in: ["active", "confirmed"] },
      end_time: { $lt: now },
    }).populate("chargingPoint_id");

    if (expiredBookings.length === 0) {
      return { expired: 0, released: 0 };
    }

    let expiredCount = 0;
    let chargingPointsReleased = 0;

    // Process each expired booking
    for (const booking of expiredBookings) {
      try {
        const chargingPoint = booking.chargingPoint_id;

        if (chargingPoint && chargingPoint.status === "in_use") {
          // Check if there's an active session
          const activeSession = await ChargingSession.findOne({
            booking_id: booking._id,
            status: "in_progress",
          });

          // Only release if no active session
          if (!activeSession) {
            await ChargingPoint.findByIdAndUpdate(chargingPoint._id, {
              status: "available",
              current_session_id: null,
            });
            chargingPointsReleased++;
          }
        }

        // Update booking status to expired
        booking.status = "expired";
        await booking.save();

        expiredCount++;

        console.log(`✅ Expired booking ${booking._id}`);
      } catch (error) {
        console.error(
          `❌ Error expiring booking ${booking._id}:`,
          error.message
        );
      }
    }

    if (expiredCount > 0) {
      console.log(
        `✅ Expired ${expiredCount} booking(s) and released ${chargingPointsReleased} charging point(s)`
      );
    }

    return {
      expired: expiredCount,
      released: chargingPointsReleased,
    };
  } catch (error) {
    console.error("❌ Error expiring past bookings:", error.message);
    throw error;
  }
};

/**
 * Middleware to check and activate bookings before processing request
 * This can be used in routes to ensure bookings are always up-to-date
 */
const checkBookingsMiddleware = async (req, res, next) => {
  try {
    await activateBookingsAtStartTime();
    await expirePastBookings();
    next();
  } catch (error) {
    // Don't block the request if update fails, just log the error
    console.error("Error in checkBookingsMiddleware:", error.message);
    next();
  }
};

/**
 * Start the booking scheduler using node-cron
 * This will schedule periodic checks for booking activation and expiration
 * @param {Object} options - Scheduler options
 * @param {number} options.intervalMinutes - Interval in minutes (default: 1)
 * @param {string} options.timezone - Timezone string (default: "Asia/Ho_Chi_Minh")
 * @returns {Object} - Cron task object for management (start, stop, destroy)
 */
const startBookingScheduler = (options = {}) => {
  const {
    intervalMinutes = parseInt(process.env.BOOKING_CHECK_INTERVAL) || 1,
    timezone = "Asia/Ho_Chi_Minh",
  } = options;

  // Build cron expression: runs every N minutes
  // Example: '*/1 * * * *' = every 1 minute, '*/5 * * * *' = every 5 minutes
  const cronExpression = `*/${intervalMinutes} * * * *`;

  console.log(`⏰ Starting booking scheduler (runs every ${intervalMinutes} minute(s))`);

  // Schedule the task using node-cron
  const task = cron.schedule(
    cronExpression,
    async () => {
      console.log(
        `⏰ Scheduled check for bookings to activate/expire... (interval: ${intervalMinutes} min)`
      );
      try {
        await activateBookingsAtStartTime();
        await expirePastBookings();
      } catch (error) {
        console.error("❌ Error in scheduled booking check:", error.message);
      }
    },
    {
      scheduled: true,
      timezone: timezone,
    }
  );

  return task;
};

module.exports = {
  activateBookingsAtStartTime,
  expirePastBookings,
  checkBookingsMiddleware,
  startBookingScheduler,
};