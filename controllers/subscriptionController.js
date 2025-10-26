const SubscriptionPlan = require("../models/SubscriptionPlan");

// Create Subscription Plan
exports.createSubscriptionPlan = async (req, res) => {
  try {
    const { type, name, price, billing_cycle, limit_type, description } =
      req.body;

    // Check if plan with same name already exists
    const existingPlan = await SubscriptionPlan.findOne({ name });
    if (existingPlan) {
      return res
        .status(400)
        .json({ message: "Subscription plan with this name already exists" });
    }

    const subscriptionPlan = await SubscriptionPlan.create({
      type,
      name,
      price,
      billing_cycle,
      limit_type,
      description,
    });
    res.status(201).json(subscriptionPlan);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get all Subscription Plans
exports.getAllSubscriptionPlans = async (req, res) => {
  try {
    const { is_active, type, limit_type } = req.query;

    let filter = {};

    // Apply filters if provided
    if (is_active !== undefined) {
      filter.is_active = is_active === "true";
    }
    if (type) {
      filter.type = type;
    }
    if (limit_type) {
      filter.limit_type = limit_type;
    }

    const subscriptionPlans = await SubscriptionPlan.find(filter).sort({
      price: 1,
    });
    res.status(200).json(subscriptionPlans);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get Subscription Plan by id
exports.getSubscriptionPlanById = async (req, res) => {
  try {
    const { id } = req.params;
    const subscriptionPlan = await SubscriptionPlan.findById(id);
    if (!subscriptionPlan) {
      return res.status(404).json({ message: "Subscription plan not found" });
    }
    res.status(200).json(subscriptionPlan);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update Subscription Plan by id
exports.updateSubscriptionPlanById = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      type,
      name,
      price,
      billing_cycle,
      limit_type,
      description,
      is_active,
    } = req.body;

    // Check if name already exists (if provided and different from current)
    if (name) {
      const existingPlan = await SubscriptionPlan.findOne({
        _id: { $ne: id },
        name,
      });
      if (existingPlan) {
        return res
          .status(400)
          .json({ message: "Subscription plan with this name already exists" });
      }
    }

    const updated = await SubscriptionPlan.findByIdAndUpdate(
      id,
      {
        type,
        name,
        price,
        billing_cycle,
        limit_type,
        description,
        is_active,
      },
      { new: true, runValidators: true }
    );
    if (!updated) {
      return res.status(404).json({ message: "Subscription plan not found" });
    }
    res.status(200).json(updated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Delete Subscription Plan by id
exports.deleteSubscriptionPlanById = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await SubscriptionPlan.findByIdAndDelete(id);
    if (!deleted) {
      return res.status(404).json({ message: "Subscription plan not found" });
    }
    res.status(200).json({ message: "Subscription plan deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Toggle Subscription Plan active status
exports.toggleSubscriptionPlanStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const subscriptionPlan = await SubscriptionPlan.findById(id);

    if (!subscriptionPlan) {
      return res.status(404).json({ message: "Subscription plan not found" });
    }

    subscriptionPlan.is_active = !subscriptionPlan.is_active;
    await subscriptionPlan.save();

    res.status(200).json({
      message: `Subscription plan ${
        subscriptionPlan.is_active ? "activated" : "deactivated"
      } successfully`,
      subscriptionPlan,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
