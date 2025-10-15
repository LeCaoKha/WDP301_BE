const VehicleSubscription = require("../models/VehicleSubscription");
const Vehicle = require("../models/Vehicle");
const SubscriptionPlan = require("../models/SubscriptionPlan");

// Create Vehicle Subscription
exports.createVehicleSubscription = async (req, res) => {
  try {
    const {
      vehicle_id,
      subscription_id,
      start_date,
      end_date,
      auto_renew,
      payment_status,
    } = req.body;

    // Validate vehicle exists
    const vehicle = await Vehicle.findById(vehicle_id);
    if (!vehicle) {
      return res.status(400).json({ message: "Vehicle not found" });
    }

    // Validate subscription plan exists
    const subscriptionPlan = await SubscriptionPlan.findById(subscription_id);
    if (!subscriptionPlan) {
      return res.status(400).json({ message: "Subscription plan not found" });
    }

    // Check if vehicle already has any subscription (active, expired, cancelled, suspended)
    const existingSubscription = await VehicleSubscription.findOne({
      vehicle_id,
      status: { $in: ["active", "expired", "cancelled", "suspended"] },
    });

    if (existingSubscription) {
      return res.status(400).json({
        message:
          "Vehicle already has a subscription. Each vehicle can only have one subscription at a time.",
        existingSubscription: {
          id: existingSubscription._id,
          status: existingSubscription.status,
          start_date: existingSubscription.start_date,
          end_date: existingSubscription.end_date,
        },
      });
    }

    // Validate dates
    const startDate = new Date(start_date);
    const endDate = new Date(end_date);

    if (startDate >= endDate) {
      return res.status(400).json({
        message: "End date must be after start date",
      });
    }

    const vehicleSubscription = await VehicleSubscription.create({
      vehicle_id,
      subscription_id,
      start_date: startDate,
      end_date: endDate,
      auto_renew,
      payment_status,
    });

    // Update vehicle with the subscription_id
    await Vehicle.findByIdAndUpdate(vehicle_id, {
      subscription_id: subscription_id,
    });

    // Populate the response
    const populatedSubscription = await VehicleSubscription.findById(
      vehicleSubscription._id
    )
      .populate("vehicle_id", "plate_number model user_id company_id")
      .populate(
        "subscription_id",
        "name price billing_cycle limit_type limit_value"
      );

    res.status(201).json(populatedSubscription);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get all Vehicle Subscriptions
exports.getAllVehicleSubscriptions = async (req, res) => {
  try {
    const {
      vehicle_id,
      subscription_id,
      status,
      payment_status,
      is_active,
      page = 1,
      limit = 10,
    } = req.query;

    let filter = {};

    // Apply filters
    if (vehicle_id) filter.vehicle_id = vehicle_id;
    if (subscription_id) filter.subscription_id = subscription_id;
    if (status) filter.status = status;
    if (payment_status) filter.payment_status = payment_status;

    // Filter for currently active subscriptions
    if (is_active === "true") {
      const now = new Date();
      filter.status = "active";
      filter.start_date = { $lte: now };
      filter.end_date = { $gte: now };
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const vehicleSubscriptions = await VehicleSubscription.find(filter)
      .populate("vehicle_id", "plate_number model user_id company_id")
      .populate(
        "subscription_id",
        "name price billing_cycle limit_type limit_value"
      )
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await VehicleSubscription.countDocuments(filter);

    res.status(200).json({
      vehicleSubscriptions,
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

// Get Vehicle Subscription by id
exports.getVehicleSubscriptionById = async (req, res) => {
  try {
    const { id } = req.params;
    const vehicleSubscription = await VehicleSubscription.findById(id)
      .populate("vehicle_id", "plate_number model user_id company_id")
      .populate(
        "subscription_id",
        "name price billing_cycle limit_type limit_value"
      );

    if (!vehicleSubscription) {
      return res
        .status(404)
        .json({ message: "Vehicle subscription not found" });
    }

    res.status(200).json(vehicleSubscription);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update Vehicle Subscription by id
exports.updateVehicleSubscriptionById = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      vehicle_id,
      subscription_id,
      start_date,
      end_date,
      status,
      auto_renew,
      payment_status,
    } = req.body;

    // Validate vehicle exists (if provided)
    if (vehicle_id) {
      const vehicle = await Vehicle.findById(vehicle_id);
      if (!vehicle) {
        return res.status(400).json({ message: "Vehicle not found" });
      }

      // Check if the new vehicle already has a subscription (excluding current subscription)
      const existingSubscription = await VehicleSubscription.findOne({
        vehicle_id,
        _id: { $ne: id },
        status: { $in: ["active", "expired", "cancelled", "suspended"] },
      });

      if (existingSubscription) {
        return res.status(400).json({
          message:
            "Vehicle already has a subscription. Each vehicle can only have one subscription at a time.",
          existingSubscription: {
            id: existingSubscription._id,
            status: existingSubscription.status,
            start_date: existingSubscription.start_date,
            end_date: existingSubscription.end_date,
          },
        });
      }
    }

    // Validate subscription plan exists (if provided)
    if (subscription_id) {
      const subscriptionPlan = await SubscriptionPlan.findById(subscription_id);
      if (!subscriptionPlan) {
        return res.status(400).json({ message: "Subscription plan not found" });
      }
    }

    // Validate dates (if provided)
    if (start_date && end_date) {
      const startDate = new Date(start_date);
      const endDate = new Date(end_date);

      if (startDate >= endDate) {
        return res.status(400).json({
          message: "End date must be after start date",
        });
      }
    }

    const updated = await VehicleSubscription.findByIdAndUpdate(
      id,
      {
        vehicle_id,
        subscription_id,
        start_date,
        end_date,
        status,
        auto_renew,
        payment_status,
      },
      { new: true, runValidators: true }
    )
      .populate("vehicle_id", "plate_number model user_id company_id")
      .populate(
        "subscription_id",
        "name price billing_cycle limit_type limit_value"
      );

    if (!updated) {
      return res
        .status(404)
        .json({ message: "Vehicle subscription not found" });
    }

    // Update vehicle with the subscription_id if vehicle_id or subscription_id changed
    if (vehicle_id || subscription_id) {
      await Vehicle.findByIdAndUpdate(updated.vehicle_id, {
        subscription_id: updated.subscription_id,
      });
    }

    res.status(200).json(updated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Delete Vehicle Subscription by id
exports.deleteVehicleSubscriptionById = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await VehicleSubscription.findByIdAndDelete(id);
    if (!deleted) {
      return res
        .status(404)
        .json({ message: "Vehicle subscription not found" });
    }

    // Remove subscription_id from the vehicle
    await Vehicle.findByIdAndUpdate(deleted.vehicle_id, {
      $unset: { subscription_id: 1 },
    });

    res
      .status(200)
      .json({ message: "Vehicle subscription deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get subscriptions by vehicle ID
exports.getSubscriptionsByVehicleId = async (req, res) => {
  try {
    const { vehicleId } = req.params;
    const { status, is_active } = req.query;

    let filter = { vehicle_id: vehicleId };

    if (status) filter.status = status;

    // Filter for currently active subscriptions
    if (is_active === "true") {
      const now = new Date();
      filter.status = "active";
      filter.start_date = { $lte: now };
      filter.end_date = { $gte: now };
    }

    const subscriptions = await VehicleSubscription.find(filter)
      .populate(
        "subscription_id",
        "name price billing_cycle limit_type limit_value"
      )
      .sort({ createdAt: -1 });

    res.status(200).json(subscriptions);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Extend subscription
exports.extendSubscription = async (req, res) => {
  try {
    const { id } = req.params;
    const { days } = req.body;

    if (!days || days <= 0) {
      return res
        .status(400)
        .json({ message: "Days must be a positive number" });
    }

    const subscription = await VehicleSubscription.findById(id);
    if (!subscription) {
      return res
        .status(404)
        .json({ message: "Vehicle subscription not found" });
    }

    await subscription.extendSubscription(days);

    const updatedSubscription = await VehicleSubscription.findById(id)
      .populate("vehicle_id", "plate_number model user_id company_id")
      .populate(
        "subscription_id",
        "name price billing_cycle limit_type limit_value"
      );

    res.status(200).json({
      message: `Subscription extended by ${days} days`,
      subscription: updatedSubscription,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Cancel subscription
exports.cancelSubscription = async (req, res) => {
  try {
    const { id } = req.params;
    const subscription = await VehicleSubscription.findById(id);

    if (!subscription) {
      return res
        .status(404)
        .json({ message: "Vehicle subscription not found" });
    }

    if (subscription.status === "cancelled") {
      return res
        .status(400)
        .json({ message: "Subscription is already cancelled" });
    }

    subscription.status = "cancelled";
    await subscription.save();

    const updatedSubscription = await VehicleSubscription.findById(id)
      .populate("vehicle_id", "plate_number model user_id company_id")
      .populate(
        "subscription_id",
        "name price billing_cycle limit_type limit_value"
      );

    res.status(200).json({
      message: "Subscription cancelled successfully",
      subscription: updatedSubscription,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Check if vehicle has subscription
exports.checkVehicleSubscription = async (req, res) => {
  try {
    const { vehicleId } = req.params;

    const subscription = await VehicleSubscription.findOne({
      vehicle_id: vehicleId,
      status: { $in: ["active", "expired", "cancelled", "suspended"] },
    })
      .populate("vehicle_id", "plate_number model user_id company_id")
      .populate(
        "subscription_id",
        "name price billing_cycle limit_type limit_value"
      );

    if (!subscription) {
      return res.status(200).json({
        hasSubscription: false,
        message: "Vehicle has no subscription",
      });
    }

    res.status(200).json({
      hasSubscription: true,
      subscription,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get my vehicle subscriptions (current user's vehicle subscriptions)
exports.getMyVehicleSubscriptions = async (req, res) => {
  try {
    // Get user ID from JWT token (set by auth middleware)
    const userId = req.user.accountId;
    const { status, page = 1, limit = 10 } = req.query;

    // First get all vehicles owned by the user
    const userVehicles = await Vehicle.find({ user_id: userId }).select("_id");
    const vehicleIds = userVehicles.map((vehicle) => vehicle._id);

    if (vehicleIds.length === 0) {
      return res.status(200).json({
        vehicleSubscriptions: [],
        pagination: {
          currentPage: parseInt(page),
          totalPages: 0,
          totalItems: 0,
          itemsPerPage: parseInt(limit),
        },
      });
    }

    let filter = { vehicle_id: { $in: vehicleIds } };
    if (status) filter.status = status;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const vehicleSubscriptions = await VehicleSubscription.find(filter)
      .populate("vehicle_id", "plate_number model user_id company_id")
      .populate(
        "subscription_id",
        "name price billing_cycle limit_type limit_value"
      )
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await VehicleSubscription.countDocuments(filter);

    res.status(200).json({
      vehicleSubscriptions,
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

// Toggle auto renew for subscription
exports.toggleAutoRenew = async (req, res) => {
  try {
    const { id } = req.params;
    const { auto_renew } = req.body;

    // Validate auto_renew is boolean
    if (typeof auto_renew !== "boolean") {
      return res.status(400).json({
        message: "auto_renew must be a boolean value (true or false)",
      });
    }

    const subscription = await VehicleSubscription.findById(id);
    if (!subscription) {
      return res.status(404).json({
        message: "Vehicle subscription not found",
      });
    }

    // Update auto_renew
    subscription.auto_renew = auto_renew;
    await subscription.save();

    const updatedSubscription = await VehicleSubscription.findById(id)
      .populate("vehicle_id", "plate_number model user_id company_id")
      .populate(
        "subscription_id",
        "name price billing_cycle limit_type limit_value"
      );

    res.status(200).json({
      message: `Auto renew ${auto_renew ? "enabled" : "disabled"} successfully`,
      subscription: updatedSubscription,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
