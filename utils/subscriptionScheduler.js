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

module.exports = {
  updateExpiredSubscriptions,
  checkExpiredSubscriptionsMiddleware,
};
