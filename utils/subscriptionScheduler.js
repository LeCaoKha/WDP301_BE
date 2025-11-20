const cron = require("node-cron");
const VehicleSubscription = require("../models/VehicleSubscription");

/**
 * Check and update expired subscriptions
 * This function finds all subscriptions with status "active" that have passed their end_date
 * and updates their status to "expired"
 */
const updateExpiredSubscriptions = async () => {
  try {
    const now = new Date();

    // Find all active subscriptions that have expired
    const result = await VehicleSubscription.updateMany(
      {
        status: "active",
        end_date: { $lt: now },
      },
      {
        $set: { status: "expired" },
      }
    );

    if (result.modifiedCount > 0) {
      console.log(
        `✅ Updated ${result.modifiedCount} expired subscription(s) to "expired" status`
      );
    }

    return result;
  } catch (error) {
    console.error("❌ Error updating expired subscriptions:", error.message);
    throw error;
  }
};

/**
 * Middleware to check and update expired subscriptions before processing request
 * This can be used in routes to ensure subscriptions are always up-to-date
 */
const checkExpiredSubscriptionsMiddleware = async (req, res, next) => {
  try {
    await updateExpiredSubscriptions();
    next();
  } catch (error) {
    // Don't block the request if update fails, just log the error
    console.error(
      "Error in checkExpiredSubscriptionsMiddleware:",
      error.message
    );
    next();
  }
};

/**
 * Start the subscription scheduler using node-cron
 * This will schedule periodic checks for expired subscriptions
 * @param {Object} options - Scheduler options
 * @param {string} options.cronExpression - Cron expression (default: "0 * * * *" - every hour at minute 0)
 * @param {string} options.timezone - Timezone string (default: "Asia/Ho_Chi_Minh")
 * @returns {Object} - Cron task object for management (start, stop, destroy)
 */
const startSubscriptionScheduler = (options = {}) => {
  const {
    cronExpression = "0 * * * *", // Every hour at minute 0
    timezone = "Asia/Ho_Chi_Minh",
  } = options;

  console.log(
    `⏰ Starting subscription scheduler (runs every hour at minute 0)`
  );

  // Schedule the task using node-cron
  const task = cron.schedule(
    cronExpression,
    async () => {
      console.log("⏰ Scheduled check for expired subscriptions...");
      try {
        await updateExpiredSubscriptions();
      } catch (error) {
        console.error("❌ Error in scheduled subscription check:", error.message);
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
  updateExpiredSubscriptions,
  checkExpiredSubscriptionsMiddleware,
  startSubscriptionScheduler,
};
